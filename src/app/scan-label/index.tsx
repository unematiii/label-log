import { Button, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { NutritionFactLabellerCamera } from '@/components/label-reader';
import { ScoredOcrResult } from '@/types';
import { useNutritionExtractionApi } from '@/api';

export default function ScanLabelScreen() {
  const { code } = useLocalSearchParams<{ code?: string }>();

  const extraction = useNutritionExtractionApi();
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

  return (
    <View style={styles.container}>
      {extraction.status === 'idle' && (
        <NutritionFactLabellerCamera onScanComplete={handleScanComplete} />
      )}

      {extraction.status === 'processing' && (
        <View>
          <Text>Extracting nutrition information...</Text>
        </View>
      )}

      {extraction.status === 'success' && (
        <View>
          <Text>{JSON.stringify(extraction.data, null, 2)}</Text>
          <Button title="Try again" onPress={extraction.reset} />
        </View>
      )}

      {extraction.status === 'error' && (
        <View>
          <Text>Nutrition information could not be read.</Text>

          <Button title="Try again" onPress={extraction.reset} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  text: {
    color: '#080808',
  },
});
