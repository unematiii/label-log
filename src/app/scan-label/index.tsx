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

import { NutritionFactLabellerCamera } from '@/components/label-reader';
import { ScoredOcrResult } from '@/types';
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
          Reading nutrition information…
        </Text>
        <Text
          modifiers={[
            foregroundStyle('secondary'),
            multilineTextAlignment('center'),
          ]}
        >
          Checking the scanned label and correcting its values.
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
        <Text modifiers={[font({ textStyle: 'title2', weight: 'semibold' })]}>
          Couldn’t read the nutrition label
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

  const extraction = useNutritionExtractionApi();
  const openManualForm = () => {
    extraction.cancel();
    router.replace({
      pathname: '/products/add',
      params: { code: typeof code === 'string' ? code : '' },
    });
  };

  const handleScanComplete = async (result: ScoredOcrResult) => {
    const nutrition = await extraction.extract(result);

    if (nutrition) {
      router.replace({
        pathname: '/products/add',
        params: {
          code: typeof code === 'string' ? code : '',
          nutrition: JSON.stringify(nutrition),
        },
      });
    }
  };

  if (extraction.status === 'success') return null;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
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

      {extraction.status === 'idle' && (
        <NutritionFactLabellerCamera onScanComplete={handleScanComplete} />
      )}

      {extraction.status === 'processing' && <ProcessingFeedback />}

      {extraction.status === 'error' && (
        <ErrorFeedback
          error={extraction.error}
          onManualEntry={openManualForm}
          onRetry={extraction.reset}
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
