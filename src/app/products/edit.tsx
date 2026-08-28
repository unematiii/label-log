import { Host, ProgressView, Text, VStack } from '@expo/ui/swift-ui';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { ProductForm } from '@/components/product-form';
import {
  findProductById,
  Product,
  ProductInput,
  updateProduct,
} from '@/database';

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [product, setProduct] = useState<Product | null>();

  useEffect(() => {
    const productId = Number(id);
    let cancelled = false;
    const request = Number.isInteger(productId)
      ? findProductById(productId)
      : Promise.resolve(null);

    request
      .then((result) => {
        if (!cancelled) setProduct(result);
      })
      .catch(() => {
        if (!cancelled) setProduct(null);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSubmit = async (values: ProductInput) => {
    if (!product) return;

    const updated = await updateProduct(product.id, values);
    router.replace({
      pathname: '/products/log',
      params: { id: updated.id },
    });
  };

  return (
    <>
      <Stack.Screen options={{ title: product?.name ?? 'Edit Product' }} />
      {product === undefined ? (
        <Host style={{ flex: 1 }}>
          <ProgressView />
        </Host>
      ) : product === null ? (
        <Host style={{ flex: 1 }}>
          <VStack spacing={8}>
            <Text>Product not found</Text>
          </VStack>
        </Host>
      ) : (
        <ProductForm
          initialValues={product}
          submitLabel="Save Changes"
          onSubmit={handleSubmit}
        />
      )}
    </>
  );
}
