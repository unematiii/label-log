import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ApiError, useAuth } from '@/auth';

export default function SignInScreen() {
  const { requestCode, verifyCode } = useAuth();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [awaitingCode, setAwaitingCode] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = setTimeout(
      () => setResendSeconds((seconds) => Math.max(0, seconds - 1)),
      1000
    );
    return () => clearTimeout(timer);
  }, [resendSeconds]);

  const submitEmail = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await requestCode(normalizedEmail);
      setEmail(normalizedEmail);
      setAwaitingCode(true);
      setResendSeconds(60);
    } catch (caught) {
      setError(formatError(caught));
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitCode = async () => {
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the six-digit code from your email.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await verifyCode(email, code);
    } catch (caught) {
      setError(formatError(caught));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Sign in to LabelLog</Text>
        <Text style={styles.description}>
          {awaitingCode
            ? `Enter the code sent to ${email}. It expires in five minutes.`
            : 'Enter your email address to receive a login code.'}
        </Text>

        {awaitingCode ? (
          <TextInput
            autoComplete="one-time-code"
            autoFocus
            editable={!isSubmitting}
            keyboardType="number-pad"
            maxLength={6}
            onChangeText={(value) => setCode(value.replace(/\D/g, ''))}
            onSubmitEditing={submitCode}
            placeholder="123456"
            style={styles.input}
            textContentType="oneTimeCode"
            value={code}
          />
        ) : (
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            autoFocus
            editable={!isSubmitting}
            keyboardType="email-address"
            onChangeText={setEmail}
            onSubmitEditing={submitEmail}
            placeholder="you@example.com"
            style={styles.input}
            textContentType="emailAddress"
            value={email}
          />
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          disabled={isSubmitting}
          onPress={awaitingCode ? submitCode : submitEmail}
          style={({ pressed }) => [
            styles.button,
            (pressed || isSubmitting) && styles.buttonPressed,
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {awaitingCode ? 'Verify code' : 'Send code'}
            </Text>
          )}
        </Pressable>

        {awaitingCode ? (
          <View style={styles.secondaryActions}>
            <Pressable
              disabled={isSubmitting}
              onPress={() => {
                setAwaitingCode(false);
                setCode('');
                setError(null);
              }}
            >
              <Text style={styles.link}>Use a different email</Text>
            </Pressable>
            {resendSeconds > 0 ? (
              <Text style={styles.muted}>Resend in {resendSeconds}s</Text>
            ) : (
              <Pressable disabled={isSubmitting} onPress={submitEmail}>
                <Text style={styles.link}>Resend code</Text>
              </Pressable>
            )}
          </View>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

function formatError(error: unknown) {
  if (error instanceof ApiError && error.status === 429) {
    return error.retryAfter
      ? `Too many attempts. Try again after ${error.retryAfter}.`
      : 'Too many attempts. Please try again later.';
  }
  return error instanceof Error ? error.message : 'Something went wrong.';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#f5f5f7',
    padding: 24,
  },
  card: { gap: 16 },
  title: { color: '#111', fontSize: 30, fontWeight: '700' },
  description: { color: '#555', fontSize: 16, lineHeight: 22 },
  input: {
    borderColor: '#ccc',
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#fff',
    fontSize: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  error: { color: '#b42318' },
  button: {
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#111',
    minHeight: 50,
    justifyContent: 'center',
  },
  buttonPressed: { opacity: 0.65 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  link: { color: '#3267d6', textAlign: 'center' },
  muted: { color: '#777', textAlign: 'center' },
  secondaryActions: { gap: 12 },
});
