import { OcrResult, OcrBlock } from '@bear-block/vision-camera-ocr';

import { NutrientTermGroups } from './constants';
import { ScoredOcrResult } from './types';

export function calculateResultScore(
    result: null | OcrResult
): null | ScoredOcrResult {
    if (result === null || result.blocks === undefined) {
        return null;
    }

    const { blocks, text } = result;

    const labels = hasRequiredLabels(text);

    return {
        blocks,
        text,
        score: labels.score,
        pass: labels.pass,
        debug: {
            labels,
        },
    };
}

function hasRequiredLabels(text: string) {
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
        hasBasis,
        hasEnergy,
        nutrientCount,
        valueCount,
        score: nutrientCount + valueCount,
        pass: (hasBasis || hasEnergy) && nutrientCount >= 4 && valueCount >= 6,
    };
}
