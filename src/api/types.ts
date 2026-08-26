export type ExtractNutritionRequest = {
  fullText: string;
  lines: Array<{
    text: string;
    rect: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
  coordinateSpace: 'normalized-top-left';
};

export type ExtractNutritionResponse = {
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
};
