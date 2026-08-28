import {
  Form,
  Host,
  ProgressView,
  Section,
  Text,
  Toggle,
} from '@expo/ui/swift-ui';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';

import {
  getNutrientPreferences,
  type NutrientKey,
  type NutrientPreferences,
  nutrientOptions,
  saveNutrientPreferences,
} from '@/health';

export default function SettingsScreen() {
  const [preferences, setPreferences] = useState<NutrientPreferences | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getNutrientPreferences()
      .then(setPreferences)
      .catch(() => setError('Could not load nutrition settings.'));
  }, []);

  const handleChange = (key: NutrientKey, isOn: boolean) => {
    if (!preferences) return;

    const previous = preferences;
    const updated = { ...preferences, [key]: isOn };
    setPreferences(updated);
    setError(null);

    saveNutrientPreferences(updated).catch(() => {
      setPreferences(previous);
      setError('Could not save nutrition settings.');
    });
  };

  return (
    <>
      <Stack.Title>Settings</Stack.Title>
      <Host style={{ flex: 1 }}>
        {preferences ? (
          <Form>
            <Section
              title="Apple Health"
              footer={
                <Text>
                  Choose which nutrition values are logged by default. You can
                  override these choices for an individual log.
                </Text>
              }
            >
              {nutrientOptions.map(({ key, label }) => (
                <Toggle
                  key={key}
                  label={label}
                  isOn={preferences[key]}
                  onIsOnChange={(isOn) => handleChange(key, isOn)}
                />
              ))}
            </Section>
            {error ? (
              <Section title="Could not save">
                <Text>{error}</Text>
              </Section>
            ) : null}
          </Form>
        ) : error ? (
          <Text>{error}</Text>
        ) : (
          <ProgressView />
        )}
      </Host>
    </>
  );
}
