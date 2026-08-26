import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { NutritionFactLabellerCamera } from '@/components/labeller-camera';

export default function ScanLabelScreen() {
    return (
        <View style={styles.container}>
            <StatusBar style="auto" />
            <NutritionFactLabellerCamera />
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
