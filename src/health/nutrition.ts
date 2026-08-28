import {
  isHealthDataAvailable,
  requestAuthorization,
  saveCorrelationSample,
  type QuantitySampleForSaving,
} from '@kingstinct/react-native-healthkit';

import { Product } from '@/database';

const nutrientTypes = [
  'HKQuantityTypeIdentifierDietaryEnergyConsumed',
  'HKQuantityTypeIdentifierDietaryFatTotal',
  'HKQuantityTypeIdentifierDietaryFatSaturated',
  'HKQuantityTypeIdentifierDietaryCarbohydrates',
  'HKQuantityTypeIdentifierDietarySugar',
  'HKQuantityTypeIdentifierDietaryFiber',
  'HKQuantityTypeIdentifierDietaryProtein',
  'HKQuantityTypeIdentifierDietarySodium',
] as const;

const writableTypes = [
  'HKCorrelationTypeIdentifierFood',
  ...nutrientTypes,
] as const;

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
  quantity: number
): Promise<void> {
  if (!isHealthDataAvailable()) {
    throw new Error('Apple Health is not available on this device.');
  }

  const multiplier = nutritionMultiplier(product, servingAmount, quantity);
  const date = new Date();
  const nutrientValues = [
    {
      quantityType: 'HKQuantityTypeIdentifierDietaryEnergyConsumed',
      unit: 'kcal',
      quantity: product.energyKcal * multiplier,
    },
    {
      quantityType: 'HKQuantityTypeIdentifierDietaryFatTotal',
      unit: 'g',
      quantity: product.fatG * multiplier,
    },
    {
      quantityType: 'HKQuantityTypeIdentifierDietaryFatSaturated',
      unit: 'g',
      quantity: product.saturatedFatG * multiplier,
    },
    {
      quantityType: 'HKQuantityTypeIdentifierDietaryCarbohydrates',
      unit: 'g',
      quantity: product.carbohydratesG * multiplier,
    },
    {
      quantityType: 'HKQuantityTypeIdentifierDietarySugar',
      unit: 'g',
      quantity: product.sugarsG * multiplier,
    },
    {
      quantityType: 'HKQuantityTypeIdentifierDietaryFiber',
      unit: 'g',
      quantity: product.fibreG * multiplier,
    },
    {
      quantityType: 'HKQuantityTypeIdentifierDietaryProtein',
      unit: 'g',
      quantity: product.proteinG * multiplier,
    },
    {
      quantityType: 'HKQuantityTypeIdentifierDietarySodium',
      unit: 'g',
      quantity: (product.sodiumMg / 1000) * multiplier,
    },
  ] satisfies Omit<QuantitySampleForSaving, 'startDate' | 'endDate'>[];

  const samples = nutrientValues
    .filter((sample) => sample.quantity > 0)
    .map((sample) => ({ ...sample, startDate: date, endDate: date }));

  if (samples.length === 0) {
    throw new Error('This product has no nutrition values to log.');
  }

  await requestAuthorization({ toShare: writableTypes });

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
