import { OcrResult } from '@bear-block/vision-camera-ocr';

export interface ScoredOcrResult extends Required<OcrResult> {
    score: number;
    pass: boolean;
    debug: any;
}
