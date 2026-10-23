import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../context/AppContext';
import { Button, Field, Screen } from '../components/UI';
import { colors } from '../theme';

export default function EditProfileScreen() {
  const { api, user, setUser } = useApp();
  const [form, setForm] = useState({
    department: user?.department || '',
    registerNumber: user?.registerNumber || '',
    mobileNumber: user?.mobileNumber || '',
    studentType: user?.studentType || '',
    dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().slice(0, 10) : '',
  });
  const [busy, setBusy] = useState(false);
  const update = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));
  const save = async () => {
    setBusy(true);
    try {
      const { data } = await api.put('/api/user/profile', form);
      if (!data.success) throw new Error(data.message || 'Unable to update profile');
      setUser(data.user);
      Alert.alert('Profile updated', data.message);
      router.back();
    } catch (error) {
      Alert.alert('Profile', error.response?.data?.message || error.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 18 }}>
          <Text style={{ color: colors.muted, marginBottom: 15 }}>Keep your student account information up to date.</Text>
          <Field label="Department" value={form.department} onChangeText={update('department')} placeholder="Department" />
          <Field label="Register number" value={form.registerNumber} onChangeText={update('registerNumber')} placeholder="Register number" autoCapitalize="characters" />
          <Field label="Date of birth" value={form.dateOfBirth} onChangeText={update('dateOfBirth')} placeholder="YYYY-MM-DD" />
          <Field label="Mobile number" value={form.mobileNumber} onChangeText={update('mobileNumber')} placeholder="Mobile number" keyboardType="phone-pad" />
          <Text style={{ color: colors.ink, fontWeight: '700', marginBottom: 7 }}>Student type</Text>
          {['Hosteller', 'Day Scholar'].map((value) => <Text key={value} onPress={() => update('studentType')(value)} style={{ color: form.studentType === value ? colors.white : colors.navy, backgroundColor: form.studentType === value ? colors.blue : colors.white, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 }}>{value}</Text>)}
          <Button title={busy ? 'Saving…' : 'Save profile'} disabled={busy} onPress={save} style={{ marginTop: 12 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
