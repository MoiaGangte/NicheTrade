import { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useApp } from '../context/AppContext';
import { Button, Field, Screen } from '../components/UI';
import DateOfBirthField from '../components/DateOfBirthField';
import { colors } from '../theme';

export default function AuthScreen() {
  const { signIn, googleSignIn, completeGoogleSignIn } = useApp();
  const params = useLocalSearchParams();
  const handledGoogleCallback = useRef(false);
  const [mode, setMode] = useState('login');
  const [loginMethod, setLoginMethod] = useState('email');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '', department: '', registerNumber: '',
    mobileNumber: '', studentType: '', dateOfBirth: '',
  });
  const update = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));
  const updateRegisterNumber = (value) => update('registerNumber')(value.replace(/\D/g, ''));

  useEffect(() => {
    if (Platform.OS !== 'web' || handledGoogleCallback.current || typeof params.code !== 'string') return;
    handledGoogleCallback.current = true;
    const expectedState = window.sessionStorage.getItem('nichetrade.google-auth-state');
    window.sessionStorage.removeItem('nichetrade.google-auth-state');
    if (!expectedState || params.state !== expectedState) {
      router.replace('/auth');
      Alert.alert('Google sign-in', 'Could not verify the sign-in session. Please try again.');
      return;
    }

    setBusy(true);
    completeGoogleSignIn(params.code)
      .then(() => router.replace('/profile'))
      .catch((error) => {
        router.replace('/auth');
        Alert.alert('Google sign-in', error.response?.data?.message || error.message);
      })
      .finally(() => setBusy(false));
  }, [completeGoogleSignIn, params.code, params.state]);

  const submit = async () => {
    setBusy(true);
    try {
      if (mode === 'login' && loginMethod === 'register') {
        await signIn({ registerNumber: form.registerNumber, dateOfBirth: form.dateOfBirth }, '/api/user/login-register-number');
      } else {
        await signIn(mode === 'register' ? form : { email: form.email, password: form.password }, `/api/user/${mode}`);
      }
      router.replace('/profile');
    } catch (error) {
      Alert.alert('Account', error.response?.data?.message || error.message);
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    try {
      const studentDetails = mode === 'register' ? form : null;
      const success = await googleSignIn(studentDetails);
      if (success) router.replace('/profile');
    } catch (error) {
      Alert.alert('Google sign-in', error.response?.data?.message || error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 22 }}>
          <View style={{ alignItems: 'center', marginBottom: 26 }}>
            <Text style={{ color: colors.navy, fontSize: 34, fontWeight: '900' }}>Niche<Text style={{ color: colors.blue }}>Trade</Text></Text>
            <Text style={{ color: colors.muted, marginTop: 6 }}>Your campus marketplace</Text>
          </View>
          <Text style={{ color: colors.navy, textAlign: 'center', fontSize: 22, fontWeight: '800', marginBottom: 18 }}>
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </Text>

          {mode === 'register' ? (
            <>
              <Field label="Full name" value={form.name} onChangeText={update('name')} placeholder="Enter your name" />
              <Field label="Department" value={form.department} onChangeText={update('department')} placeholder="Enter your department" />
              <Field label="Register number" value={form.registerNumber} onChangeText={updateRegisterNumber} placeholder="Enter your register number" keyboardType="number-pad" />
              <DateOfBirthField value={form.dateOfBirth} onChange={update('dateOfBirth')} />
              <Field label="Mobile number" value={form.mobileNumber} onChangeText={update('mobileNumber')} placeholder="Enter your mobile number" keyboardType="phone-pad" />
              <Text style={{ color: colors.ink, fontWeight: '700', marginBottom: 8 }}>Student type</Text>
              <View style={{ flexDirection: 'row', gap: 9, marginBottom: 14 }}>
                {['Hosteller', 'Day Scholar'].map((type) => <Text key={type} onPress={() => update('studentType')(type)} style={{ overflow: 'hidden', paddingHorizontal: 14, paddingVertical: 11, borderRadius: 12, color: form.studentType === type ? colors.white : colors.navy, backgroundColor: form.studentType === type ? colors.blue : colors.white, borderWidth: 1, borderColor: colors.border }}>{type}</Text>)}
              </View>
            </>
          ) : null}

          {mode === 'login' ? (
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 13 }}>
              {[['email', 'Email'], ['register', 'Register number']].map(([value, label]) => <Text key={value} onPress={() => setLoginMethod(value)} style={{ color: loginMethod === value ? colors.white : colors.navy, backgroundColor: loginMethod === value ? colors.blue : colors.white, paddingHorizontal: 13, paddingVertical: 10, borderRadius: 17 }}>{label}</Text>)}
            </View>
          ) : null}
          {mode === 'register' || loginMethod === 'email' ? (
            <>
              {mode === 'login' ? <Field label="Email" value={form.email} onChangeText={update('email')} placeholder="Enter your email" keyboardType="email-address" autoCapitalize="none" /> : null}
              {mode === 'register' ? <Field label="Email" value={form.email} onChangeText={update('email')} placeholder="Enter your email" keyboardType="email-address" autoCapitalize="none" /> : null}
              <Field label="Password" value={form.password} onChangeText={update('password')} placeholder="Enter your password" secureTextEntry />
            </>
          ) : (
            <>
              <Field label="Register number" value={form.registerNumber} onChangeText={updateRegisterNumber} placeholder="Enter your register number" keyboardType="number-pad" />
              <DateOfBirthField value={form.dateOfBirth} onChange={update('dateOfBirth')} />
            </>
          )}

          <Button title={mode === 'login' ? 'Login' : 'Create account'} disabled={busy} onPress={submit} style={{ marginTop: 4 }} />
          <Text style={{ color: colors.muted, textAlign: 'center', paddingVertical: 13 }}>or</Text>
          <Button
            title={mode === 'register' ? 'Sign in with Google' : 'Login with Google'}
            secondary
            disabled={busy}
            onPress={google}
            icon={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
          />
          <Text onPress={() => { setMode(mode === 'login' ? 'register' : 'login'); setLoginMethod('email'); }} style={{ color: colors.blue, textAlign: 'center', marginTop: 20, fontWeight: '700' }}>
            {mode === 'login' ? 'New to NicheTrade?  Create an account' : 'Already have an account?  Login'}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
