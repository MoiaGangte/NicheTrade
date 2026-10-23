import { useCallback, useState } from 'react';
import { Alert, FlatList, Image, Pressable, RefreshControl, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../context/AppContext';
import appendImageToFormData from '../utils/appendImageToFormData';
import { Button, EmptyState, Field, Screen } from '../components/UI';
import { colors } from '../theme';

export default function RequestsScreen() {
  const { api, user } = useApp();
  const [requests, setRequests] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [image, setImage] = useState(null);
  const [form, setForm] = useState({ itemName: '', description: '', promiseAmount: '' });
  const update = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));
  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/api/request-items');
      if (!data.success) throw new Error(data.message || 'Unable to load item requests');
      setRequests(data.requests || []);
    } catch (error) {
      Alert.alert('Item requests', error.response?.data?.message || error.message);
    } finally {
      setRefreshing(false);
    }
  }, [api]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert('Photo access needed', 'Allow access to attach an item photo.');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
    if (!result.canceled) setImage(result.assets[0]);
  };

  const submit = async () => {
    if (!user) return Alert.alert('Sign in required', 'Sign in before posting an item request.');
    if (!form.itemName.trim() || !form.description.trim() || !form.promiseAmount || !image) return Alert.alert('Complete all fields', 'Add the item name, description, extra payment amount, and photo.');
    setBusy(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, value));
      await appendImageToFormData(data, 'image', image, 'item-request.jpg');
      const { data: response } = await api.post('/api/request-items', data);
      if (!response.success) throw new Error(response.message || 'Unable to post request');
      setForm({ itemName: '', description: '', promiseAmount: '' });
      setImage(null);
      setShowForm(false);
      await load();
      Alert.alert('Request posted', 'Your item request is now visible to the campus community.');
    } catch (error) {
      Alert.alert('Could not post request', error.response?.data?.message || error.message);
    } finally {
      setBusy(false);
    }
  };

  const confirm = async (request) => {
    if (!user) return Alert.alert('Sign in required', 'Sign in to offer this item.');
    try {
      const { data } = await api.post(`/api/request-items/${request._id}/confirm`);
      if (!data.success) throw new Error(data.message || 'Unable to confirm');
      Alert.alert('Thanks for helping', data.message);
      await load();
    } catch (error) {
      Alert.alert('Unable to confirm request', error.response?.data?.message || error.message);
    }
  };

  if (showForm) return (
    <Screen>
      <FlatList data={[{ _id: 'form' }]} keyExtractor={(item) => item._id} contentContainerStyle={{ padding: 17 }} renderItem={() => <View>
        <Text style={{ color: colors.navy, fontSize: 21, fontWeight: '800', marginBottom: 14 }}>Request an item</Text>
        <Field label="Item name" value={form.itemName} onChangeText={update('itemName')} placeholder="What do you need?" />
        <Field label="Description" value={form.description} onChangeText={update('description')} placeholder="Add helpful details" multiline />
        <Field label="Extra payment amount (₹)" value={form.promiseAmount} onChangeText={update('promiseAmount')} placeholder="Amount offered" keyboardType="decimal-pad" />
        <Pressable onPress={pickImage} style={{ padding: 15, borderWidth: 1, borderColor: colors.border, borderRadius: 13, alignItems: 'center', marginBottom: 13 }}>
          <Text style={{ color: colors.blue, fontWeight: '700' }}>{image ? 'Photo selected · Change photo' : 'Add a reference photo'}</Text>
        </Pressable>
        {image ? <Image source={{ uri: image.uri }} style={{ width: 100, height: 100, borderRadius: 12, marginBottom: 13 }} /> : null}
        <Button title={busy ? 'Posting…' : 'Post request'} disabled={busy} onPress={submit} />
        <Text onPress={() => setShowForm(false)} style={{ color: colors.blue, textAlign: 'center', margin: 16 }}>Cancel</Text>
      </View>} />
    </Screen>
  );

  return (
    <Screen>
      <FlatList
        data={requests}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        contentContainerStyle={{ padding: 15, paddingBottom: 22, flexGrow: 1 }}
        ListHeaderComponent={<View style={{ backgroundColor: '#E8F5FF', borderRadius: 17, padding: 16, marginBottom: 14 }}>
          <Text style={{ color: colors.navy, fontSize: 17, fontWeight: '800' }}>Can't find what you need?</Text>
          <Text style={{ color: colors.muted, lineHeight: 20, marginTop: 5 }}>Post a request and let your campus community help.</Text>
          <Button title="Post a request" onPress={() => setShowForm(true)} style={{ marginTop: 12 }} />
          <Text style={{ color: colors.navy, fontWeight: '800', fontSize: 16, marginTop: 16 }}>Recent requests</Text>
        </View>}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/request-item-detail?id=${item._id}`)} style={{ flexDirection: 'row', backgroundColor: colors.white, borderRadius: 15, padding: 10, marginBottom: 9 }}>
            <Image source={{ uri: item.image }} style={{ width: 72, height: 72, borderRadius: 10, backgroundColor: colors.paleBlue }} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={{ color: colors.navy, fontWeight: '800' }}>{item.itemName}</Text>
              <Text numberOfLines={2} style={{ color: colors.muted, fontSize: 11, marginTop: 3 }}>{item.description}</Text>
              <Text style={{ color: colors.blue, fontWeight: '700', fontSize: 12, marginTop: 5 }}>₹{item.promiseAmount} extra · {item.confirmations?.length || 0} responses</Text>
              <Pressable onPress={(event) => { event.stopPropagation(); confirm(item); }} style={{ alignSelf: 'flex-start', marginTop: 6 }}>
                <Text style={{ color: colors.green, fontSize: 11, fontWeight: '700' }}>I can help →</Text>
              </Pressable>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={<EmptyState title="No requests yet" detail="Post an item request to ask your campus community." />}
      />
    </Screen>
  );
}
