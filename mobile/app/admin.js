import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useApp } from '../context/AppContext';
import { ADMIN_TOKEN_KEY, getErrorMessage, getStoredToken, removeStoredToken, setStoredToken } from '../api';
import { Button, Field, Screen } from '../components/UI';
import { colors } from '../theme';

const sections = ['sellers', 'products', 'lost-found', 'request-items', 'seller-uploads'];

export default function AdminScreen() {
  const { api, user } = useApp();
  const [authenticated, setAuthenticated] = useState(false);
  const [eligible, setEligible] = useState(null);
  const [section, setSection] = useState('sellers');
  const [records, setRecords] = useState([]);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      await removeStoredToken(ADMIN_TOKEN_KEY);
      setEligible(false);
      setAuthenticated(false);
      return;
    }

    try {
      const access = await api.get('/api/user/admin-access');
      const isEligible = Boolean(access.data.success && access.data.eligible);
      setEligible(isEligible);
      if (!isEligible) {
        await removeStoredToken(ADMIN_TOKEN_KEY);
        setAuthenticated(false);
        return;
      }

      const token = await getStoredToken(ADMIN_TOKEN_KEY);
      if (!token) { setAuthenticated(false); return; }
      const status = await api.get('/api/admin/is-auth');
      if (!status.data.success) throw new Error('Admin session expired');
      setAuthenticated(true);
      const endpoint = section === 'seller-uploads' ? 'seller-upload-requests' : section;
      const { data } = await api.get(`/api/admin/${endpoint}`);
      if (!data.success) throw new Error(data.message || 'Unable to load moderation queue');
      const key = section === 'sellers' ? 'sellers' : section === 'products' ? 'products'
        : section === 'lost-found' ? 'posts' : 'requests';
      setRecords(data[key] || []);
    } catch (error) {
      if (error.response?.status === 401) {
        await removeStoredToken(ADMIN_TOKEN_KEY);
        setAuthenticated(false);
      } else {
        Alert.alert('Admin moderation', getErrorMessage(error));
      }
    }
  }, [api, section, user]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const login = async () => {
    setBusy(true);
    try {
      const { data } = await api.post('/api/user/admin-login', { password });
      if (!data.success || !data.token) throw new Error(data.message || 'Admin login failed');
      await setStoredToken(ADMIN_TOKEN_KEY, data.token);
      setAuthenticated(true);
      setPassword('');
      await load();
    } catch (error) {
      Alert.alert('Admin login', getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const moderate = async (record, action) => {
    try {
      let response;
      if (section === 'sellers' && action === 'approve') {
        response = await api.patch(`/api/admin/sellers/${record._id}/approve`);
      } else if (section === 'products') {
        response = await api.delete(`/api/admin/products/${record._id}`);
      } else if (section === 'lost-found') {
        response = await api.delete(`/api/admin/lost-found/${record._id}`);
      } else if (section === 'request-items') {
        response = await api.delete(`/api/admin/request-items/${record._id}`);
      } else if (section === 'seller-uploads') {
        response = await api.patch(`/api/admin/seller-upload-requests/${record._id}`, { decision: action });
      }
      if (!response?.data?.success) throw new Error(response?.data?.message || 'Moderation action failed');
      await load();
    } catch (error) {
      Alert.alert('Moderation action', getErrorMessage(error));
    }
  };

  const logout = async () => {
    try { await api.get('/api/admin/logout'); }
    finally {
      await removeStoredToken(ADMIN_TOKEN_KEY);
      setAuthenticated(false);
      setRecords([]);
    }
  };

  if (!authenticated) return (
    <Screen style={{ justifyContent: 'center', padding: 20 }}>
      <Text style={{ color: colors.navy, fontSize: 24, fontWeight: '800', marginBottom: 7 }}>Admin moderation</Text>
      {eligible === null && user ? (
        <Text style={{ color: colors.muted, marginBottom: 17 }}>Checking admin account access…</Text>
      ) : !user || eligible === false ? (
        <Text style={{ color: colors.muted, marginBottom: 17 }}>Sign in to the authorized admin account to continue.</Text>
      ) : (
        <>
          <Text style={{ color: colors.muted, marginBottom: 17 }}>Confirm admin access for {user.email} with your admin password.</Text>
          <Field label="Admin password" value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
          <Button title="Sign in" disabled={busy || !password} onPress={login} />
        </>
      )}
      <Text onPress={() => router.back()} style={{ color: colors.blue, textAlign: 'center', margin: 16 }}>Back</Text>
    </Screen>
  );

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 15, paddingBottom: 25 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 }}>
          <Text style={{ color: colors.navy, fontSize: 22, fontWeight: '800' }}>Moderation</Text>
          <Text onPress={logout} style={{ color: colors.blue, fontWeight: '700' }}>Sign out</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7, paddingBottom: 12 }}>
          {sections.map((item) => <Pressable key={item} onPress={() => setSection(item)} style={{ backgroundColor: section === item ? colors.blue : colors.white, borderRadius: 17, paddingHorizontal: 11, paddingVertical: 9 }}>
            <Text style={{ color: section === item ? colors.white : colors.navy, fontSize: 11, fontWeight: '700' }}>{item.replace('-', ' ')}</Text>
          </Pressable>)}
        </ScrollView>
        {!records.length ? <Text style={{ color: colors.muted, textAlign: 'center', padding: 28 }}>Nothing to review in this section.</Text> : records.map((record) => (
          <View key={record._id} style={{ padding: 13, backgroundColor: colors.white, borderRadius: 14, marginBottom: 9 }}>
            <Text style={{ color: colors.navy, fontWeight: '800' }}>{record.storeName || record.name || record.itemName || record.productName || record.description || 'Marketplace record'}</Text>
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>{record.email || record.status || record.category || record.requesterId?.name || ''}</Text>
            {section === 'sellers' && !record.isApproved ? <Button title="Approve seller" onPress={() => moderate(record, 'approve')} style={{ marginTop: 10 }} /> : null}
            {section === 'seller-uploads' ? <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <Button title="Grant 1 credit" onPress={async () => {
                try {
                  const { data } = await api.patch(`/api/admin/seller-upload-requests/${record._id}`, { decision: 'credits', freeUploads: 1 });
                  if (!data.success) throw new Error(data.message);
                  await load();
                } catch (error) { Alert.alert('Review request', getErrorMessage(error)); }
              }} style={{ flex: 1 }} />
              <Button title="Reject" secondary onPress={() => moderate(record, 'reject')} style={{ flex: 1 }} />
            </View> : null}
            {['products', 'lost-found', 'request-items'].includes(section) ? <Text onPress={() => Alert.alert('Remove record?', 'This permanently removes this record from the shared marketplace.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Remove', style: 'destructive', onPress: () => moderate(record, 'delete') },
            ])} style={{ color: colors.red, marginTop: 10, fontWeight: '700' }}>Remove record</Text> : null}
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}
