import { Link } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function IndexScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.text}>Home</Text>
            <Link href="/scan-label">Add product to catalogue</Link>
            <StatusBar style="auto" />
        </SafeAreaView>
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
