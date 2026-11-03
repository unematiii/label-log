import {
  Alert,
  Button,
  Form,
  Host,
  ProgressView,
  Section,
  Text,
  Toggle,
} from '@expo/ui/swift-ui';
import { disabled } from '@expo/ui/swift-ui/modifiers';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';

import {
  getNutrientPreferences,
  type NutrientKey,
  type NutrientPreferences,
  nutrientOptions,
  saveNutrientPreferences,
} from '@/health';
import { useAuth } from '@/auth';

type AppleHealthSectionProps = {
  preferences: NutrientPreferences | null;
  onChange: (key: NutrientKey, isOn: boolean) => void;
};

function AppleHealthSection({
  preferences,
  onChange,
}: AppleHealthSectionProps) {
  const content = preferences ? (
    nutrientOptions.map(({ key, label }) => (
      <Toggle
        key={key}
        label={label}
        isOn={preferences[key]}
        onIsOnChange={(isOn) => onChange(key, isOn)}
      />
    ))
  ) : (
    <ProgressView />
  );

  return (
    <Section
      title="Apple Health"
      footer={
        <Text>
          Choose which nutrition values are logged by default. You can override
          these choices for an individual log.
        </Text>
      }
    >
      {content}
    </Section>
  );
}

function SettingsErrorSection({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <Section title="Could not save">
      <Text>{message}</Text>
    </Section>
  );
}

function AccountSettingsSection({
  onError,
}: {
  onError: (message: string | null) => void;
}) {
  const { signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isLogoutAlertPresented, setIsLogoutAlertPresented] = useState(false);

  const handleSignOut = async () => {
    setIsLogoutAlertPresented(false);
    setIsSigningOut(true);
    onError(null);

    try {
      await signOut();
    } catch {
      onError('Could not remove the saved session.');
      setIsSigningOut(false);
    }
  };

  return (
    <Section title="Account settings">
      <Alert
        title="Log out?"
        isPresented={isLogoutAlertPresented}
        onIsPresentedChange={setIsLogoutAlertPresented}
      >
        <Alert.Trigger>
          <Button
            label={isSigningOut ? 'Logging out…' : 'Log out'}
            onPress={() => setIsLogoutAlertPresented(true)}
            modifiers={[disabled(isSigningOut)]}
          />
        </Alert.Trigger>
        <Alert.Actions>
          <Button label="Log out" role="destructive" onPress={handleSignOut} />
          <Button label="Cancel" role="cancel" />
        </Alert.Actions>
        <Alert.Message>
          <Text>You’ll need a new email code to sign in again.</Text>
        </Alert.Message>
      </Alert>
    </Section>
  );
}

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
        <Form>
          <AppleHealthSection
            preferences={preferences}
            onChange={handleChange}
          />
          <SettingsErrorSection message={error} />
          <AccountSettingsSection onError={setError} />
        </Form>
      </Host>
    </>
  );
}
