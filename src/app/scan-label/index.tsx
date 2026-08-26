import { StyleSheet, Text, View } from 'react-native';
import { useCallback } from 'react';

import { NutritionFactLabellerCamera } from '@/components/labeller-camera';
import { ScoredOcrResult } from '@/types';

export default function ScanLabelScreen() {
  const handleScanComplete = useCallback((result: ScoredOcrResult) => {
    console.log('Nutrition label scan complete', result);
  }, []);

  return (
    <View style={styles.container}>
      <NutritionFactLabellerCamera onScanComplete={handleScanComplete} />
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
