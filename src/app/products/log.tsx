import {
  Form,
  Host,
  ProgressView,
  Section,
  Text,
  VStack,
} from '@expo/ui/swift-ui';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { findProductById, Product } from '@/database';

export default function LogProductScreen() {
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

  return (
    <>
      <Stack.Screen options={{ title: product?.name ?? 'Log Product' }} />
      <Host style={{ flex: 1 }}>
        {product === undefined ? (
          <ProgressView />
        ) : product === null ? (
          <VStack spacing={8}>
            <Text>Product not found</Text>
          </VStack>
        ) : (
          <Form>
            <Section title="Product">
              <Text>{product.name}</Text>
              <Text>{product.code}</Text>
            </Section>
            <Section title="Coming next">
              <Text>Apple Health logging will be added here.</Text>
            </Section>
          </Form>
        )}
      </Host>
    </>
  );
}
