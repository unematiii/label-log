import { Button, StyleSheet, Text, View } from 'react-native';

import { NutritionFactLabellerCamera } from '@/components/labeller-camera';
import { ScoredOcrResult } from '@/types';
import { useNutritionExtractionApi } from '@/api';

export default function ScanLabelScreen() {
  const extraction = useNutritionExtractionApi();

  const handleScanComplete = async (result: ScoredOcrResult) => {
    const nutrition = await extraction.extract(result);

    if (nutrition) {
      // TODO: Populate the editable form or navigate to review.
      console.log('Nutrition label scan complete', nutrition);
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
