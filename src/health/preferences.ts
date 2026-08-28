import Storage from 'expo-sqlite/kv-store';

export const nutrientOptions = [
  { key: 'energy', label: 'Calories' },
  { key: 'fat', label: 'Total Fat' },
  { key: 'saturatedFat', label: 'Saturated Fat' },
  { key: 'carbohydrates', label: 'Carbohydrates' },
  { key: 'sugars', label: 'Sugars' },
  { key: 'fibre', label: 'Fibre' },
  { key: 'protein', label: 'Protein' },
  { key: 'sodium', label: 'Sodium' },
] as const;

export type NutrientKey = (typeof nutrientOptions)[number]['key'];
export type NutrientPreferences = Record<NutrientKey, boolean>;

const storageKey = 'health-nutrient-preferences-v1';

export function createDefaultNutrientPreferences(): NutrientPreferences {
  return Object.fromEntries(
    nutrientOptions.map(({ key }) => [key, true])
  ) as NutrientPreferences;
}

export async function getNutrientPreferences(): Promise<NutrientPreferences> {
  const defaults = createDefaultNutrientPreferences();
  const stored = await Storage.getItem(storageKey);

  if (!stored) return defaults;

  try {
    const parsed = JSON.parse(stored) as Partial<NutrientPreferences>;

    return Object.fromEntries(
      nutrientOptions.map(({ key }) => [
        key,
        typeof parsed[key] === 'boolean' ? parsed[key] : defaults[key],
      ])
    ) as NutrientPreferences;
  } catch {
    return defaults;
  }
}

export async function saveNutrientPreferences(
  preferences: NutrientPreferences
): Promise<void> {
  await Storage.setItem(storageKey, JSON.stringify(preferences));
}
