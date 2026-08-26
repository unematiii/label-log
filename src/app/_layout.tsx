import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="scan-label"
        options={{ title: 'Scan label', headerBackTitle: 'Back' }}
      />
    </Stack>
  );
}
