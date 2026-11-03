import {
  Camera,
  Code,
  CodeScannerFrame,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';
import { StyleSheet, View } from 'react-native';
import { useCallback, useEffect, useRef } from 'react';
import { useIsFocused } from 'expo-router';

import { CodeScanFeedback, CodeScanPhase } from './feedback';

type CodeScannerCameraProps = {
  phase: CodeScanPhase;
  onCodeScanned: (code: string) => Promise<void> | void;
};

export function CodeScannerCamera({
  phase,
  onCodeScanned,
}: CodeScannerCameraProps) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const isFocused = useIsFocused();
  const navigationLocked = useRef(false);

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  useEffect(() => {
    if (isFocused) navigationLocked.current = false;
  }, [isFocused]);

  const device = useCameraDevice('back');

  const handleCodeScanned = useCallback(
    async (codes: Code[], _frame: CodeScannerFrame) => {
      const code = codes[0]?.value?.trim();

      if (!code || navigationLocked.current) return;
      navigationLocked.current = true;

      try {
        await onCodeScanned(code);
      } catch (error) {
        // TODO
        console.error('Could not handle scanned code', error);
        navigationLocked.current = false;
      }
    },
    [onCodeScanned]
  );
  const codeScanner = useCodeScanner({
    codeTypes: ['ean-13', 'upc-a', 'upc-e', 'code-39', 'code-128'],
    onCodeScanned: handleCodeScanned,
  });

  if (device == null) return null;

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        codeScanner={codeScanner}
        isActive={isFocused && phase === 'scanning'}
      />
      <CodeScanFeedback phase={phase} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
