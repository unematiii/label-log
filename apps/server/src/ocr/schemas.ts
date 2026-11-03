import { Type, type TSchema } from '@sinclair/typebox';

const Nullable = <T extends TSchema>(schema: T) =>
  Type.Union([schema, Type.Null()]);

export const OcrRectSchema = Type.Object(
  {
    x: Type.Number({
      minimum: 0,
      maximum: 1,
    }),
    y: Type.Number({
      minimum: 0,
      maximum: 1,
    }),
    width: Type.Number({
      minimum: 0,
      maximum: 1,
    }),
    height: Type.Number({
      minimum: 0,
      maximum: 1,
    }),
  },
  {
    additionalProperties: false,
  }
);

export const OcrLineSchema = Type.Object(
  {
    text: Type.String({
      minLength: 1,
      maxLength: 500,
    }),
    rect: OcrRectSchema,
  },
  {
    additionalProperties: false,
  }
);

export const ExtractNutritionBodySchema = Type.Object(
  {
    fullText: Type.String({
      minLength: 0,
      maxLength: 20_000,
    }),
    lines: Type.Array(OcrLineSchema, {
      minItems: 0,
      maxItems: 200,
    }),
    coordinateSpace: Type.Literal('normalized-top-left'),
    code: Type.Optional(
      Type.String({
        minLength: 1,
        maxLength: 64,
      })
    ),
  },
  {
    additionalProperties: false,
  }
);

const NullableNonNegativeNumber = () =>
  Nullable(
    Type.Number({
      minimum: 0,
    })
  );

const NutritionValueProperties = {
  productName: Nullable(Type.String({ maxLength: 200 })),
  basisAmount: NullableNonNegativeNumber(),
  basisUnit: Type.Union([
    Type.Literal('g'),
    Type.Literal('ml'),
    Type.Literal('serving'),
    Type.Null(),
  ]),
  servingAmount: NullableNonNegativeNumber(),
  servingUnit: Type.Union([Type.Literal('g'), Type.Literal('ml'), Type.Null()]),
  energyKj: NullableNonNegativeNumber(),
  energyKcal: NullableNonNegativeNumber(),
  fatG: NullableNonNegativeNumber(),
  saturatedFatG: NullableNonNegativeNumber(),
  carbohydratesG: NullableNonNegativeNumber(),
  sugarsG: NullableNonNegativeNumber(),
  fibreG: NullableNonNegativeNumber(),
  proteinG: NullableNonNegativeNumber(),
  saltG: NullableNonNegativeNumber(),
  sodiumMg: NullableNonNegativeNumber(),
};

const DetectedNutritionProperties = {
  basisAmount: Nullable(Type.String({ maxLength: 100 })),
  basisUnit: Nullable(Type.String({ maxLength: 100 })),
  servingAmount: Nullable(Type.String({ maxLength: 100 })),
  servingUnit: Nullable(Type.String({ maxLength: 100 })),
  energyKj: Nullable(Type.String({ maxLength: 100 })),
  energyKcal: Nullable(Type.String({ maxLength: 100 })),
  fatG: Nullable(Type.String({ maxLength: 100 })),
  saturatedFatG: Nullable(Type.String({ maxLength: 100 })),
  carbohydratesG: Nullable(Type.String({ maxLength: 100 })),
  sugarsG: Nullable(Type.String({ maxLength: 100 })),
  fibreG: Nullable(Type.String({ maxLength: 100 })),
  proteinG: Nullable(Type.String({ maxLength: 100 })),
  saltG: Nullable(Type.String({ maxLength: 100 })),
  sodiumMg: Nullable(Type.String({ maxLength: 100 })),
};

const NutritionCorrectionSchema = Type.Array(
  Type.Object(
    {
      field: Type.Union([
        Type.Literal('basisAmount'),
        Type.Literal('basisUnit'),
        Type.Literal('servingAmount'),
        Type.Literal('servingUnit'),
        Type.Literal('energyKj'),
        Type.Literal('energyKcal'),
        Type.Literal('fatG'),
        Type.Literal('saturatedFatG'),
        Type.Literal('carbohydratesG'),
        Type.Literal('sugarsG'),
        Type.Literal('fibreG'),
        Type.Literal('proteinG'),
        Type.Literal('saltG'),
        Type.Literal('sodiumMg'),
      ]),
      detectedText: Nullable(Type.String({ minLength: 1, maxLength: 100 })),
      source: Type.Union([
        Type.Literal('label_context'),
        Type.Literal('web_match'),
      ]),
    },
    { additionalProperties: false }
  ),
  { maxItems: 14 }
);

export const ExtractNutritionResponseSchema = Type.Object(
  {
    ...NutritionValueProperties,
    productNameSource: Type.Union([Type.Literal('web_match'), Type.Null()]),
    corrections: NutritionCorrectionSchema,
  },
  { additionalProperties: false }
);

export const ExtractNutritionModelResponseSchema = Type.Object(
  {
    ...NutritionValueProperties,
    detectedValues: Type.Object(DetectedNutritionProperties, {
      additionalProperties: false,
    }),
  },
  { additionalProperties: false }
);

export const ExtractNutritionErrorSchema = Type.Object(
  {
    code: Type.Union([
      Type.Literal('NUTRITION_EXTRACTION_FAILED'),
      Type.Literal('INVALID_MODEL_RESPONSE'),
    ]),
    message: Type.String(),
  },
  {
    additionalProperties: false,
  }
);
