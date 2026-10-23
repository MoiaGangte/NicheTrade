import { useCallback, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useApp } from '../context/AppContext';
import { Button, Field, Screen } from '../components/UI';
import { colors } from '../theme';

const emptyAddress = { firstname: '', lastname: '', street: '', city: '', state: '', zipcode: '', country: 'India', phone: '' };

export default function AddressesScreen() {
  const { api, user } = useApp();
  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState(emptyAddress);
  const [busy, setBusy] = useState(false);
  const update = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));
  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/api/address/get');
      if (!data.success) throw new Error(data.message || 'Unable to load addresses');
      setAddresses(data.addresses || []);
    } catch (error) {
      Alert.alert('Saved addresses', error.response?.data?.message || error.message);
    }
  }, [api]);
  useFocusEffect(useCallback(() => { if (user) load(); }, [load, user]));

  const add = async () => {
    if (!Object.values(form).every((value) => String(value).trim()) || !/^\d+$/.test(form.zipcode)) {
      return Alert.alert('Complete all fields', 'Enter all address details and a numeric postal code.');
    }
    setBusy(true);
    try {
      const address = { ...form, zipcode: Number(form.zipcode), email: user.email };
      const { data } = await api.post('/api/address/add', { address, userId: user._id });
      if (!data.success) throw new Error(data.message || 'Unable to save address');
      setForm(emptyAddress);
      await load();
    } catch (error) {
      Alert.alert('Saved addresses', error.response?.data?.message || error.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = (address) => Alert.alert('Remove address?', 'Delete this saved address?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Remove', style: 'destructive', onPress: async () => {
      try {
        const { data } = await api.delete(`/api/address/${address._id}`);
        if (!data.success) throw new Error(data.message || 'Unable to delete address');
        await load();
      } catch (error) {
        Alert.alert('Saved addresses', error.response?.data?.message || error.message);
      }
    } },
  ]);

  return (
    <Screen>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 17, paddingBottom: 25 }}>
        <Text style={{ color: colors.navy, fontWeight: '800', fontSize: 19, marginBottom: 12 }}>Saved addresses</Text>
        {addresses.map((address) => <View key={address._id} style={{ backgroundColor: colors.white, borderRadius: 14, padding: 13, marginBottom: 9 }}>
          <Text style={{ color: colors.navy, fontWeight: '700' }}>{address.firstname} {address.lastname}</Text>
          <Text style={{ color: colors.muted, lineHeight: 19, marginTop: 4 }}>{address.street}, {address.city}, {address.state} {address.zipcode}, {address.country}</Text>
          <Text style={{ color: colors.muted, marginTop: 3 }}>{address.phone}</Text>
          <Text onPress={() => remove(address)} style={{ color: colors.red, marginTop: 8, fontWeight: '700' }}>Delete address</Text>
        </View>)}
        <Text style={{ color: colors.navy, fontWeight: '800', fontSize: 18, marginTop: 13, marginBottom: 12 }}>Add an address</Text>
        <Field label="First name" value={form.firstname} onChangeText={update('firstname')} placeholder="First name" />
        <Field label="Last name" value={form.lastname} onChangeText={update('lastname')} placeholder="Last name" />
        <Field label="Street" value={form.street} onChangeText={update('street')} placeholder="Street" />
        <Field label="City" value={form.city} onChangeText={update('city')} placeholder="City" />
        <Field label="State" value={form.state} onChangeText={update('state')} placeholder="State" />
        <Field label="Postal code" value={form.zipcode} onChangeText={update('zipcode')} placeholder="Postal code" keyboardType="number-pad" />
        <Field label="Country" value={form.country} onChangeText={update('country')} placeholder="Country" />
        <Field label="Phone" value={form.phone} onChangeText={update('phone')} placeholder="Phone number" keyboardType="phone-pad" />
        <Button title={busy ? 'Saving…' : 'Save address'} disabled={busy} onPress={add} />
      </ScrollView>
    </Screen>
  );
}
