import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../context/AppContext';
import { Button, Field, Screen } from '../components/UI';
import { colors } from '../theme';

export default function AuthScreen() {
  const { signIn, googleSignIn } = useApp();
  const [mode, setMode] = useState('login');
  const [loginMethod, setLoginMethod] = useState('email');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '', department: '', registerNumber: '',
    mobileNumber: '', studentType: '', dateOfBirth: '',
  });
  const update = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async () => {
    setBusy(true);
    try {
      if (mode === 'login' && loginMethod === 'register') {
        await signIn({ registerNumber: form.registerNumber, dateOfBirth: form.dateOfBirth }, '/api/user/login-register-number');
      } else {
        await signIn(mode === 'register' ? form : { email: form.email, password: form.password }, `/api/user/${mode}`);
      }
      router.replace('/(tabs)/profile');
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
      if (success) router.replace('/(tabs)/profile');
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
              <Field label="Register number" value={form.registerNumber} onChangeText={update('registerNumber')} placeholder="Enter your register number" autoCapitalize="characters" />
              <Field label="Date of birth" value={form.dateOfBirth} onChangeText={update('dateOfBirth')} placeholder="YYYY-MM-DD" />
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
              <Field label="Register number" value={form.registerNumber} onChangeText={update('registerNumber')} placeholder="Enter your register number" autoCapitalize="characters" />
              <Field label="Date of birth" value={form.dateOfBirth} onChangeText={update('dateOfBirth')} placeholder="YYYY-MM-DD" />
            </>
          )}

          <Button title={mode === 'login' ? 'Login' : 'Create account'} disabled={busy} onPress={submit} style={{ marginTop: 4 }} />
          <Text style={{ color: colors.muted, textAlign: 'center', paddingVertical: 13 }}>or</Text>
          <Button title="Continue with Google" secondary disabled={busy} onPress={google} />
          <Text onPress={() => { setMode(mode === 'login' ? 'register' : 'login'); setLoginMethod('email'); }} style={{ color: colors.blue, textAlign: 'center', marginTop: 20, fontWeight: '700' }}>
            {mode === 'login' ? 'New to NicheTrade?  Create an account' : 'Already have an account?  Login'}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
