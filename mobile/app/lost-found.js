import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Image, Linking, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../context/AppContext';
import appendImageToFormData from '../utils/appendImageToFormData';
import { Button, EmptyState, Field, Screen } from '../components/UI';
import { colors } from '../theme';
import { useCameraFlow } from '../context/CameraFlowContext';

export default function LostFoundScreen() {
  const { api } = useApp();
  const { consumeHandoff, lostFoundType, clearFlow } = useCameraFlow();
  const [posts, setPosts] = useState([]);
  const [type, setType] = useState('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [images, setImages] = useState([]);
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
  useFocusEffect(useCallback(() => {
    const photos = consumeHandoff('lost-found');
    if (!photos?.length) return;
    setImages((current) => [...current, ...photos].slice(0, 3));
    setType(lostFoundType);
    setShowForm(true);
  }, [consumeHandoff, lostFoundType]));
  useEffect(() => {
    if (typeof ImagePicker.getPendingResultAsync !== 'function') return;
    ImagePicker.getPendingResultAsync().then((result) => {
      if (!result?.canceled && result.assets?.length) {
        setImages((current) => [...current, ...result.assets].slice(0, 3));
        setShowForm(true);
      }
    }).catch((error) => console.warn('Unable to recover camera photo:', error.message));
  }, []);
  const filtered = posts.filter((post) => {
    if (type !== 'all' && (post.postType || 'found') !== type) return false;
    const needle = search.trim().toLowerCase();
    if (!needle) return true;
    return `${post.itemName || ''} ${post.placeFound || ''} ${post.description || ''}`.toLowerCase().includes(needle);
  });

  const pickImage = async () => {
    if (images.length >= 3) return Alert.alert('Photo limit', 'You can add up to 3 photos.');
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Photo access needed', 'Allow photo access to choose an item photo.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
      if (!result.canceled && result.assets?.length) {
        setImages((current) => [...current, ...result.assets].slice(0, 3));
      }
    } catch (error) {
      Alert.alert('Could not open photos', error.response?.data?.message || error.message || 'Please try again.');
    }
  };

  const takePhoto = async () => {
    if (images.length >= 3) return Alert.alert('Photo limit', 'You can add up to 3 photos.');
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Camera permission needed',
          'Allow camera access to take a photo, or enable it in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open settings', onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7, allowsEditing: false });
      if (!result.canceled && result.assets?.length) {
        setImages((current) => [...current, ...result.assets].slice(0, 3));
      }
    } catch (error) {
      Alert.alert('Could not open camera', error.response?.data?.message || error.message || 'Please try again.');
    }
  };

  const submit = async () => {
    if (!images.length || !form.itemName.trim() || !form.description.trim() || !form.founderName.trim() || !form.founderMobile.trim() || !form.founderDepartment.trim() || !form.foundAt.trim() || (type === 'found' && !form.placeFound.trim())) {
      return Alert.alert('Complete all fields', 'Add the item details, contact information, date, and a photo.');
    }
    setBusy(true);
    try {
      const data = new FormData();
      Object.entries({ ...form, postType: type }).forEach(([key, value]) => data.append(key, value));
      await appendImageToFormData(data, 'image', images[0], 'lost-found.jpg');
      const response = await api.post('/api/lost-found', data);
      if (!response.data.success) throw new Error(response.data.message || 'Unable to post');
      setShowForm(false);
      setImages([]);
      clearFlow();
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
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 13 }}>
            <Pressable accessibilityRole="button" accessibilityLabel="Take a photo" onPress={takePhoto} style={{ flex: 1, padding: 15, borderWidth: 1, borderColor: colors.border, borderRadius: 13, alignItems: 'center' }}>
              <Text style={{ color: colors.blue, fontWeight: '700' }}>Take photo</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Choose photos from gallery" onPress={pickImage} style={{ flex: 1, padding: 15, borderWidth: 1, borderColor: colors.border, borderRadius: 13, alignItems: 'center' }}>
              <Text style={{ color: colors.blue, fontWeight: '700' }}>Choose from gallery</Text>
            </Pressable>
          </View>
          <Text style={{ color: colors.muted, marginBottom: 8 }}>{images.length}/3 photos</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 13 }}>
            {images.map((image, index) => (
              <View key={image.assetId || `${image.uri}-${index}`} style={{ width: 96, height: 96 }}>
                <Image source={{ uri: image.uri }} style={{ width: 96, height: 96, borderRadius: 12 }} />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove photo ${index + 1}`}
                  onPress={() => setImages((current) => current.filter((_, currentIndex) => currentIndex !== index))}
                  style={{ position: 'absolute', right: -6, top: -6, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.navy }}
                >
                  <Text style={{ color: colors.white, fontWeight: '800' }}>×</Text>
                </Pressable>
              </View>
            ))}
          </View>
          <Button title={busy ? 'Posting…' : 'Post item'} disabled={busy} onPress={submit} />
          <Text onPress={() => { setShowForm(false); clearFlow(); }} style={{ color: colors.blue, textAlign: 'center', margin: 16 }}>Cancel</Text>
        </View>}
      />
    </Screen>
  );

  return (
    <Screen>
      <View style={{ paddingHorizontal: 15, paddingTop: 15 }}>
        <Text style={{ color: colors.navy, fontSize: 24, fontWeight: '800' }}>Lost & Found</Text>
        <TextInput
          accessibilityLabel="Search Lost and Found posts"
          value={search}
          onChangeText={setSearch}
          placeholder="Search items or locations"
          placeholderTextColor={colors.muted}
          style={{ height: 46, marginTop: 12, paddingHorizontal: 13, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, color: colors.ink }}
        />
      </View>
      <View style={{ flexDirection: 'row', padding: 15, gap: 8 }}>
        {[['all', 'All'], ['lost', 'Lost'], ['found', 'Found']].map(([value, label]) => <Pressable key={value} accessibilityRole="button" accessibilityLabel={`Show ${label.toLowerCase()} Lost and Found posts`} onPress={() => setType(value)} style={{ flex: 1, alignItems: 'center', padding: 11, borderRadius: 18, backgroundColor: type === value ? colors.blue : colors.white }}>
          <Text style={{ color: type === value ? colors.white : colors.navy, fontWeight: '700' }}>{label}</Text>
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
        ListEmptyComponent={<EmptyState title={search ? 'No matching items' : `No ${type === 'all' ? '' : type + ' '}items posted`} detail="Be the first to share an update with your campus." />}
        ListFooterComponent={<Button title="＋  Report a lost or found item" onPress={() => { setType((current) => current === 'found' ? 'found' : 'lost'); setShowForm(true); }} />}
      />
    </Screen>
  );
}
