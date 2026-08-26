import { StyleSheet, Pressable, View } from 'react-native';

export interface CaptureButtonProps {
  onCapture?: () => void;
}

export function CaptureButton({ onCapture }: CaptureButtonProps) {
  return (
    <Pressable
      onPress={onCapture}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <View style={styles.outerRing}>
        <View style={styles.innerCircle} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    // alignSelf: 'center',
    width: 84,
    height: 84,
  },
  outerRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#fff',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#fff',
  },
  pressed: {
    transform: [{ scale: 0.9 }], // Shrink effect on tap
  },
});
