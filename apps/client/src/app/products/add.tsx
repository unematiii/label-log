import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';

import type { ExtractNutritionResponse } from '@/api/types';
import { ProductForm } from '@/components/product-form';
import { addProduct, ProductInput } from '@/database';

function parseNutrition(value: string | string[] | undefined) {
  if (typeof value !== 'string') {
    return { values: {}, correctionHints: {} };
  }

  try {
    const nutrition = JSON.parse(value) as ExtractNutritionResponse;
    const { productName, productNameSource, corrections, ...nutritionValues } =
      nutrition;
    const values = Object.fromEntries(
      Object.entries(nutritionValues).filter((entry) => entry[1] !== null)
    ) as Partial<ProductInput>;
    if (productName) values.name = productName;
    const correctionHints = Object.fromEntries(
      (corrections ?? []).map(({ field, detectedText, source }) => [
        field,
        detectedText
          ? `Detected: '${detectedText}'`
          : source === 'web_match'
            ? 'From exact barcode match'
            : '',
      ])
    ) as Partial<Record<keyof ProductInput, string>>;

    if (productNameSource === 'web_match') {
      correctionHints.name = 'From exact barcode match';
    }

    return { values, correctionHints };
  } catch {
    return { values: {}, correctionHints: {} };
  }
}

export default function AddProductScreen() {
  const { code, nutrition } = useLocalSearchParams<{
    code?: string;
    nutrition?: string;
  }>();
  const parsedNutrition = useMemo(() => parseNutrition(nutrition), [nutrition]);
  const initialValues = useMemo(
    () => ({
      ...parsedNutrition.values,
      code: typeof code === 'string' ? code : '',
    }),
    [code, parsedNutrition]
  );

  const handleSubmit = async (product: ProductInput) => {
    const saved = await addProduct(product);
    router.replace({
      pathname: '/products/log',
      params: { id: saved.id },
    });
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Add Product' }} />
      <ProductForm
        initialValues={initialValues}
        correctionHints={parsedNutrition.correctionHints}
        onSubmit={handleSubmit}
      />
    </>
  );
}
