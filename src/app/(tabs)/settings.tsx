import { StyleSheet, Text, View } from 'react-native'

export default function SettingsScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Settings view</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    text: {
        color: '#080808',
    },
})
