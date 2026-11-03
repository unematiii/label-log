import { Button, Host, ProgressView, Text, VStack } from '@expo/ui/swift-ui';
import {
  buttonStyle,
  containerRelativeFrame,
  font,
  foregroundStyle,
  multilineTextAlignment,
  padding,
} from '@expo/ui/swift-ui/modifiers';
import { PlatformColor, Pressable, StyleSheet, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useState } from 'react';
import type { OcrResult } from '@bear-block/vision-camera-ocr';

import { NutritionFactLabellerCamera } from '@/components/label-reader';
import type { ScoredOcrResult } from '@/types';
import { useNutritionExtractionApi } from '@/api';

function ProcessingFeedback() {
  return (
    <Host style={styles.nativeFeedback}>
      <VStack
        spacing={14}
        modifiers={[
          containerRelativeFrame({ axes: 'both', alignment: 'center' }),
          padding({ horizontal: 32 }),
        ]}
      >
        <ProgressView />
        <Text modifiers={[font({ textStyle: 'headline' })]}>
          Reading product and nutrition information…
        </Text>
        <Text
          modifiers={[
            foregroundStyle('secondary'),
            multilineTextAlignment('center'),
          ]}
        >
          Checking the barcode, product name, and nutrition label together.
        </Text>
      </VStack>
    </Host>
  );
}

function ErrorFeedback({
  error,
  onManualEntry,
  onRetry,
}: {
  error: Error;
  onManualEntry: () => void;
  onRetry: () => void;
}) {
  return (
    <Host style={styles.nativeFeedback}>
      <VStack
        spacing={14}
        modifiers={[
          containerRelativeFrame({ axes: 'both', alignment: 'center' }),
          padding({ horizontal: 32 }),
        ]}
      >
        <Text
          modifiers={[
            font({
              textStyle: 'title2',
              weight: 'semibold',
            }),
            multilineTextAlignment('center'),
          ]}
        >
          Couldn’t read the product information
        </Text>
        <Text
          modifiers={[
            foregroundStyle('secondary'),
            multilineTextAlignment('center'),
          ]}
        >
          {error.message}
        </Text>
        <Button
          label="Scan Again"
          onPress={onRetry}
          modifiers={[buttonStyle('borderedProminent')]}
        />
        <Button label="Enter Manually" onPress={onManualEntry} />
      </VStack>
    </Host>
  );
}

export default function ScanLabelScreen() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const [scanStep, setScanStep] = useState<'product-name' | 'nutrition'>(
    'product-name'
  );
  const [productNameScan, setProductNameScan] =
    useState<ScoredOcrResult | null>(null);

  const { cancel, extract, reset, status, error } = useNutritionExtractionApi();
  const openManualForm = () => {
    cancel();
    router.replace({
      pathname: '/products/add',
      params: { code: typeof code === 'string' ? code : '' },
    });
  };

  const startExtraction = useCallback(
    async (result: OcrResult) => {
      const nutrition = await extract(
        result,
        typeof code === 'string' ? code : undefined
      );

      if (nutrition) {
        router.replace({
          pathname: '/products/add',
          params: {
            code: typeof code === 'string' ? code : '',
            nutrition: JSON.stringify(nutrition),
          },
        });
      }
    },
    [code, extract]
  );

  const handleScanComplete = useCallback(
    (result: ScoredOcrResult) => {
      if (scanStep === 'product-name') {
        setProductNameScan(result);
        setScanStep('nutrition');
        return;
      }

      const combinedResult: OcrResult = productNameScan
        ? {
            text: `Product name scan:\n${productNameScan.text}\n\nNutrition label scan:\n${result.text}`,
            blocks: [...productNameScan.blocks, ...result.blocks],
          }
        : result;

      void startExtraction(combinedResult);
    },
    [productNameScan, scanStep, startExtraction]
  );

  const skipNameScan = useCallback(() => {
    setProductNameScan(null);
    setScanStep('nutrition');
  }, []);

  const retry = useCallback(() => {
    reset();
    setScanStep(productNameScan ? 'nutrition' : 'product-name');
  }, [productNameScan, reset]);

  if (status === 'success') return null;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title:
            scanStep === 'product-name'
              ? 'Scan product name'
              : 'Scan nutrition label',
          headerRight: () => (
            <Pressable
              accessibilityHint="Skips label scanning and opens product form"
              accessibilityLabel="Enter product manually"
              accessibilityRole="button"
              hitSlop={12}
              onPress={openManualForm}
            >
              <SymbolView
                name="plus"
                size={22}
                tintColor={PlatformColor('linkColor')}
              />
            </Pressable>
          ),
        }}
      />

      {status === 'idle' && (
        <NutritionFactLabellerCamera
          key={scanStep}
          mode={scanStep}
          onScanComplete={handleScanComplete}
          onAutoDetect={
            scanStep === 'nutrition'
              ? (result) => handleScanComplete(result)
              : undefined
          }
          onSkip={scanStep === 'product-name' ? skipNameScan : undefined}
        />
      )}

      {status === 'processing' && <ProcessingFeedback />}

      {status === 'error' && (
        <ErrorFeedback
          error={error}
          onManualEntry={openManualForm}
          onRetry={retry}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  nativeFeedback: {
    flex: 1,
  },
});
