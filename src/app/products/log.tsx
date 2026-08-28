import {
  Button,
  Form,
  Host,
  LabeledContent,
  ProgressView,
  Section,
  Text,
  TextField,
  useNativeState,
  VStack,
} from '@expo/ui/swift-ui';
import {
  disabled,
  foregroundStyle,
  keyboardType,
  multilineTextAlignment,
} from '@expo/ui/swift-ui/modifiers';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { findProductById, Product } from '@/database';
import { logNutritionToHealthKit } from '@/health';

function parsePositiveNumber(value: string): number | null {
  const number = Number(value.trim().replace(',', '.'));
  return Number.isFinite(number) && number > 0 ? number : null;
}

function FieldLabel({ children }: { children: string }) {
  return (
    <Text
      modifiers={[
        foregroundStyle({ type: 'hierarchical', style: 'secondary' }),
      ]}
    >
      {children}
    </Text>
  );
}

function ProductLogForm({ product }: { product: Product }) {
  const servingAmount = useNativeState(String(product.servingAmount));
  const quantity = useNativeState('1');
  const [isLogging, setIsLogging] = useState(false);
  const [message, setMessage] = useState<{
    kind: 'error' | 'success';
    text: string;
  } | null>(null);

  const handleLog = async () => {
    const parsedServingAmount = parsePositiveNumber(servingAmount.get());
    const parsedQuantity = parsePositiveNumber(quantity.get());

    if (parsedServingAmount === null || parsedQuantity === null) {
      setMessage({
        kind: 'error',
        text: 'Serving amount and quantity must be greater than zero.',
      });
      return;
    }

    setMessage(null);
    setIsLogging(true);

    try {
      await logNutritionToHealthKit(
        product,
        parsedServingAmount,
        parsedQuantity
      );
      setMessage({ kind: 'success', text: 'Added to Apple Health.' });
    } catch (cause) {
      setMessage({
        kind: 'error',
        text:
          cause instanceof Error
            ? cause.message
            : 'Could not add nutrition to Apple Health.',
      });
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <Form>
      <Section title="Product">
        <Text>{product.name}</Text>
        <Text
          modifiers={[
            foregroundStyle({
              type: 'hierarchical',
              style: 'secondary',
            }),
          ]}
        >
          {product.code}
        </Text>
      </Section>
      <Section title="Log amount">
        <LabeledContent
          label={
            <FieldLabel>{`Serving amount (${product.servingUnit})`}</FieldLabel>
          }
        >
          <TextField
            text={servingAmount}
            placeholder="0"
            modifiers={[
              keyboardType('decimal-pad'),
              multilineTextAlignment('trailing'),
            ]}
          />
        </LabeledContent>
        <LabeledContent label={<FieldLabel>Quantity</FieldLabel>}>
          <TextField
            text={quantity}
            placeholder="1"
            modifiers={[
              keyboardType('decimal-pad'),
              multilineTextAlignment('trailing'),
            ]}
          />
        </LabeledContent>
      </Section>
      {message ? (
        <Section title={message.kind === 'error' ? 'Could not log' : 'Logged'}>
          <Text>{message.text}</Text>
        </Section>
      ) : null}
      <Section>
        <Button
          label={isLogging ? 'Logging…' : 'Log to Apple Health'}
          onPress={handleLog}
          modifiers={[disabled(isLogging)]}
        />
      </Section>
    </Form>
  );
}

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
          <ProductLogForm product={product} />
        )}
      </Host>
    </>
  );
}
