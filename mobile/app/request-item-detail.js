import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useApp } from '../context/AppContext';
import { Button, Screen } from '../components/UI';
import { colors, shadow } from '../theme';

export default function RequestItemDetailScreen() {
  const { id } = useLocalSearchParams();
  const { api, user } = useApp();
  const [request, setRequest] = useState(null);
  const [related, setRelated] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [detailResult, listResult] = await Promise.allSettled([
      api.get(`/api/request-items/${id}`),
      api.get('/api/request-items'),
    ]);
    if (detailResult.status === 'rejected') throw detailResult.reason;
    const detailResponse = detailResult.value;
    if (!detailResponse.data.success || !detailResponse.data.request) {
      throw new Error(detailResponse.data.message || 'Item request not found');
    }
    const currentRequest = detailResponse.data.request;
    setRequest(currentRequest);
    if (listResult.status === 'fulfilled' && listResult.value.data.success) {
      setRelated((listResult.value.data.requests || []).filter((item) => item._id !== id).slice(0, 5));
    } else if (listResult.status === 'rejected') {
      console.warn('Related item requests failed to load:', listResult.reason.message);
    }
  }, [api, id]);

  useEffect(() => {
    let active = true;
    load().catch((requestError) => {
      if (active) setError(requestError.response?.data?.message || requestError.message || 'Unable to load request');
    });
    return () => { active = false; };
  }, [load]);

  const confirm = async () => {
    if (!user) {
      router.push('/auth');
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post(`/api/request-items/${request._id}/confirm`);
      if (!data.success) throw new Error(data.message || 'Unable to confirm request');
      Alert.alert('Thanks for helping', data.message);
      await load();
    } catch (requestError) {
      Alert.alert('Unable to confirm request', requestError.response?.data?.message || requestError.message);
    } finally {
      setBusy(false);
    }
  };

  if (!request) {
    return <Screen style={{ justifyContent: 'center', alignItems: 'center' }}>
      {error ? <Text style={{ color: colors.red, padding: 20 }}>{error}</Text> : <ActivityIndicator color={colors.blue} />}
    </Screen>;
  }

  const requesterName = request.requesterId?.name;
  const alreadyConfirmed = request.confirmations?.some((item) => (
    (typeof item.userId === 'string' ? item.userId : item.userId?._id)?.toString() === user?._id?.toString()
  ));
  const isOwner = request.requesterId?._id?.toString() === user?._id?.toString();

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 17, paddingBottom: 28 }}>
        {request.image ? <Image source={{ uri: request.image }} resizeMode="cover" style={{ width: '100%', height: 250, borderRadius: 19, backgroundColor: colors.paleBlue }} /> : null}
        <Text style={{ color: colors.navy, fontSize: 24, fontWeight: '800', marginTop: 16 }}>{request.itemName}</Text>
        <Text style={{ color: colors.ink, fontSize: 15, lineHeight: 23, marginTop: 11 }}>{request.description}</Text>
        <View style={{ backgroundColor: colors.softGreen, borderRadius: 14, padding: 13, marginTop: 16 }}>
          <Text style={{ color: colors.green, fontWeight: '800', fontSize: 17 }}>₹{request.promiseAmount} offered</Text>
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>{request.confirmations?.length || 0} student(s) can help</Text>
        </View>
        {requesterName ? <Text style={{ color: colors.muted, marginTop: 13 }}>Requested by {requesterName}</Text> : null}
        <Button
          title={busy ? 'Confirming…' : alreadyConfirmed ? 'You have offered to help' : isOwner ? 'Your request' : 'I can help'}
          disabled={busy || alreadyConfirmed || isOwner}
          onPress={confirm}
          style={{ marginTop: 15 }}
        />
        {related.length ? (
          <View style={{ marginTop: 27 }}>
            <Text style={{ color: colors.navy, fontSize: 18, fontWeight: '800', marginBottom: 11 }}>Related item requests</Text>
            {related.map((item) => (
              <Pressable key={item._id} onPress={() => router.replace(`/request-item-detail?id=${item._id}`)} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, padding: 10, borderRadius: 14, marginBottom: 9, ...shadow }}>
                {item.image ? <Image source={{ uri: item.image }} style={{ width: 58, height: 58, borderRadius: 10, backgroundColor: colors.paleBlue }} /> : null}
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text numberOfLines={1} style={{ color: colors.navy, fontWeight: '700' }}>{item.itemName}</Text>
                  <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>{item.description}</Text>
                </View>
                <Text style={{ color: colors.blue, fontSize: 20, marginLeft: 8 }}>›</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        <Button title="Browse all requests" secondary onPress={() => router.push('/(tabs)/requests')} style={{ marginTop: 18 }} />
      </ScrollView>
    </Screen>
  );
}
