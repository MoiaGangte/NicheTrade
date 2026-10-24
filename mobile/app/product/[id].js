import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useApp } from '../../context/AppContext';
import api, { getErrorMessage } from '../../api';
import { Button, Screen } from '../../components/UI';
import { colors, shadow } from '../../theme';

export default function ProductScreen() {
  const { id } = useLocalSearchParams();
  const { products, currency, addToCart, favorites, toggleFavorite, api, user } = useApp();
  const [product, setProduct] = useState(products.find((item) => item._id === id) || null);
  const [imageIndex, setImageIndex] = useState(0);
  const [error, setError] = useState('');
  const [startingChat, setStartingChat] = useState(false);

  useEffect(() => {
    if (product) return;
    api.post('/api/product/id', { id }).then(({ data }) => {
      if (!data.success || !data.product) throw new Error(data.message || 'Listing not found');
      setProduct(data.product);
    }).catch((requestError) => setError(getErrorMessage(requestError)));
  }, [id, product]);

  if (!product) return <Screen style={{ justifyContent: 'center', alignItems: 'center' }}>{error ? <Text style={{ color: colors.red }}>{error}</Text> : <ActivityIndicator color={colors.blue} />}</Screen>;

  const images = Array.isArray(product.image) ? product.image : [product.image].filter(Boolean);
  const description = Array.isArray(product.description) ? product.description.join('\n') : product.description;
  const seller = product.sellerId;
  const productCategories = product.categories?.length ? product.categories : [product.category];
  const relatedProducts = products
    .filter((item) => item._id !== product._id)
    .map((item) => {
      const categories = item.categories?.length ? item.categories : [item.category];
      const sharedCategories = categories.filter((category) => productCategories.includes(category)).length;
      return { item, sharedCategories };
    })
    .filter(({ sharedCategories }) => sharedCategories > 0)
    .sort((left, right) => right.sharedCategories - left.sharedCategories)
    .slice(0, 6);

  const chatWithSeller = async () => {
    if (!user) {
      router.push('/auth');
      return;
    }
    setStartingChat(true);
    try {
      const { data } = await api.post('/api/messages/conversations', { productId: product._id });
      if (!data.success || !data.conversation?._id) throw new Error(data.message || 'Unable to open chat');
      router.push(`/messages/${data.conversation._id}`);
    } catch (requestError) {
      Alert.alert('Chat with seller', requestError.response?.data?.message || requestError.message);
    } finally {
      setStartingChat(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 20 }}>
        <View style={{ height: 300, borderRadius: 20, overflow: 'hidden', backgroundColor: colors.paleBlue }}>
          {images[imageIndex] ? <Image source={{ uri: images[imageIndex] }} resizeMode="cover" style={{ width: '100%', height: '100%' }} /> : null}
          <View style={{ position: 'absolute', right: 12, top: 12, backgroundColor: '#142B4ACC', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 }}>
            <Text style={{ color: colors.white }}>{imageIndex + 1}/{images.length || 1}</Text>
          </View>
        </View>
        {images.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 9 }}>
            {images.map((image, index) => <Image key={`${image}-${index}`} source={{ uri: image }} onTouchEnd={() => setImageIndex(index)} style={{ width: 55, height: 55, borderRadius: 9, marginRight: 8 }} />)}
          </ScrollView>
        ) : null}
        <View style={{ marginTop: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ color: colors.navy, fontSize: 22, fontWeight: '800' }}>{product.name}</Text>
            <Text style={{ color: colors.muted, marginTop: 5 }}>{(product.categories?.length ? product.categories : [product.category]).join(' · ')}</Text>
          </View>
          <Text onPress={() => toggleFavorite(product._id)} style={{ color: favorites[product._id] ? colors.red : colors.navy, fontSize: 27 }}>{favorites[product._id] ? '♥' : '♡'}</Text>
        </View>
        <Text style={{ color: colors.blue, fontSize: 25, fontWeight: '900', marginTop: 10 }}>{currency}{product.offerPrice}</Text>
        {product.price > product.offerPrice ? <Text style={{ color: colors.muted, textDecorationLine: 'line-through' }}>{currency}{product.price}</Text> : null}
        <View style={{ backgroundColor: colors.softGreen, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 13, alignSelf: 'flex-start', marginTop: 11 }}>
          <Text style={{ color: colors.green, fontWeight: '700', fontSize: 12 }}>{product.inStock ? `Available · ${product.stockQuantity ?? 1} in stock` : 'Currently unavailable'}</Text>
        </View>
        <View style={{ marginTop: 17, padding: 14, borderRadius: 16, backgroundColor: colors.white, ...shadow }}>
          <Text style={{ color: colors.navy, fontWeight: '800', fontSize: 16 }}>Seller</Text>
          <Text style={{ color: colors.ink, marginTop: 8, fontWeight: '600' }}>{seller?.name || 'NicheTrade Seller'}</Text>
          {seller?.department ? <Text style={{ color: colors.muted, marginTop: 3 }}>{seller.department}</Text> : null}
        </View>
        <View style={{ paddingVertical: 18 }}>
          <Text style={{ color: colors.navy, fontWeight: '800', fontSize: 16, marginBottom: 8 }}>Description</Text>
          <Text style={{ color: colors.ink, lineHeight: 22 }}>{description || 'No description provided.'}</Text>
        </View>
        {relatedProducts.length ? (
          <View style={{ marginBottom: 8 }}>
            <Text style={{ color: colors.navy, fontWeight: '800', fontSize: 18, marginBottom: 10 }}>Related products</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {relatedProducts.map(({ item }) => (
                <Pressable key={item._id} onPress={() => router.push(`/product/${item._id}`)} style={{ width: 150, backgroundColor: colors.white, borderRadius: 14, padding: 9, ...shadow }}>
                  <Image source={{ uri: Array.isArray(item.image) ? item.image[0] : item.image }} style={{ width: 132, height: 105, borderRadius: 10, backgroundColor: colors.paleBlue }} />
                  <Text numberOfLines={1} style={{ color: colors.navy, fontWeight: '700', marginTop: 8 }}>{item.name}</Text>
                  <Text style={{ color: colors.blue, fontWeight: '800', marginTop: 3 }}>{currency}{item.offerPrice}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </ScrollView>
      <View style={{ padding: 15, borderTopColor: colors.border, borderTopWidth: 1, backgroundColor: colors.white }}>
        <Button title={product.inStock ? 'Add to Cart' : 'Out of stock'} disabled={!product.inStock} onPress={() => addToCart(product._id)} />
        <Button title={startingChat ? 'Opening chat…' : 'Chat with Seller'} secondary disabled={startingChat} onPress={chatWithSeller} style={{ marginTop: 9 }} />
        <Text onPress={() => router.push('/cart')} style={{ color: colors.blue, textAlign: 'center', marginTop: 11, fontWeight: '700' }}>View cart</Text>
      </View>
    </Screen>
  );
}
