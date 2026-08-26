import { ScrollView } from 'react-native'
import { Stack } from 'expo-router'

export default function SearchIndex() {
    return (
        <>
            <Stack.Title>Search</Stack.Title>
            <Stack.SearchBar
                placement="automatic"
                placeholder="Search catalogue"
                onChangeText={() => {}}
            />
            <ScrollView>{/* Screen content */}</ScrollView>
        </>
    )
}
