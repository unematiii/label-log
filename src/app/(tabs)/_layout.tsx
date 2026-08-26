import { NativeTabs } from 'expo-router/unstable-native-tabs'

export default function TabLayout() {
    return (
        <NativeTabs>
            <NativeTabs.Trigger name="index">
                <NativeTabs.Trigger.Label>Scan</NativeTabs.Trigger.Label>
                <NativeTabs.Trigger.Icon sf="barcode.viewfinder" md="home" />
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="settings">
                <NativeTabs.Trigger.Icon sf="gear" md="settings" />
                <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="search" role="search">
                <NativeTabs.Trigger.Label>Search catalogue</NativeTabs.Trigger.Label>
            </NativeTabs.Trigger>
        </NativeTabs>
    )
}
