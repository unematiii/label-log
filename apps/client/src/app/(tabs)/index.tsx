import { CodeScannerCamera, CodeScanPhase } from '@/components/code-scanner';
import { findProductByCode } from '@/database';
import { router, useFocusEffect } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useCallback, useState } from 'react';

const FeedbackDurationMs = 700;

function waitForFeedback() {
  return new Promise((resolve) => setTimeout(resolve, FeedbackDurationMs));
}

export default function IndexScreen() {
  const [scanPhase, setScanPhase] = useState<CodeScanPhase>('scanning');

  useFocusEffect(
    useCallback(() => {
      setScanPhase('scanning');
    }, [])
  );

  const handleCodeScanned = useCallback(async (code: string) => {
    setScanPhase('checking');

    try {
      const product = await findProductByCode(code);

      if (product) {
        setScanPhase('found');
        await waitForFeedback();
        router.push({
          pathname: '/products/log',
          params: { id: product.id },
        });
        return;
      }

      setScanPhase('not-found');
      await waitForFeedback();
      router.push({
        pathname: '/scan-label',
        params: { code },
      });
    } catch (error) {
      setScanPhase('error');
      await waitForFeedback();
      setScanPhase('scanning');
      throw error;
    }
  }, []);

  return (
    <View style={styles.container}>
      <CodeScannerCamera phase={scanPhase} onCodeScanned={handleCodeScanned} />
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
