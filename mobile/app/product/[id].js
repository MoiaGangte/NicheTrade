import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { getErrorMessage } from '../../api';
import { Button, Field, Screen } from '../../components/UI';
import { colors, shadow } from '../../theme';

const locations = ['AFC', 'Near Department Store', 'MBA Canteen', 'Cafe Canteen', 'Other'];
const deliveryTimes = ['During lunch break', 'After college', 'Other'];

export default function ProductScreen() {
  const { id } = useLocalSearchParams();
  const { products, currency, favorites, toggleFavorite, api, user } = useApp();
  const [product, setProduct] = useState(products.find((item) => item._id === id) || null);
  const [imageIndex, setImageIndex] = useState(0);
  const [error, setError] = useState('');
  const [location, setLocation] = useState(locations[0]);
  const [deliveryTime, setDeliveryTime] = useState(deliveryTimes[0]);
  const [customLocation, setCustomLocation] = useState('');
  const [customDeliveryTime, setCustomDeliveryTime] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    if (product) return;
    api.post('/api/product/id', { id }).then(({ data }) => {
      if (!data.success || !data.product) throw new Error(data.message || 'Listing not found');
      setProduct(data.product);
    }).catch((requestError) => setError(getErrorMessage(requestError)));
  }, [id, product]);

  const placeOrder = async () => {
    if (!user) {
      router.push('/auth');
      return;
    }
    if (!product.inStock) return;
    if ((location === 'Other' && !customLocation.trim()) || (deliveryTime === 'Other' && !customDeliveryTime.trim())) {
      Alert.alert('Delivery details needed', 'Please enter your custom pickup location and time.');
      return;
    }

    setPlacingOrder(true);
    try {
      const { data } = await api.post('/api/order/place', {
        items: [{ product: product._id, quantity: 1 }],
        deliveryLocation: location,
        customDeliveryLocation: customLocation.trim(),
        deliveryTime,
        customDeliveryTime: customDeliveryTime.trim(),
      });
      if (!data.success) throw new Error(data.message || 'Unable to place order');
      Alert.alert(
        'Order sent to seller',
        data.notificationWarning || 'The seller was notified and can now chat with you about pickup and delivery.',
        [{ text: 'View messages', onPress: () => router.push('/(tabs)/messages') }, { text: 'View orders', onPress: () => router.push('/orders') }],
      );
    } catch (requestError) {
      Alert.alert('Order could not be placed', requestError.response?.data?.message || requestError.message);
    } finally {
      setPlacingOrder(false);
    }
  };

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
          <View style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ color: colors.navy, fontWeight: '800', fontSize: 18 }}>Recommended for you</Text>
              <Pressable onPress={() => router.push({ pathname: '/(tabs)/explore', params: { category: product.category } })}>
                <Text style={{ color: colors.blue, fontWeight: '700', fontSize: 13 }}>See more →</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 4 }}>
              {relatedProducts.map(({ item }) => (
                <Pressable
                  key={item._id}
                  onPress={() => router.push(`/product/${item._id}`)}
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
                    <Image source={{ uri: Array.isArray(item.image) ? item.image[0] : item.image }} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
                  </View>
                  <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 10, marginTop: 6 }}>
                    {(item.categories?.length ? item.categories : [item.category]).filter(Boolean).join(' · ')}
                  </Text>
                  <Text numberOfLines={1} style={{ color: colors.navy, fontWeight: '700', fontSize: 13, marginTop: 2 }}>
                    {item.name}
                  </Text>
                  <Text style={{ color: colors.blue, fontWeight: '800', fontSize: 14, marginTop: 4 }}>
                    {currency}{item.offerPrice}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </ScrollView>
      <ScrollView style={{ maxHeight: 330, borderTopColor: colors.border, borderTopWidth: 1, backgroundColor: colors.white }} contentContainerStyle={{ padding: 15 }}>
        <Button
          title={favorites[product._id] ? 'Saved to favorites' : 'Add to favorites'}
          onPress={() => toggleFavorite(product._id)}
        />
        <Text style={{ color: colors.navy, fontWeight: '800', marginTop: 14 }}>Campus pickup location</Text>
        <ChoiceChips values={locations} selected={location} onSelect={setLocation} />
        {location === 'Other' ? <Field label="Custom pickup location" value={customLocation} onChangeText={setCustomLocation} /> : null}
        <Text style={{ color: colors.navy, fontWeight: '800', marginTop: 6 }}>Preferred pickup time</Text>
        <ChoiceChips values={deliveryTimes} selected={deliveryTime} onSelect={setDeliveryTime} />
        {deliveryTime === 'Other' ? <Field label="Custom pickup time" value={customDeliveryTime} onChangeText={setCustomDeliveryTime} /> : null}
        <Button
          title={placingOrder ? 'Sending order…' : (product.inStock ? 'Request this item' : 'Out of stock')}
          disabled={placingOrder || !product.inStock}
          onPress={placeOrder}
          style={{ marginTop: 8 }}
        />
        <Text onPress={() => router.push('/favorites')} style={{ color: colors.blue, textAlign: 'center', marginTop: 11, fontWeight: '700' }}>View favorites</Text>
      </ScrollView>
    </Screen>
  );
}

function ChoiceChips({ values, selected, onSelect }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginVertical: 8 }}>
      {values.map((value) => (
        <Pressable
          key={value}
          accessibilityRole="button"
          accessibilityLabel={value}
          onPress={() => onSelect(value)}
          style={{ paddingHorizontal: 10, paddingVertical: 8, borderRadius: 16, backgroundColor: selected === value ? colors.blue : colors.white, borderWidth: 1, borderColor: selected === value ? colors.blue : colors.border }}
        >
          <Text style={{ color: selected === value ? colors.white : colors.navy, fontSize: 11 }}>{value}</Text>
        </Pressable>
      ))}
    </View>
  );
}
