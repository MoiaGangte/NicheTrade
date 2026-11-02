import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useApp } from '../context/AppContext';
import { Button, Screen } from '../components/UI';
import { colors, shadow } from '../theme';

export default function LostFoundDetailScreen() {
  const { id } = useLocalSearchParams();
  const { api } = useApp();
  const [post, setPost] = useState(null);
  const [related, setRelated] = useState([]);
  const [error, setError] = useState('');

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
        {related.length ? (
          <View style={{ marginTop: 25 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 }}>
              <Text style={{ color: colors.navy, fontSize: 18, fontWeight: '800' }}>
                More {post.postType === 'lost' ? 'Lost' : 'Found'} items
              </Text>
              <Pressable onPress={() => router.push('/(tabs)/lost-found')}>
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
        <Button title="Browse Lost & Found" secondary onPress={() => router.push('/(tabs)/lost-found')} style={{ marginTop: 18 }} />
      </ScrollView>
    </Screen>
  );
}
