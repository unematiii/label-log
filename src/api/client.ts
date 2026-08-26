import {
  ExtractNutritionNutritionRequest,
  ExtractNutritionResponse,
} from './types';

type ApiErrorResponse = {
  code?: string;
  message?: string;
};
``;
const ApiBaseUrl = 'http://192.168.0.106:3000';

export async function extractNutrition(
  request: ExtractNutritionNutritionRequest,
  signal?: AbortSignal
): Promise<ExtractNutritionResponse> {
  const response = await fetch(`${ApiBaseUrl}/ocr/extract`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    signal,
    body: JSON.stringify({
      fullText: request.fullText,
      lines: request.lines,
      coordinateSpace: 'normalized-top-left',
    }),
  });

  if (!response.ok) {
    let error: ApiErrorResponse | undefined;

    try {
      error = (await response.json()) as ApiErrorResponse;
    } catch {
      // The backend did not return JSON.
    }

    throw new Error(
      error?.message ??
        `Nutrition extraction failed with status ${response.status}`
    );
  }

  return (await response.json()) as ExtractNutritionResponse;
}
