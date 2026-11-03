import {
  isHealthDataAvailable,
  requestAuthorization,
  saveCorrelationSample,
  type QuantitySampleForSaving,
} from '@kingstinct/react-native-healthkit';

import { Product } from '@/database';
import {
  createDefaultNutrientPreferences,
  NutrientKey,
  NutrientPreferences,
} from './preferences';

export function nutritionMultiplier(
  product: Product,
  servingAmount: number,
  quantity: number
): number {
  if (product.basisAmount <= 0) {
    throw new Error('The product basis amount must be greater than zero.');
  }
  if (!Number.isFinite(servingAmount) || servingAmount <= 0) {
    throw new Error('Serving amount must be greater than zero.');
  }
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error('Quantity must be greater than zero.');
  }

  return (servingAmount * quantity) / product.basisAmount;
}

export async function logNutritionToHealthKit(
  product: Product,
  servingAmount: number,
  quantity: number,
  preferences: NutrientPreferences = createDefaultNutrientPreferences()
): Promise<void> {
  if (!isHealthDataAvailable()) {
    throw new Error('Apple Health is not available on this device.');
  }

  const multiplier = nutritionMultiplier(product, servingAmount, quantity);
  const date = new Date();
  const nutrientValues = [
    {
      key: 'energy',
      quantityType: 'HKQuantityTypeIdentifierDietaryEnergyConsumed',
      unit: 'kcal',
      quantity: product.energyKcal * multiplier,
    },
    {
      key: 'fat',
      quantityType: 'HKQuantityTypeIdentifierDietaryFatTotal',
      unit: 'g',
      quantity: product.fatG * multiplier,
    },
    {
      key: 'saturatedFat',
      quantityType: 'HKQuantityTypeIdentifierDietaryFatSaturated',
      unit: 'g',
      quantity: product.saturatedFatG * multiplier,
    },
    {
      key: 'carbohydrates',
      quantityType: 'HKQuantityTypeIdentifierDietaryCarbohydrates',
      unit: 'g',
      quantity: product.carbohydratesG * multiplier,
    },
    {
      key: 'sugars',
      quantityType: 'HKQuantityTypeIdentifierDietarySugar',
      unit: 'g',
      quantity: product.sugarsG * multiplier,
    },
    {
      key: 'fibre',
      quantityType: 'HKQuantityTypeIdentifierDietaryFiber',
      unit: 'g',
      quantity: product.fibreG * multiplier,
    },
    {
      key: 'protein',
      quantityType: 'HKQuantityTypeIdentifierDietaryProtein',
      unit: 'g',
      quantity: product.proteinG * multiplier,
    },
    {
      key: 'sodium',
      quantityType: 'HKQuantityTypeIdentifierDietarySodium',
      unit: 'g',
      quantity: (product.sodiumMg / 1000) * multiplier,
    },
  ] satisfies (Omit<QuantitySampleForSaving, 'startDate' | 'endDate'> & {
    key: NutrientKey;
  })[];

  const samples = nutrientValues
    .filter((sample) => preferences[sample.key] && sample.quantity > 0)
    .map(({ key: _, ...sample }) => ({
      ...sample,
      startDate: date,
      endDate: date,
    }));

  if (samples.length === 0) {
    throw new Error('This product has no nutrition values to log.');
  }

  await requestAuthorization({
    toShare: samples.map(({ quantityType }) => quantityType),
  });

  const saved = await saveCorrelationSample(
    'HKCorrelationTypeIdentifierFood',
    samples,
    date,
    date,
    {
      HKFoodType: product.name,
      HKWasUserEntered: true,
    }
  );

  if (!saved) throw new Error('Apple Health did not save the nutrition data.');
}
