import {
  Button,
  DisclosureGroup,
  Form,
  Host,
  LabeledContent,
  ProgressView,
  Section,
  Text,
  TextField,
  Toggle,
  useNativeState,
  VStack,
} from '@expo/ui/swift-ui';
import {
  disabled,
  foregroundStyle,
  keyboardType,
  multilineTextAlignment,
} from '@expo/ui/swift-ui/modifiers';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';

import { findProductById, Product } from '@/database';
import {
  getNutrientPreferences,
  logNutritionToHealthKit,
  nutritionMultiplier,
  type NutrientKey,
  type NutrientPreferences,
  nutrientOptions,
} from '@/health';

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
  const [servingAmountValue, setServingAmountValue] = useState(
    String(product.servingAmount)
  );
  const [isLogging, setIsLogging] = useState(false);
  const [preferences, setPreferences] = useState<NutrientPreferences | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getNutrientPreferences()
      .then(setPreferences)
      .catch(() => setError('Could not load nutrition settings.'));
  }, []);

  const handleNutrientChange = (key: NutrientKey, isOn: boolean) => {
    setPreferences((current) =>
      current ? { ...current, [key]: isOn } : current
    );
  };

  const nutrientEstimates = useMemo<Record<NutrientKey, string>>(() => {
    const amount = parsePositiveNumber(servingAmountValue);
    if (amount === null || product.basisAmount <= 0) {
      return Object.fromEntries(
        nutrientOptions.map(({ key }) => [key, '—'])
      ) as Record<NutrientKey, string>;
    }

    const multiplier = nutritionMultiplier(product, amount, 1);
    const estimates: Record<NutrientKey, { value: number; unit: string }> = {
      energy: { value: product.energyKcal * multiplier, unit: 'kcal' },
      fat: { value: product.fatG * multiplier, unit: 'g' },
      saturatedFat: { value: product.saturatedFatG * multiplier, unit: 'g' },
      carbohydrates: {
        value: product.carbohydratesG * multiplier,
        unit: 'g',
      },
      sugars: { value: product.sugarsG * multiplier, unit: 'g' },
      fibre: { value: product.fibreG * multiplier, unit: 'g' },
      protein: { value: product.proteinG * multiplier, unit: 'g' },
      sodium: { value: product.sodiumMg * multiplier, unit: 'mg' },
    };

    return Object.fromEntries(
      Object.entries(estimates).map(([key, estimate]) => [
        key,
        `${Number(estimate.value.toFixed(1))} ${estimate.unit}`,
      ])
    ) as Record<NutrientKey, string>;
  }, [product, servingAmountValue]);

  const handleLog = async () => {
    const parsedServingAmount = parsePositiveNumber(servingAmount.get());
    const parsedQuantity = parsePositiveNumber(quantity.get());

    if (!preferences) {
      setError('Nutrition settings are not ready.');
      return;
    }

    if (parsedServingAmount === null || parsedQuantity === null) {
      setError('Serving amount and quantity must be greater than zero.');
      return;
    }

    setError(null);
    setIsLogging(true);

    try {
      await logNutritionToHealthKit(
        product,
        parsedServingAmount,
        parsedQuantity,
        preferences
      );
      router.back();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Could not add nutrition to Apple Health.'
      );
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
      <Section>
        <Button
          label="Edit Product"
          onPress={() =>
            router.push({
              pathname: '/products/edit',
              params: { id: product.id },
            })
          }
        />
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
            onTextChange={setServingAmountValue}
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
      <Section>
        <DisclosureGroup label="Nutrition values" isExpanded={false}>
          {preferences ? (
            nutrientOptions.map(({ key, label }) => (
              <Toggle
                key={key}
                isOn={preferences[key]}
                onIsOnChange={(isOn) => handleNutrientChange(key, isOn)}
              >
                <Text>{label}</Text>
                <Text
                  modifiers={[
                    foregroundStyle({
                      type: 'hierarchical',
                      style: 'secondary',
                    }),
                  ]}
                >
                  {nutrientEstimates[key]}
                </Text>
              </Toggle>
            ))
          ) : (
            <ProgressView />
          )}
        </DisclosureGroup>
      </Section>
      {error ? (
        <Section title="Could not log">
          <Text>{error}</Text>
        </Section>
      ) : null}
      <Section>
        <Button
          label={isLogging ? 'Logging…' : 'Log to Apple Health'}
          onPress={handleLog}
          modifiers={[disabled(isLogging || !preferences)]}
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
