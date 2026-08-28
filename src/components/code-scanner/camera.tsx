import {
  Camera,
  Code,
  CodeScannerFrame,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';
import { StyleSheet, View } from 'react-native';
import { useCallback, useEffect } from 'react';

export function CodeScannerCamera() {
  const { hasPermission, requestPermission } = useCameraPermission();

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  const device = useCameraDevice('back');

  const onCodeScanned = useCallback(
    (codes: Code[], _frame: CodeScannerFrame) => {
      if (codes.length > 0) {
        const code = codes[0];
        console.log('Scanned code:', code.type, code.value);
      }
    },
    []
  );
  const codeScanner = useCodeScanner({
    codeTypes: ['ean-13', 'upc-a', 'upc-e', 'code-39', 'code-128'],
    onCodeScanned,
  });

  if (device == null) return null;

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        codeScanner={codeScanner}
        isActive={true}
      />
      <View style={styles.scanFrame} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scanFrame: {
    position: 'absolute',
    top: '18%',
    left: 24,
    right: 24,
    bottom: '18%',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
    borderRadius: 18,
  },
});
