import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useApp } from '../context/AppContext';
import { Button, Screen } from '../components/UI';
import { colors, shadow } from '../theme';
import { useMessages } from '../context/MessagesContext';

export default function LostFoundDetailScreen() {
  const { id } = useLocalSearchParams();
  const { api, user } = useApp();
  const { refreshConversations } = useMessages();
  const [post, setPost] = useState(null);
  const [related, setRelated] = useState([]);
  const [error, setError] = useState('');
  const [claimOpen, setClaimOpen] = useState(false);
  const [claimBusy, setClaimBusy] = useState(false);
  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [customPickupLocation, setCustomPickupLocation] = useState('');
  const [customPickupTime, setCustomPickupTime] = useState('');

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      api.get(`/api/lost-found/${id}`),
      api.get('/api/lost-found'),
    ]).then(([detailResult, listResult]) => {
      if (!active) return;
      if (detailResult.status === 'rejected') throw detailResult.reason;
      const detailResponse = detailResult.value;
      if (!detailResponse.data.success || !detailResponse.data.post) {
        throw new Error(detailResponse.data.message || 'Lost & Found post not found');
      }
      setPost(detailResponse.data.post);
      if (listResult.status === 'fulfilled' && listResult.value.data.success) {
        setRelated((listResult.value.data.posts || [])
          .filter((item) => item._id !== id && item.postType === detailResponse.data.post.postType)
          .slice(0, 5));
      } else if (listResult.status === 'rejected') {
        console.warn('Related Lost & Found posts failed to load:', listResult.reason.message);
      }
    }).catch((requestError) => {
      if (active) setError(requestError.response?.data?.message || requestError.message || 'Unable to load post');
    });
    return () => { active = false; };
  }, [api, id]);

  const ownerId = post?.userId?._id || post?.userId;
  const isOwner = Boolean(user?._id && ownerId && String(ownerId) === String(user._id));

  const deletePost = () => {
    Alert.alert('Delete post?', 'This Lost & Found post will be permanently removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/api/lost-found/${id}`);
            router.replace('/lost-found');
          } catch (requestError) {
            Alert.alert('Unable to delete', requestError.response?.data?.message || requestError.message);
          }
        },
      },
    ]);
  };

  const submitClaim = async () => {
    const location = pickupLocation === 'Other' ? customPickupLocation : pickupLocation;
    const time = pickupTime === 'Other' ? customPickupTime : pickupTime;
    if (!location.trim()) return Alert.alert('Choose pickup location', 'Select where you will collect the item.');
    setClaimBusy(true);
    try {
      const { data } = await api.post(`/api/lost-found/${id}/confirm`, {
        pickupLocation: location.trim(),
        pickupTime: time.trim(),
      });
      setClaimOpen(false);
      await refreshConversations().catch((error) => console.warn('Unable to refresh chats:', error.message));
      if (data.conversationId) router.replace(`/messages/${data.conversationId}`);
      else {
        router.replace('/lost-found');
        Alert.alert('Claim recorded', 'The item was claimed, but the chat could not be opened. Check Messages.');
      }
    } catch (requestError) {
      Alert.alert('Unable to claim item', requestError.response?.data?.message || requestError.message);
    } finally {
      setClaimBusy(false);
    }
  };

  if (!post) {
    return <Screen style={{ justifyContent: 'center', alignItems: 'center' }}>
      {error ? <Text style={{ color: colors.red, padding: 20 }}>{error}</Text> : <ActivityIndicator color={colors.blue} />}
    </Screen>;
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 17, paddingBottom: 28 }}>
        {post.image ? <Image source={{ uri: post.image }} resizeMode="cover" style={{ width: '100%', height: 250, borderRadius: 19, backgroundColor: colors.paleBlue }} /> : null}
        <View style={{ marginTop: 16, alignSelf: 'flex-start', backgroundColor: colors.paleBlue, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 7 }}>
          <Text style={{ color: colors.blue, fontWeight: '700' }}>{post.postType === 'lost' ? 'Lost item' : 'Found item'}</Text>
        </View>
        <Text style={{ color: colors.navy, fontSize: 24, fontWeight: '800', marginTop: 12 }}>{post.itemName}</Text>
        {post.placeFound ? <Text style={{ color: colors.muted, marginTop: 7 }}>Found at {post.placeFound}</Text> : null}
        <Text style={{ color: colors.ink, fontSize: 15, lineHeight: 23, marginTop: 16 }}>{post.description}</Text>
        <Text style={{ color: colors.muted, fontSize: 12, marginTop: 13 }}>
          Posted {new Date(post.foundAt || post.createdAt).toLocaleDateString()}
        </Text>
        {isOwner ? (
          <Button title="Delete this post" onPress={deletePost} style={{ marginTop: 18 }} />
        ) : post.postType === 'found' ? (
          <Button title="Claim item" onPress={() => setClaimOpen(true)} style={{ marginTop: 18 }} />
        ) : null}
        {related.length ? (
          <View style={{ marginTop: 25 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 }}>
              <Text style={{ color: colors.navy, fontSize: 18, fontWeight: '800' }}>
                More {post.postType === 'lost' ? 'Lost' : 'Found'} items
              </Text>
              <Pressable onPress={() => router.push('/lost-found')}>
                <Text style={{ color: colors.blue, fontWeight: '700', fontSize: 13 }}>See all →</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 4 }}>
              {related.map((item) => (
                <Pressable
                  key={item._id}
                  onPress={() => router.replace(`/lost-found-detail?id=${item._id}`)}
                  style={({ pressed }) => [{
                    width: 155,
                    backgroundColor: colors.white,
                    borderRadius: 14,
                    padding: 9,
                    borderWidth: 1,
                    borderColor: colors.border,
                    opacity: pressed ? 0.9 : 1,
                    ...shadow,
                  }]}
                >
                  <View style={{ height: 110, borderRadius: 10, overflow: 'hidden', backgroundColor: colors.paleBlue }}>
                    {item.image ? (
                      <Image source={{ uri: item.image }} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
                    ) : (
                      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 24, color: colors.muted }}>⌕</Text>
                      </View>
                    )}
                    <View style={{
                      position: 'absolute', top: 6, left: 6,
                      backgroundColor: item.postType === 'lost' ? '#DC2626' : '#2563EB',
                      paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6,
                    }}>
                      <Text style={{ color: colors.white, fontSize: 9, fontWeight: '800', textTransform: 'uppercase' }}>
                        {item.postType === 'lost' ? 'Lost' : 'Found'}
                      </Text>
                    </View>
                  </View>
                  <Text numberOfLines={1} style={{ color: colors.navy, fontWeight: '700', fontSize: 13, marginTop: 7 }}>
                    {item.itemName}
                  </Text>
                  <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 11, marginTop: 2 }}>
                    {item.placeFound || item.description}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}
        <Button title="Browse Lost & Found" secondary onPress={() => router.push('/lost-found')} style={{ marginTop: 18 }} />
      </ScrollView>
      <Modal visible={claimOpen} transparent animationType="slide" onRequestClose={() => setClaimOpen(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' }}>
          <View style={{ backgroundColor: colors.white, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 18, maxHeight: '82%' }}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text accessibilityRole="header" style={{ color: colors.navy, fontSize: 21, fontWeight: '800' }}>Claim {post.itemName}</Text>
              <Text style={{ color: colors.muted, marginTop: 7 }}>Choose where and when you can collect it.</Text>
              <Text style={{ color: colors.navy, fontWeight: '700', marginTop: 16 }}>Campus pickup location</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {['Main Gate', 'Library', 'Canteen', 'Hostel', 'Department Block', 'Other'].map((location) => (
                  <Pressable key={location} accessibilityRole="button" accessibilityLabel={`Pickup at ${location}`} onPress={() => setPickupLocation(location)} style={{ paddingHorizontal: 12, paddingVertical: 9, borderRadius: 18, backgroundColor: pickupLocation === location ? colors.blue : colors.paleBlue }}>
                    <Text style={{ color: pickupLocation === location ? colors.white : colors.navy, fontWeight: '700', fontSize: 12 }}>{location}</Text>
                  </Pressable>
                ))}
              </View>
              {pickupLocation === 'Other' ? <TextInput accessibilityLabel="Other pickup location" value={customPickupLocation} onChangeText={setCustomPickupLocation} placeholder="Enter campus location" style={{ marginTop: 10, height: 44, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12 }} /> : null}
              <Text style={{ color: colors.navy, fontWeight: '700', marginTop: 16 }}>Preferred pickup time</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {['Morning', 'Afternoon', 'Evening', 'Other'].map((time) => (
                  <Pressable key={time} accessibilityRole="button" accessibilityLabel={`Pickup time ${time}`} onPress={() => setPickupTime(time)} style={{ paddingHorizontal: 12, paddingVertical: 9, borderRadius: 18, backgroundColor: pickupTime === time ? colors.blue : colors.paleBlue }}>
                    <Text style={{ color: pickupTime === time ? colors.white : colors.navy, fontWeight: '700', fontSize: 12 }}>{time}</Text>
                  </Pressable>
                ))}
              </View>
              {pickupTime === 'Other' ? <TextInput accessibilityLabel="Other pickup time" value={customPickupTime} onChangeText={setCustomPickupTime} placeholder="e.g. Today at 5 PM" style={{ marginTop: 10, height: 44, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12 }} /> : null}
              <Button title={claimBusy ? 'Sending claim...' : 'Send claim'} disabled={claimBusy} onPress={submitClaim} style={{ marginTop: 18 }} />
              <Pressable accessibilityRole="button" accessibilityLabel="Cancel claim" onPress={() => setClaimOpen(false)} style={{ alignItems: 'center', paddingVertical: 12 }}>
                <Text style={{ color: colors.blue, fontWeight: '700' }}>Cancel</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
