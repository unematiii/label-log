export interface OcrRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OcrLine {
  text: string;
  rect: OcrRect;
}

export interface ExtractNutritionRequest {
  fullText: string;
  lines: OcrLine[];
  coordinateSpace: 'normalized-top-left';
  code?: string;
}

export type NutritionCorrectionField =
  | 'basisAmount'
  | 'basisUnit'
  | 'servingAmount'
  | 'servingUnit'
  | 'energyKj'
  | 'energyKcal'
  | 'fatG'
  | 'saturatedFatG'
  | 'carbohydratesG'
  | 'sugarsG'
  | 'fibreG'
  | 'proteinG'
  | 'saltG'
  | 'sodiumMg';

export interface NutritionCorrection {
  field: NutritionCorrectionField;
  detectedText: string | null;
  source: 'label_context' | 'web_match';
}

export interface ExtractNutritionResponse {
  productName: string | null;
  productNameSource: 'web_match' | null;
  basisAmount: number | null;
  basisUnit: 'g' | 'ml' | 'serving' | null;
  servingAmount: number | null;
  servingUnit: 'g' | 'ml' | null;
  energyKj: number | null;
  energyKcal: number | null;
  fatG: number | null;
  saturatedFatG: number | null;
  carbohydratesG: number | null;
  sugarsG: number | null;
  fibreG: number | null;
  proteinG: number | null;
  saltG: number | null;
  sodiumMg: number | null;
  corrections: NutritionCorrection[];
}

export interface ApiErrorResponse {
  code?: string;
  message?: string;
}

export interface RequestLoginCodeRequest {
  email: string;
}

export interface VerifyLoginCodeRequest extends RequestLoginCodeRequest {
  code: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AuthTokens {
  tokenType: 'Bearer';
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
