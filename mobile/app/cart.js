import { useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../context/AppContext';
import { Button, EmptyState, Field, Screen } from '../components/UI';
import { colors } from '../theme';

const locations = ['AFC', 'Near Department Store', 'MBA Canteen', 'Cafe Canteen', 'Other'];
const times = ['During lunch break', 'After college', 'Other'];

export default function CartScreen() {
  const { api, products, cartItems, updateCartQuantity, currency, user, refreshProducts } = useApp();
  const [location, setLocation] = useState(locations[0]);
  const [time, setTime] = useState(times[0]);
  const [customLocation, setCustomLocation] = useState('');
  const [customTime, setCustomTime] = useState('');
  const [busy, setBusy] = useState(false);

  const items = useMemo(() => Object.entries(cartItems).map(([id, quantity]) => ({
    product: products.find((product) => product._id === id), id, quantity,
  })).filter((item) => item.product), [products, cartItems]);
  const total = items.reduce((sum, item) => sum + (item.product.offerPrice || 0) * item.quantity, 0);

  const placeOrder = async () => {
    if (!user) { router.push('/auth'); return; }
    if (!items.length) return;
    if ((location === 'Other' && !customLocation.trim()) || (time === 'Other' && !customTime.trim())) {
      Alert.alert('Delivery details needed', 'Please fill in your custom pickup location and time.');
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post('/api/order/place', {
        items: items.map(({ id, quantity }) => ({ product: id, quantity })),
        deliveryLocation: location,
        customDeliveryLocation: customLocation.trim(),
        deliveryTime: time,
        customDeliveryTime: customTime.trim(),
      });
      if (!data.success) throw new Error(data.message || 'Unable to place order');
      items.forEach((item) => updateCartQuantity(item.id, 0));
      await refreshProducts();
      Alert.alert('Order placed', 'Your order is confirmed. Payment is arranged directly with the seller on collection.', [
        { text: 'View orders', onPress: () => router.replace('/(tabs)/orders') },
      ]);
    } catch (error) {
      Alert.alert('Order could not be placed', error.response?.data?.message || error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      {!items.length ? <EmptyState title="Your cart is empty" detail="Browse listings and add something you like." /> : (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
          {items.map(({ id, quantity, product }) => (
            <View key={id} style={{ flexDirection: 'row', backgroundColor: colors.white, padding: 11, borderRadius: 15, marginBottom: 10, alignItems: 'center' }}>
              <Image source={{ uri: product.image?.[0] }} style={{ width: 76, height: 76, borderRadius: 11, backgroundColor: colors.paleBlue }} />
              <View style={{ flex: 1, marginLeft: 11 }}>
                <Text numberOfLines={1} style={{ color: colors.navy, fontWeight: '700' }}>{product.name}</Text>
                <Text style={{ color: colors.blue, fontWeight: '800', marginTop: 4 }}>{currency}{product.offerPrice}</Text>
                <View style={{ flexDirection: 'row', gap: 15, alignItems: 'center', marginTop: 8 }}>
                  <Text onPress={() => updateCartQuantity(id, quantity - 1)} style={{ color: colors.blue, fontSize: 19 }}>−</Text>
                  <Text style={{ color: colors.navy }}>{quantity}</Text>
                  <Text onPress={() => updateCartQuantity(id, quantity + 1)} style={{ color: colors.blue, fontSize: 19 }}>＋</Text>
                  <Text onPress={() => updateCartQuantity(id, 0)} style={{ color: colors.red, fontSize: 12 }}>Remove</Text>
                </View>
              </View>
            </View>
          ))}
          <Text style={{ color: colors.navy, fontWeight: '800', fontSize: 17, marginTop: 8, marginBottom: 8 }}>Pickup details</Text>
          <Text style={{ color: colors.muted, marginBottom: 8 }}>Choose a campus pickup location</Text>
          <OptionChips values={locations} selected={location} onSelect={setLocation} />
          {location === 'Other' ? <Field label="Custom pickup location" value={customLocation} onChangeText={setCustomLocation} placeholder="Enter a pickup location" /> : null}
          <Text style={{ color: colors.muted, marginBottom: 8, marginTop: 7 }}>Preferred pickup time</Text>
          <OptionChips values={times} selected={time} onSelect={setTime} />
          {time === 'Other' ? <Field label="Custom pickup time" value={customTime} onChangeText={setCustomTime} placeholder="Enter a pickup time" /> : null}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16 }}>
            <Text style={{ color: colors.navy, fontSize: 17, fontWeight: '700' }}>Total</Text>
            <Text style={{ color: colors.blue, fontSize: 19, fontWeight: '900' }}>{currency}{total}</Text>
          </View>
          <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 13 }}>Payment is arranged directly with the seller when collecting your order.</Text>
          <Button title={busy ? 'Placing order…' : 'Place order'} disabled={busy} onPress={placeOrder} />
        </ScrollView>
      )}
    </Screen>
  );
}

function OptionChips({ values, selected, onSelect }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 12 }}>
      {values.map((value) => <Pressable key={value} onPress={() => onSelect(value)} style={{ paddingHorizontal: 11, paddingVertical: 9, backgroundColor: selected === value ? colors.blue : colors.white, borderRadius: 18, borderWidth: 1, borderColor: selected === value ? colors.blue : colors.border }}>
        <Text style={{ color: selected === value ? colors.white : colors.navy, fontSize: 11, fontWeight: '600' }}>{value}</Text>
      </Pressable>)}
    </View>
  );
}
