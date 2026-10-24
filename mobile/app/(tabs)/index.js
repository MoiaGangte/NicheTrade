import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { CartIcon, EmptyState, ProductCard, Screen } from '../../components/UI';
import { colors, shadow } from '../../theme';

export default function HomeScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const { api, products, categories, cartItems, favorites, toggleFavorite, addToCart, user, loading } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [lostFoundPosts, setLostFoundPosts] = useState([]);
  const [itemRequests, setItemRequests] = useState([]);
  const [communitySearchLoading, setCommunitySearchLoading] = useState(false);
  const lastScrollY = useRef(0);
  const searchBarVisible = useRef(true);
  const searchBarHeight = useRef(new Animated.Value(62)).current;
  const bannerCircleSize = Math.min(170, Math.max(112, screenWidth * 0.4));
  const cartCount = Object.values(cartItems).reduce((total, quantity) => total + quantity, 0);
  const featured = useMemo(() => products.slice(0, 4), [products]);
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
  const queryTerms = normalizedQuery.split(/\s+/).filter(Boolean);
  const rankMatches = (items, getSearchText) => items
    .map((item) => {
      const text = getSearchText(item).toLocaleLowerCase();
      const matchingTerms = queryTerms.filter((term) => text.includes(term));
      if (!matchingTerms.length) return null;
      const score = matchingTerms.reduce((total, term) => {
        const position = text.indexOf(term);
        return total + (position === 0 ? 30 : position >= 0 ? 20 : 0);
      }, 0) + (text.includes(normalizedQuery) ? 50 : 0);
      return { item, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(({ item }) => item);
  const matchingProducts = rankMatches(products, (product) => [
      product.name,
      product.category,
      ...(product.categories || []),
      ...(Array.isArray(product.description) ? product.description : [product.description]),
    ].join(' '));
  const matchingLostFound = rankMatches(lostFoundPosts, (post) => (
    [post.itemName, post.placeFound, post.postType, post.description].join(' ')
  ));
  const matchingRequests = rankMatches(itemRequests, (request) => (
    [request.itemName, request.description].join(' ')
  ));
  const setSearchBarVisibility = useCallback((visible) => {
    if (searchBarVisible.current === visible) return;
    searchBarVisible.current = visible;
    Animated.timing(searchBarHeight, {
      toValue: visible ? 62 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [searchBarHeight]);
  const handleScroll = useCallback(({ nativeEvent }) => {
    const currentY = Math.max(0, nativeEvent.contentOffset.y);
    const scrollDelta = currentY - lastScrollY.current;
    lastScrollY.current = currentY;

    if (currentY < 8 || searchQuery.length > 0 || scrollDelta < -5) {
      setSearchBarVisibility(true);
    } else if (scrollDelta > 5) {
      setSearchBarVisibility(false);
    }
  }, [searchQuery, setSearchBarVisibility]);

  useEffect(() => {
    if (searchQuery.length > 0) setSearchBarVisibility(true);
  }, [searchQuery, setSearchBarVisibility]);

  useEffect(() => {
    if (!searchOpen) return undefined;
    let active = true;
    const loadCommunityResults = async () => {
      setCommunitySearchLoading(true);
      const results = await Promise.allSettled([
        api.get('/api/lost-found'),
        api.get('/api/request-items'),
      ]);
      if (!active) return;
      if (results[0].status === 'fulfilled' && results[0].value.data.success) {
        setLostFoundPosts(results[0].value.data.posts || []);
      } else if (results[0].status === 'rejected') {
        console.warn('Lost & Found search failed:', results[0].reason.message);
      }
      if (results[1].status === 'fulfilled' && results[1].value.data.success) {
        setItemRequests(results[1].value.data.requests || []);
      } else if (results[1].status === 'rejected') {
        console.warn('Item request search failed:', results[1].reason.message);
      }
      setCommunitySearchLoading(false);
    };
    loadCommunityResults();
    return () => { active = false; };
  }, [api, searchOpen]);

  return (
    <Screen>
      <View style={{ paddingHorizontal: 18, paddingTop: 12, backgroundColor: colors.canvas, zIndex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <View>
            <Text style={{ color: colors.navy, fontSize: 25, fontWeight: '900', letterSpacing: -0.7 }}>
              Niche<Text style={{ color: colors.blue }}>Trade</Text>
            </Text>
            <Text style={{ color: colors.muted, fontSize: 11, marginTop: 1 }}>Buy · Sell · Earn · Connect</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Cart, ${cartCount} items`}
              onPress={() => router.push('/cart')}
              style={{ width: 44, height: 44, borderRadius: 15, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center', ...shadow }}
            >
              <CartIcon />
              <View style={{ position: 'absolute', top: -3, right: -3, width: 18, height: 18, borderRadius: 9, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: colors.white, fontSize: 10, lineHeight: 12, fontWeight: '700' }}>{cartCount}</Text>
              </View>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Profile"
              onPress={() => router.push(user ? '/profile' : '/auth')}
              style={{ paddingHorizontal: 12, height: 44, borderRadius: 15, backgroundColor: colors.white, justifyContent: 'center', ...shadow }}
            >
              <Text style={{ color: colors.blue, fontSize: 12, fontWeight: '700' }}>Profile</Text>
            </Pressable>
          </View>
        </View>

        <Animated.View style={{ height: searchBarHeight, overflow: 'hidden' }}>
          <View style={{
            flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
            borderRadius: 15, paddingHorizontal: 14, height: 48, marginBottom: 14,
            borderWidth: 1, borderColor: colors.border,
          }}>
            <Text style={{ color: colors.navy, fontSize: 18, marginRight: 9 }}>⌕</Text>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search products, Lost & Found, requests..."
              placeholderTextColor={colors.muted}
              returnKeyType="search"
              style={{ flex: 1, color: colors.ink, fontSize: 16, paddingVertical: 0 }}
            />
            {searchQuery ? (
              <Text onPress={() => setSearchQuery('')} style={{ color: colors.muted, fontSize: 18, paddingHorizontal: 4 }}>×</Text>
            ) : null}
          </View>
        </Animated.View>
      </View>

      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 12, paddingBottom: 24 }}
      >
        {searchOpen && normalizedQuery ? (
          <View style={{ marginTop: 10, padding: 12, borderRadius: 15, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border }}>
            <SearchSection
              title="Products"
              emptyText="No matching products"
              items={matchingProducts}
              renderItem={(product) => (
                <Pressable key={product._id} onPress={() => router.push(`/product/${product._id}`)} style={searchRowStyle}>
                  <Image source={{ uri: Array.isArray(product.image) ? product.image[0] : product.image }} style={searchImageStyle} />
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={searchTitleStyle}>{product.name}</Text>
                    <Text numberOfLines={1} style={searchDetailStyle}>₹{product.offerPrice}</Text>
                  </View>
                </Pressable>
              )}
            />
            <SearchSection
              title="Lost & Found"
              emptyText={communitySearchLoading ? 'Searching Lost & Found...' : 'No matching Lost & Found posts'}
              items={matchingLostFound}
              renderItem={(post) => (
                <Pressable key={post._id} onPress={() => router.push(`/lost-found-detail?id=${post._id}`)} style={searchRowStyle}>
                  {post.image ? <Image source={{ uri: post.image }} style={searchImageStyle} /> : null}
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={searchTitleStyle}>{post.itemName}</Text>
                    <Text numberOfLines={1} style={searchDetailStyle}>{post.postType === 'lost' ? 'Lost item' : `Found · ${post.placeFound || 'Campus'}`}</Text>
                  </View>
                </Pressable>
              )}
            />
            <SearchSection
              title="Request Items"
              emptyText={communitySearchLoading ? 'Searching item requests...' : 'No matching item requests'}
              items={matchingRequests}
              renderItem={(request) => (
                <Pressable key={request._id} onPress={() => router.push(`/request-item-detail?id=${request._id}`)} style={searchRowStyle}>
                  {request.image ? <Image source={{ uri: request.image }} style={searchImageStyle} /> : null}
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={searchTitleStyle}>{request.itemName}</Text>
                    <Text numberOfLines={1} style={searchDetailStyle}>₹{request.promiseAmount} offered</Text>
                  </View>
                </Pressable>
              )}
            />
            <Pressable onPress={() => { setSearchOpen(false); setSearchQuery(''); }} style={{ alignSelf: 'flex-end', paddingTop: 7 }}>
              <Text style={{ color: colors.blue, fontWeight: '700', fontSize: 12 }}>Close</Text>
            </Pressable>
          </View>
        ) : null}

        <Pressable onPress={() => router.push({ pathname: '/(tabs)/explore', params: { category: '' } })} style={{
          minHeight: 132, borderRadius: 20, padding: 20, overflow: 'hidden',
          backgroundColor: '#DBEAFE', justifyContent: 'center', ...shadow,
        }}>
          <View style={{
            position: 'absolute',
            right: -bannerCircleSize * 0.15,
            top: -bannerCircleSize * 0.16,
            width: bannerCircleSize,
            height: bannerCircleSize,
            borderRadius: bannerCircleSize / 2,
            backgroundColor: '#C2D8FF',
            overflow: 'hidden',
          }}>
            <Image
              source={require('../../assets/campus.png')}
              resizeMode="cover"
              style={{ width: '100%', height: '100%' }}
            />
          </View>
          <Text style={{ color: colors.navy, fontSize: 22, fontWeight: '800', width: '60%', lineHeight: 27 }}>Niche Campus Marketplace</Text>
          <Text style={{ color: '#355679', marginTop: 6, fontSize: 13 }}>Buy, sell, Earn, find — all in one place.</Text>
          <Text style={{ color: colors.blue, fontSize: 12, marginTop: 14, fontWeight: '700' }}>Explore listings →</Text>
        </Pressable>

        {categories.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 17, gap: 10 }}>
            {categories.map((category, index) => (
              <Pressable key={category} onPress={() => router.push({ pathname: '/(tabs)/explore', params: { category } })} style={{
                minWidth: 85, paddingVertical: 10, paddingHorizontal: 13, borderRadius: 20,
                backgroundColor: index % 2 ? colors.white : colors.paleBlue, alignItems: 'center',
                borderColor: colors.border, borderWidth: 1,
              }}>
                <Text numberOfLines={1} style={{ color: colors.navy, fontWeight: '600', fontSize: 12 }}>{category}</Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 22 }}>
          <ActionTile icon="⌕" title="Lost & Found" subtitle="Find what you lost" onPress={() => router.push('/lost-found')} tint="#E8EEFF" />
          <ActionTile icon="◇" title="Request an item" subtitle="Ask the community" onPress={() => router.push('/requests')} tint="#E4F8F1" />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
          <Text style={{ color: colors.navy, fontSize: 18, fontWeight: '800' }}>Marketplace listings</Text>
        </View>
        {featured.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 }}>
            {featured.map((product) => (
              <View key={product._id} style={{ width: '50%' }}>
                <ProductCard
                  product={product}
                  onPress={() => router.push(`/product/${product._id}`)}
                  onFavorite={() => toggleFavorite(product._id)}
                  favorite={Boolean(favorites[product._id])}
                  onAdd={() => addToCart(product._id)}
                />
              </View>
            ))}
          </View>
        ) : (
          <EmptyState title={loading ? 'Loading marketplace…' : 'No listings available right now'} detail="New campus listings will appear here when sellers post them." />
        )}
        {products.length > featured.length ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/(tabs)/explore')}
            style={({ pressed }) => ({
              minHeight: 46,
              marginTop: 8,
              marginBottom: 18,
              borderRadius: 13,
              borderWidth: 1,
              borderColor: colors.blue,
              backgroundColor: pressed ? colors.paleBlue : colors.white,
              alignItems: 'center',
              justifyContent: 'center',
            })}
          >
            <Text style={{ color: colors.blue, fontWeight: '700', fontSize: 14 }}>See more listings  →</Text>
          </Pressable>
        ) : null}

        <View style={{ height: 16 }} />
        <Pressable onPress={() => router.push('/(tabs)/sell')} style={{ backgroundColor: colors.navy, borderRadius: 17, padding: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ color: colors.white, fontSize: 16, fontWeight: '800' }}>Have something to sell?</Text>
            <Text style={{ color: '#D4E2F4', marginTop: 5 }}>Reach your campus community.</Text>
          </View>
          <Text style={{ color: colors.white, fontSize: 25 }}>＋</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/lost-found')} style={({ pressed }) => ({
          marginTop: 12,
          backgroundColor: '#E8EEFF',
          borderRadius: 17,
          padding: 17,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          opacity: pressed ? 0.82 : 1,
        })}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ color: colors.navy, fontSize: 16, fontWeight: '800' }}>Lost & Found</Text>
            <Text style={{ color: colors.muted, marginTop: 5 }}>Report a lost item or help return something found inside the Campus</Text>
          </View>
          <Text style={{ color: colors.blue, fontSize: 24 }}>⌕</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/requests')} style={({ pressed }) => ({
          marginTop: 10,
          backgroundColor: '#E4F8F1',
          borderRadius: 17,
          padding: 17,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          opacity: pressed ? 0.82 : 1,
        })}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ color: colors.navy, fontSize: 16, fontWeight: '800' }}>Earn Money as a Student</Text>
            <Text style={{ color: colors.muted, marginTop: 5 }}>Help delivery request item and earn extra money</Text>
          </View>
          <Text style={{ color: colors.green, fontSize: 24 }}>◇</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/about-links')} style={{ marginTop: 12, backgroundColor: colors.white, borderRadius: 17, padding: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: colors.border, ...shadow }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ color: colors.navy, fontSize: 16, fontWeight: '800' }}>About NicheTrade</Text>
            <Text style={{ color: colors.muted, marginTop: 5 }}>Discover helpful pages and connect with us.</Text>
          </View>
          <Text style={{ color: colors.blue, fontSize: 22 }}>›</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/donate')} style={({ pressed }) => ({
          marginTop: 10,
          backgroundColor: colors.paleBlue,
          borderRadius: 17,
          padding: 17,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderWidth: 1,
          borderColor: colors.border,
          opacity: pressed ? 0.82 : 1,
        })}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ color: colors.navy, fontSize: 16, fontWeight: '800' }}>Donate to Support NicheTrade</Text>
            <Text style={{ color: colors.muted, marginTop: 5 }}>Make an optional donation to support the community of Developer.</Text>
          </View>
          <Text style={{ color: colors.blue, fontSize: 22 }}>♥</Text>
        </Pressable>
        {user ? null : <Text style={{ color: colors.muted, textAlign: 'center', fontSize: 11, marginTop: 18 }}>Made for students, by students 💙</Text>}
      </ScrollView>
    </Screen>
  );
}

const searchRowStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
  width: 190,
  minHeight: 66,
  padding: 8,
  marginRight: 8,
  borderRadius: 12,
  backgroundColor: colors.canvas,
};
const searchImageStyle = {
  width: 42,
  height: 42,
  borderRadius: 9,
  backgroundColor: colors.paleBlue,
};
const searchTitleStyle = { color: colors.navy, fontSize: 13, fontWeight: '700' };
const searchDetailStyle = { color: colors.muted, fontSize: 11, marginTop: 3 };

function SearchSection({ title, items, emptyText, renderItem }) {
  return (
    <View style={{ marginBottom: 8 }}>
      <Text style={{ color: colors.navy, fontSize: 14, fontWeight: '800', paddingTop: 6, paddingBottom: 2 }}>{title}</Text>
      {items.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 5 }}>
          {items.map(renderItem)}
        </ScrollView>
      ) : <Text style={{ color: colors.muted, fontSize: 11, paddingVertical: 6 }}>{emptyText}</Text>}
    </View>
  );
}

function ActionTile({ icon, title, subtitle, onPress, tint }) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1, borderRadius: 15, padding: 12, backgroundColor: tint, flexDirection: 'row', alignItems: 'center' }}>
      <Text style={{ fontSize: 21, color: colors.blue, marginRight: 9 }}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={{ color: colors.navy, fontSize: 12, fontWeight: '700' }}>{title}</Text>
        <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 10, marginTop: 3 }}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}
