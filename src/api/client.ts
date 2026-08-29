import { authenticatedFetch } from '@/auth';

import { ExtractNutritionRequest, ExtractNutritionResponse } from './types';

type ApiErrorResponse = {
  code?: string;
  message?: string;
};

const ApiBaseUrl = process.env.EXPO_PUBLIC_API_URL ?? 'https://127.0.0.1:3000';

export async function extractNutrition(
  request: ExtractNutritionRequest,
  signal?: AbortSignal
): Promise<ExtractNutritionResponse> {
  const response = await authenticatedFetch(`${ApiBaseUrl}/ocr/extract`, {
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
