import { Stack } from 'expo-router';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import migrations from '../../drizzle/migrations';
import { db } from '@/database';

export default function RootLayout() {
  const { success, error } = useMigrations(db, migrations);

  if (error) {
    // TODO Generalize error handling views
    return (
      <View style={styles.centered}>
        <Text>Could not initialize the product catalogue: {error.message}</Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="scan-label"
        options={{ title: 'Scan label', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="products/add"
        options={{ title: 'Add Product', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="products/log"
        options={{ title: 'Log Product', headerBackTitle: 'Back' }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
});
