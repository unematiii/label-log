import { OcrResult } from '@bear-block/vision-camera-ocr';

import { ScoredOcrResult } from '@/types';

import { NutrientTermGroups } from './constants';

export type LabelReaderMode = 'nutrition' | 'product-name';

export function calculateResultScore(
  result: null | OcrResult,
  mode: LabelReaderMode = 'nutrition'
): null | ScoredOcrResult {
  if (result === null || result.blocks === undefined) {
    return null;
  }

  const { blocks, text } = result;

  const labels = scoreText(text);
  const trimmedText = text.trim();
  const isProductText = trimmedText.length > 0;

  return {
    blocks,
    text,
    score: mode === 'nutrition' ? labels.score : trimmedText.length,
    pass: mode === 'nutrition' ? labels.pass : isProductText,
  };
}

function scoreText(text: string) {
  const normalized = text.toLowerCase();

  const hasBasis =
    /\b100\s*(?:g|ml)\b/i.test(normalized) ||
    /per\s+(?:serving|portion)/i.test(normalized);

  const hasEnergy = /\b(?:kcal|kj)\b/i.test(normalized);

  const nutrientCount = Object.values(NutrientTermGroups).filter((terms) =>
    terms.some((term) => normalized.includes(term))
  ).length;

  const valueCount =
    normalized.match(/\d+(?:[.,]\d+)?\s*(?:g|mg|kj|kcal)\b/gi)?.length ?? 0;

  return {
    score: nutrientCount + valueCount,
    pass: (hasBasis || hasEnergy) && nutrientCount >= 4 && valueCount >= 6,
  };
}
