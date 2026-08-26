import { OcrResult } from '@bear-block/vision-camera-ocr';

import { ExtractNutritionNutritionRequest } from './types';

export function normalizeOcrResult(
  result: OcrResult
): ExtractNutritionNutritionRequest {
  const lines =
    result.blocks
      ?.flatMap((block) => block.lines ?? [])
      .map((line, id) => ({
        id,
        text: line.text,
        rect: line.box
          ? {
              x: line.box.x,
              y: 1 - line.box.y - line.box.height,
              width: line.box.width,
              height: line.box.height,
            }
          : {
              x: 0,
              y: 0,
              width: 0,
              height: 0,
            },
      })) ?? [];

  return {
    fullText: result.text,
    coordinateSpace: 'normalized-top-left',
    lines,
  };
}
