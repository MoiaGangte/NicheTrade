import { useCallback, useState } from 'react';
import { Alert, FlatList, Image, Pressable, RefreshControl, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../context/AppContext';
import appendImageToFormData from '../utils/appendImageToFormData';
import { Button, EmptyState, Field, Screen } from '../components/UI';
import { colors } from '../theme';

export default function LostFoundScreen() {
  const { api } = useApp();
  const [posts, setPosts] = useState([]);
  const [type, setType] = useState('lost');
  const [showForm, setShowForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [image, setImage] = useState(null);
  const [form, setForm] = useState({ itemName: '', placeFound: '', description: '', founderName: '', founderMobile: '', founderDepartment: '', foundAt: new Date().toISOString() });
  const update = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));
  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/api/lost-found');
      if (!data.success) throw new Error(data.message || 'Unable to load posts');
      setPosts(data.posts || []);
    } catch (error) {
      Alert.alert('Lost & Found', error.response?.data?.message || error.message);
    } finally {
      setRefreshing(false);
    }
  }, [api]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const filtered = posts.filter((post) => (post.postType || 'found') === type);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert('Photo access needed', 'Allow access to attach an item photo.');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
    if (!result.canceled) setImage(result.assets[0]);
  };

  const submit = async () => {
    if (!image || !form.itemName.trim() || !form.description.trim() || !form.founderName.trim() || !form.founderMobile.trim() || !form.founderDepartment.trim() || !form.foundAt.trim() || (type === 'found' && !form.placeFound.trim())) {
      return Alert.alert('Complete all fields', 'Add the item details, contact information, date, and a photo.');
    }
    setBusy(true);
    try {
      const data = new FormData();
      Object.entries({ ...form, postType: type }).forEach(([key, value]) => data.append(key, value));
      await appendImageToFormData(data, 'image', image, 'lost-found.jpg');
      const response = await api.post('/api/lost-found', data);
      if (!response.data.success) throw new Error(response.data.message || 'Unable to post');
      setShowForm(false);
      setImage(null);
      setForm((current) => ({ ...current, itemName: '', placeFound: '', description: '' }));
      await load();
      Alert.alert('Posted', 'Your Lost & Found post has been shared.');
    } catch (error) {
      Alert.alert('Could not post item', error.response?.data?.message || error.message);
    } finally {
      setBusy(false);
    }
  };

  const confirmClaim = (post) => Alert.alert('Mark as resolved?', 'This will remove the item from the active Lost & Found list.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Mark resolved', onPress: async () => {
      try {
        const { data } = await api.post(`/api/lost-found/${post._id}/confirm`);
        if (!data.success) throw new Error(data.message || 'Unable to resolve item');
        await load();
      } catch (error) {
        Alert.alert('Unable to resolve item', error.response?.data?.message || error.message);
      }
    } },
  ]);

  if (showForm) return (
    <Screen>
      <FlatList
        data={[{ _id: 'form' }]} keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 17 }}
        renderItem={() => <View>
          <Text style={{ color: colors.navy, fontSize: 21, fontWeight: '800', marginBottom: 13 }}>Report a {type} item</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 13 }}>
            {['lost', 'found'].map((value) => <Text key={value} onPress={() => setType(value)} style={{ backgroundColor: type === value ? colors.blue : colors.white, color: type === value ? colors.white : colors.navy, paddingHorizontal: 15, paddingVertical: 9, borderRadius: 18 }}>{value === 'lost' ? 'Lost item' : 'Found item'}</Text>)}
          </View>
          <Field label="Item name" value={form.itemName} onChangeText={update('itemName')} placeholder="What item?" />
          {type === 'found' ? <Field label="Where was it found?" value={form.placeFound} onChangeText={update('placeFound')} placeholder="Campus location" /> : null}
          <Field label="Description" value={form.description} onChangeText={update('description')} placeholder="Describe the item" multiline />
          <Field label="Date and time (ISO format)" value={form.foundAt} onChangeText={update('foundAt')} placeholder="2026-10-21T09:00:00.000Z" />
          <Field label="Your name" value={form.founderName} onChangeText={update('founderName')} placeholder="Contact name" />
          <Field label="Mobile number" value={form.founderMobile} onChangeText={update('founderMobile')} placeholder="Contact phone" keyboardType="phone-pad" />
          <Field label="Department" value={form.founderDepartment} onChangeText={update('founderDepartment')} placeholder="Your department" />
          <Pressable onPress={pickImage} style={{ padding: 15, borderWidth: 1, borderColor: colors.border, borderRadius: 13, alignItems: 'center', marginBottom: 13 }}>
            <Text style={{ color: colors.blue, fontWeight: '700' }}>{image ? 'Photo selected · Change photo' : 'Add item photo'}</Text>
          </Pressable>
          {image ? <Image source={{ uri: image.uri }} style={{ width: 100, height: 100, borderRadius: 12, marginBottom: 13 }} /> : null}
          <Button title={busy ? 'Posting…' : 'Post item'} disabled={busy} onPress={submit} />
          <Text onPress={() => setShowForm(false)} style={{ color: colors.blue, textAlign: 'center', margin: 16 }}>Cancel</Text>
        </View>}
      />
    </Screen>
  );

  return (
    <Screen>
      <View style={{ flexDirection: 'row', padding: 15, gap: 8 }}>
        {['lost', 'found'].map((value) => <Pressable key={value} onPress={() => setType(value)} style={{ flex: 1, alignItems: 'center', padding: 11, borderRadius: 18, backgroundColor: type === value ? colors.blue : colors.white }}>
          <Text style={{ color: type === value ? colors.white : colors.navy, fontWeight: '700' }}>{value === 'lost' ? 'Lost Items' : 'Found Items'}</Text>
        </Pressable>)}
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 22, flexGrow: 1 }}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/lost-found-detail?id=${item._id}`)} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, padding: 10, borderRadius: 15, marginBottom: 9 }}>
            {item.image ? <Image source={{ uri: item.image }} style={{ width: 76, height: 76, borderRadius: 11, backgroundColor: colors.paleBlue }} /> : null}
            <View style={{ flex: 1, marginLeft: 11 }}>
              <Text style={{ color: colors.navy, fontWeight: '800' }}>{item.itemName}</Text>
              <Text style={{ color: colors.muted, marginTop: 4, fontSize: 11 }} numberOfLines={1}>{item.placeFound || item.description}</Text>
              <Text style={{ color: colors.muted, marginTop: 4, fontSize: 11 }}>{new Date(item.foundAt || item.createdAt).toLocaleDateString()}</Text>
              <Pressable onPress={(event) => { event.stopPropagation(); confirmClaim(item); }} style={{ marginTop: 7, backgroundColor: colors.paleBlue, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 13, alignSelf: 'flex-start' }}>
                <Text style={{ color: colors.blue, fontSize: 11, fontWeight: '700' }}>Mark resolved</Text>
              </Pressable>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={<EmptyState title={`No ${type} items posted`} detail="Be the first to share an update with your campus." />}
        ListFooterComponent={<Button title="＋  Report a lost or found item" onPress={() => setShowForm(true)} />}
      />
    </Screen>
  );
}
