import { OcrResult, OcrBox } from '@bear-block/vision-camera-ocr';

import { ExtractNutritionRequest } from './types';

export function normalizeOcrResult(result: OcrResult): ExtractNutritionRequest {
  const lines =
    result.blocks
      ?.flatMap((block) => block.lines ?? [])
      .flatMap((line) => {
        const rect =
          line.box &&
          clipNormalizedRect({
            x: line.box.x,
            y: 1 - line.box.y - line.box.height,
            width: line.box.width,
            height: line.box.height,
          });

        if (!rect || !line.text.trim()) {
          return [];
        }

        return [
          {
            text: line.text.trim(),
            rect,
          },
        ];
      }) ?? [];

  return {
    fullText: result.text,
    coordinateSpace: 'normalized-top-left',
    lines,
  };
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function clipNormalizedRect(rect: OcrBox): OcrBox | null {
  const left = clamp(rect.x);
  const top = clamp(rect.y);
  const right = clamp(rect.x + rect.width);
  const bottom = clamp(rect.y + rect.height);

  const width = right - left;
  const height = bottom - top;

  if (width <= 0 || height <= 0) {
    return null;
  }

  return {
    x: left,
    y: top,
    width,
    height,
  };
}
