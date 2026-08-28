import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';

import { ExtractNutritionResponse } from '@/api/types';
import { ProductForm } from '@/components/product-form';
import { addProduct, ProductInput } from '@/database';

function parseNutrition(value: string | string[] | undefined) {
  if (typeof value !== 'string') return {};

  try {
    const nutrition = JSON.parse(value) as ExtractNutritionResponse;

    return Object.fromEntries(
      Object.entries(nutrition).filter((entry) => entry[1] !== null)
    ) as Partial<ProductInput>;
  } catch {
    return {};
  }
}

export default function AddProductScreen() {
  const { code, nutrition } = useLocalSearchParams<{
    code?: string;
    nutrition?: string;
  }>();
  const initialValues = useMemo(
    () => ({
      ...parseNutrition(nutrition),
      code: typeof code === 'string' ? code : '',
    }),
    [code, nutrition]
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
      <ProductForm initialValues={initialValues} onSubmit={handleSubmit} />
    </>
  );
}
