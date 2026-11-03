import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useApp } from '../context/AppContext';
import { Button, Field, Screen } from '../components/UI';
import { colors } from '../theme';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const friendlyAuthError = (error) => {
  const message = error.response?.data?.message || error.message || '';
  const normalized = message.toLowerCase();
  if (normalized.includes('network') || error.code === 'ERR_NETWORK') {
    return 'Unable to reach NicheTrade. Check your connection and try again.';
  }
  if (normalized.includes('already') || normalized.includes('user exists')) {
    return 'An account with this email already exists. Sign in instead.';
  }
  if (normalized.includes('invalid email or password')) {
    return 'The email or password is incorrect.';
  }
  if (normalized.includes('complete all account') || normalized.includes('complete student')) {
    return 'Email/password account creation needs server support for profile completion.';
  }
  return message || 'Unable to continue. Please try again.';
};

export default function AuthScreen() {
  const { signIn, googleSignIn, completeGoogleSignIn } = useApp();
  const params = useLocalSearchParams();
  const handledGoogleCallback = useRef(false);
  const [mode, setMode] = useState('login');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: '', password: '' });
  const update = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    if (Platform.OS !== 'web' || handledGoogleCallback.current || typeof params.code !== 'string') return;
    handledGoogleCallback.current = true;
    const expectedState = window.sessionStorage.getItem('nichetrade.google-auth-state');
    window.sessionStorage.removeItem('nichetrade.google-auth-state');
    if (!expectedState || params.state !== expectedState) {
      router.replace('/auth');
      setError('Could not verify the Google sign-in session. Please try again.');
      return;
    }

    setBusy(true);
    completeGoogleSignIn(params.code)
      .then(() => router.replace('/profile'))
      .catch((requestError) => {
        router.replace('/auth');
        setError(friendlyAuthError(requestError));
      })
      .finally(() => setBusy(false));
  }, [completeGoogleSignIn, params.code, params.state]);

  const submit = async () => {
    setError('');
    const email = form.email.trim();
    if (!emailPattern.test(email)) {
      setError('Enter a valid email address.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setBusy(true);
    try {
      await signIn(
        { email, password: form.password },
        mode === 'register' ? '/api/user/register' : '/api/user/login',
      );
      router.replace('/profile');
    } catch (requestError) {
      setError(friendlyAuthError(requestError));
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError('');
    setBusy(true);
    try {
      const success = await googleSignIn();
      if (success) router.replace('/profile');
    } catch (requestError) {
      setError(friendlyAuthError(requestError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 22, paddingVertical: 18 }}
        >
          <View style={{ alignItems: 'center', marginBottom: 26 }}>
            <Text style={{ color: colors.navy, fontSize: 34, fontWeight: '900' }}>
              Niche<Text style={{ color: colors.blue }}>Trade</Text>
            </Text>
            <Text style={{ color: colors.muted, marginTop: 6 }}>Your campus marketplace</Text>
          </View>

          <Text style={{ color: colors.navy, textAlign: 'center', fontSize: 22, fontWeight: '800', marginBottom: 18 }}>
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </Text>

          <Field
            label="Email"
            value={form.email}
            onChangeText={update('email')}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Field
            label="Password"
            value={form.password}
            onChangeText={update('password')}
            placeholder={mode === 'register' ? 'At least 8 characters' : 'Enter your password'}
            secureTextEntry
            autoCapitalize="none"
          />

          {error ? (
            <View accessibilityRole="alert" style={{ backgroundColor: '#FEECEC', borderRadius: 12, padding: 12, marginBottom: 12 }}>
              <Text style={{ color: colors.red, textAlign: 'center', lineHeight: 19 }}>{error}</Text>
            </View>
          ) : null}

          <Button
            title={mode === 'login' ? 'Sign in' : 'Create account'}
            accessibilityLabel={mode === 'login' ? 'Sign in' : 'Create account'}
            disabled={busy}
            onPress={submit}
          />
          <Text style={{ color: colors.muted, textAlign: 'center', paddingVertical: 13 }}>or</Text>
          <Button
            title="Continue with Google"
            secondary
            disabled={busy}
            onPress={google}
            icon={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={mode === 'login' ? 'Create an account' : 'Sign in to an existing account'}
            disabled={busy}
            onPress={() => {
              setMode((current) => (current === 'login' ? 'register' : 'login'));
              setError('');
            }}
            style={{ paddingVertical: 15 }}
          >
            <Text style={{ color: colors.blue, textAlign: 'center', fontWeight: '700' }}>
              {mode === 'login' ? 'New to NicheTrade? Create an account' : 'Already have an account? Sign in'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
