import { TypeCompiler } from '@sinclair/typebox/compiler';
import type { Static } from '@sinclair/typebox';

import { ExtractNutritionModelResponseSchema } from './schemas.js';
import type {
  ExtractNutritionBody,
  ExtractNutritionResponse,
} from './types.js';

type MistralConversationResponse = {
  outputs?: {
    type?: string;
    content?: string;
  }[];
};

type ExtractNutritionModelResponse = Static<
  typeof ExtractNutritionModelResponseSchema
>;

const ExtractNutritionModelResponseValidator = TypeCompiler.Compile(
  ExtractNutritionModelResponseSchema
);

const detectedNutritionFields = [
  'basisAmount',
  'basisUnit',
  'servingAmount',
  'servingUnit',
  'energyKj',
  'energyKcal',
  'fatG',
  'saturatedFatG',
  'carbohydratesG',
  'sugarsG',
  'fibreG',
  'proteinG',
  'saltG',
  'sodiumMg',
] as const;

export async function extractNutrition(
  input: ExtractNutritionBody,
  options?: {
    baseUrl?: string;
    signal?: AbortSignal;
  }
): Promise<ExtractNutritionResponse> {
  const baseUrl =
    options?.baseUrl ??
    process.env.MISTRAL_BASE_URL ??
    'https://api.mistral.ai';

  const normalizedInput = {
    fullText: input.fullText.trim(),
    lines: input.lines,
  };

  const createBody = (useWebSearch: boolean) =>
    JSON.stringify({
      model: process.env.MISTRAL_MODEL ?? 'mistral-small-latest',
      inputs: [
        {
          role: 'user',
          content: [
            'Extract product name, basis/serving, and nutrition values from OCR. If a barcode is provided, web-search that exact GTIN even when the product name or label is unreadable.',
            'Use web data only for the exact GTIN and matching variant. Prefer manufacturer or reputable retailer. Never use similar products or model memory. Fill unreadable/missing values and product name from an exact match; otherwise use null.',
            'Prefer readable label values. Correct OCR only when label context or an exact product match clearly supports it.',
            'Extract basis and serving units separately. For every nutrition field, return detectedValues with the verbatim OCR text or null when absent; return interpreted values separately at the top level.',
            'Treat comma as decimal: 7,9 g is 7.9 g, never 79 g. The server shows detected text when corrected.',
            'Return exactly one JSON object matching the schema. Do not use markdown fences or repeat it.',
            ...(useWebSearch
              ? []
              : ['Do not use web search or memory to fill missing values.']),
            `Barcode: ${input.code ?? 'not provided'}`,
            JSON.stringify(normalizedInput),
          ].join('\n\n'),
        },
      ],
      instructions: `Do not deviate from the response schema. Where data is missing, supply null value.`,
      completion_args: {
        temperature: 0.2,
        max_tokens: 1200,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'response_schema',
            schema_definition: ExtractNutritionModelResponseSchema,
            strict: true,
          },
        },
      },
      ...(useWebSearch ? { tools: [{ type: 'web_search' }] } : {}),
    });

  const sendRequest = (body: string, timeoutSignal: AbortSignal) =>
    fetch(`${baseUrl}/v1/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
      },
      signal: options?.signal
        ? AbortSignal.any([options.signal, timeoutSignal])
        : timeoutSignal,
      body,
    });

  const webSearchTimeout = AbortSignal.timeout(12_000);
  let response: Response;
  let usedWebSearch = true;

  try {
    response = await sendRequest(createBody(true), webSearchTimeout);
  } catch (error) {
    if (options?.signal?.aborted || !webSearchTimeout.aborted) throw error;
    usedWebSearch = false;

    response = await sendRequest(
      createBody(false),
      AbortSignal.timeout(12_000)
    );
  }

  if (
    !response.ok &&
    (response.status === 429 || response.status >= 500) &&
    usedWebSearch
  ) {
    await response.body?.cancel();
    usedWebSearch = false;
    response = await sendRequest(
      createBody(false),
      AbortSignal.timeout(12_000)
    );
  }

  if (!response.ok) {
    const responseBody = (await response.text()).slice(0, 500);

    throw new Error(`Mistral API returned ${response.status}: ${responseBody}`);
  }

  const conversation = (await response.json()) as MistralConversationResponse;
  const content = getMistralOutputContent(conversation);

  if (!content) {
    throw new Error('Mistral API returned no message output content');
  }

  const parsed = parseSchemaCompliantOutput(content);

  return createExtractNutritionResponse(parsed, {
    inputText: normalizedInput.fullText,
    webSearchUsed: usedWebSearch,
  });
}

function parseSchemaCompliantOutput(
  content: string
): ExtractNutritionModelResponse {
  for (let start = content.indexOf('{'); start !== -1;) {
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let index = start; index < content.length; index += 1) {
      const character = content[index];

      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (character === '\\') {
          escaped = true;
        } else if (character === '"') {
          inString = false;
        }
        continue;
      }

      if (character === '"') {
        inString = true;
      } else if (character === '{') {
        depth += 1;
      } else if (character === '}') {
        depth -= 1;
        if (depth === 0) {
          try {
            const parsed = JSON.parse(
              content.slice(start, index + 1)
            ) as unknown;
            if (isExtractedNutritionModel(parsed)) return parsed;
          } catch {
            // Continue to the next object in case the model repeated its answer.
          }
          break;
        }
      }
    }

    start = content.indexOf('{', start + 1);
  }

  throw new Error('Mistral API returned no schema-valid JSON object');
}

function getMistralOutputContent(
  response: MistralConversationResponse
): string | undefined {
  return response.outputs?.findLast(
    (output) => output.type === 'message.output'
  )?.content;
}

function applyNutritionSanityChecks(
  result: ExtractNutritionResponse
): ExtractNutritionResponse {
  const cleaned = { ...result };

  if (
    cleaned.fatG !== null &&
    cleaned.saturatedFatG !== null &&
    cleaned.saturatedFatG > cleaned.fatG
  ) {
    cleaned.saturatedFatG = null;
  }

  if (
    cleaned.carbohydratesG !== null &&
    cleaned.sugarsG !== null &&
    cleaned.sugarsG > cleaned.carbohydratesG
  ) {
    cleaned.sugarsG = null;
  }

  // These limits are deliberately generous. They catch OCR/model mistakes,
  // while allowing unusual products.
  for (const field of [
    'fatG',
    'saturatedFatG',
    'carbohydratesG',
    'sugarsG',
    'fibreG',
    'proteinG',
    'saltG',
  ] as const) {
    if (
      cleaned[field] !== null &&
      cleaned.basisAmount === 100 &&
      cleaned[field] > 100
    ) {
      cleaned[field] = null;
    }
  }

  cleaned.corrections = cleaned.corrections.filter(
    ({ field }) => cleaned[field] !== null
  );

  return cleaned;
}

function createExtractNutritionResponse(
  modelResponse: ExtractNutritionModelResponse,
  sourceContext: { inputText: string; webSearchUsed: boolean }
): ExtractNutritionResponse {
  const { detectedValues, ...modelValues } = modelResponse;
  const values = {
    ...modelValues,
    productNameSource:
      sourceContext.webSearchUsed &&
      modelValues.productName &&
      !sourceContext.inputText
        .toLocaleLowerCase()
        .includes(modelValues.productName.toLocaleLowerCase())
        ? ('web_match' as const)
        : null,
  };
  const corrections: ExtractNutritionResponse['corrections'] = [];

  for (const field of detectedNutritionFields) {
    const detectedText = detectedValues[field];
    const correctedValue = values[field];
    if (correctedValue === null) continue;

    const source =
      sourceContext.webSearchUsed && !detectedText
        ? 'web_match'
        : 'label_context';

    if (!detectedText) {
      if (source === 'web_match') {
        corrections.push({ field, detectedText: null, source });
      }
      continue;
    }

    if (field === 'basisUnit' || field === 'servingUnit') {
      const unitMatch = detectedText
        .toLowerCase()
        .match(/\b(ml|g|serving|portion)\b/);
      if (!unitMatch) continue;

      const detectedUnit =
        unitMatch[1] === 'portion' ? 'serving' : unitMatch[1];
      if (detectedUnit !== correctedValue) {
        corrections.push({ field, detectedText, source });
      }
      continue;
    }

    if (typeof correctedValue !== 'number') continue;
    const detectedNumber = detectedText.match(/[-+]?\d+(?:[.,]\d+)?/);
    if (!detectedNumber) continue;

    const detectedValue = Number(detectedNumber[0].replace(',', '.'));
    if (detectedValue !== correctedValue) {
      corrections.push({ field, detectedText, source });
    }
  }

  return applyNutritionSanityChecks({ ...values, corrections });
}

function isExtractedNutritionModel(
  value: unknown
): value is ExtractNutritionModelResponse {
  return ExtractNutritionModelResponseValidator.Check(value);
}
