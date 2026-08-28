import { CodeScannerCamera } from '@/components/code-scanner';
import { StyleSheet, View } from 'react-native';

export default function IndexScreen() {
  return (
    <View style={styles.container}>
      <CodeScannerCamera />
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
