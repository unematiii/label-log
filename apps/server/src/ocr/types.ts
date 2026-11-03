import type { Static } from '@sinclair/typebox';
import type { RouteGenericInterface } from 'fastify';
import type {
  ExtractNutritionRequest as SharedExtractNutritionRequest,
  ExtractNutritionResponse as SharedExtractNutritionResponse,
} from '@label-log/contracts';

import {
  ExtractNutritionBodySchema,
  ExtractNutritionErrorSchema,
  ExtractNutritionResponseSchema,
  OcrLineSchema,
  OcrRectSchema,
} from './schemas.js';

export type OcrRect = Static<typeof OcrRectSchema>;
export type OcrLine = Static<typeof OcrLineSchema>;

export type ExtractNutritionBody = Static<typeof ExtractNutritionBodySchema>;

export type ExtractNutritionResponse = Static<
  typeof ExtractNutritionResponseSchema
>;

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type Assert<T extends true> = T;
export type _RequestContractMatches = Assert<
  Equal<ExtractNutritionBody, SharedExtractNutritionRequest>
>;
export type _ResponseContractMatches = Assert<
  Equal<ExtractNutritionResponse, SharedExtractNutritionResponse>
>;

export type ExtractNutritionError = Static<typeof ExtractNutritionErrorSchema>;

export interface ExtractNutritionRoute extends RouteGenericInterface {
  Body: ExtractNutritionBody;

  Reply: {
    200: ExtractNutritionResponse;
    502: ExtractNutritionError;
  };
}
