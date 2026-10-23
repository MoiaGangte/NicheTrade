import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { ProductCard, Screen } from '../../components/UI';
import { colors, shadow } from '../../theme';

export default function ExploreScreen() {
  const { api, products, categories, favorites, toggleFavorite, addToCart } = useApp();
  const params = useLocalSearchParams();
  const [query, setQuery] = useState('');
  const [lostFoundPosts, setLostFoundPosts] = useState([]);
  const [lostFoundLoading, setLostFoundLoading] = useState(true);
  const activeCategory = typeof params.category === 'string' ? params.category : '';
  const filtered = useMemo(() => products.filter((product) => {
    const text = `${product.name} ${product.description || ''} ${(product.categories || [product.category]).join(' ')}`.toLowerCase();
    const productCategories = product.categories?.length ? product.categories : [product.category];
    return text.includes(query.trim().toLowerCase())
      && (!activeCategory || productCategories.some((category) => category?.toLowerCase() === activeCategory.toLowerCase()));
  }), [products, query, activeCategory]);

  useEffect(() => {
    let active = true;
    api.get('/api/lost-found')
      .then(({ data }) => {
        if (!data.success) throw new Error(data.message || 'Unable to load Lost & Found posts');
        if (active) setLostFoundPosts(data.posts || []);
      })
      .catch((error) => {
        if (active) Alert.alert('Lost & Found', error.response?.data?.message || error.message);
      })
      .finally(() => {
        if (active) setLostFoundLoading(false);
      });
    return () => { active = false; };
  }, [api]);

  return (
    <Screen>
      <FlatList
        data={filtered}
        numColumns={2}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingHorizontal: 13, paddingBottom: 25 }}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        ListHeaderComponent={(
          <View style={{ paddingHorizontal: 5, paddingTop: 17, paddingBottom: 8 }}>
            <Text style={{ fontSize: 25, fontWeight: '800', color: colors.navy }}>Explore Listings</Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search products..."
              placeholderTextColor={colors.muted}
              style={{ height: 46, marginTop: 14, borderRadius: 24, paddingHorizontal: 16, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, color: colors.ink }}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 12, gap: 8 }}>
              {['', ...categories].map((item) => {
                const isSelected = activeCategory === item;
                return (
                  <Pressable key={item || 'all'} onPress={() => router.setParams({ category: item })} style={{ paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, backgroundColor: isSelected ? colors.blue : colors.white, borderWidth: 1, borderColor: isSelected ? colors.blue : colors.border }}>
                    <Text style={{ color: isSelected ? colors.white : colors.navy, fontSize: 12, fontWeight: '600' }}>{item || 'All'}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Text style={{ color: colors.navy, fontSize: 18, fontWeight: '800', marginTop: 5 }}>Products</Text>
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 3, marginBottom: 3 }}>
              {activeCategory ? `${activeCategory} · ` : ''}{filtered.length} listings
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={{ width: '50%' }}>
            <ProductCard
              product={item}
              onPress={() => router.push(`/product/${item._id}`)}
              onFavorite={() => toggleFavorite(item._id)}
              favorite={Boolean(favorites[item._id])}
              onAdd={() => addToCart(item._id)}
            />
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: colors.muted, textAlign: 'center', padding: 25 }}>No matching product listings found.</Text>}
        ListFooterComponent={(
          <View style={{ paddingHorizontal: 5, marginTop: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <View>
                <Text style={{ color: colors.navy, fontSize: 18, fontWeight: '800' }}>Lost & Found</Text>
                <Text style={{ color: colors.muted, fontSize: 12, marginTop: 3 }}>Campus lost and found items</Text>
              </View>
              <Pressable onPress={() => router.push('/lost-found')}>
                <Text style={{ color: colors.blue, fontWeight: '700' }}>See all  →</Text>
              </Pressable>
            </View>
            {lostFoundLoading ? (
              <ActivityIndicator color={colors.blue} style={{ padding: 20 }} />
            ) : lostFoundPosts.length ? (
              lostFoundPosts.map((post) => (
                <Pressable
                  key={post._id}
                  onPress={() => router.push(`/lost-found-detail?id=${post._id}`)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.white,
                    padding: 10,
                    borderRadius: 15,
                    marginBottom: 9,
                    opacity: pressed ? 0.82 : 1,
                    ...shadow,
                  })}
                >
                  {post.image ? <Image source={{ uri: post.image }} style={{ width: 66, height: 66, borderRadius: 11, backgroundColor: colors.paleBlue }} /> : null}
                  <View style={{ flex: 1, marginLeft: post.image ? 11 : 0 }}>
                    <Text style={{ color: colors.blue, fontSize: 11, fontWeight: '700' }}>{post.postType === 'lost' ? 'Lost item' : 'Found item'}</Text>
                    <Text numberOfLines={1} style={{ color: colors.navy, fontWeight: '800', marginTop: 3 }}>{post.itemName}</Text>
                    <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 11, marginTop: 4 }}>{post.placeFound || post.description}</Text>
                  </View>
                  <Text style={{ color: colors.blue, fontSize: 20, marginLeft: 8 }}>›</Text>
                </Pressable>
              ))
            ) : (
              <Text style={{ color: colors.muted, textAlign: 'center', padding: 20, backgroundColor: colors.white, borderRadius: 14 }}>
                No Lost & Found items posted yet.
              </Text>
            )}
          </View>
        )}
      />
    </Screen>
  );
}
