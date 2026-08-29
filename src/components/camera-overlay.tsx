import { type PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function CameraOverlay({ children }: PropsWithChildren) {
  return (
    <SafeAreaView pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
});
