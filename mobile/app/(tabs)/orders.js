import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View, RefreshControl } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { Button, EmptyState, PageTitle, Screen } from '../../components/UI';
import { colors, shadow } from '../../theme';

export default function OrdersScreen() {
  const { api, user, currency } = useApp();
  const [orders, setOrders] = useState([]);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setBusy(true);
    try {
      const { data } = await api.get('/api/order/user');
      if (!data.success) throw new Error(data.message || 'Unable to load orders');
      setOrders(data.orders || []);
    } catch (error) {
      setOrders([]);
    } finally {
      setBusy(false);
      setRefreshing(false);
    }
  }, [api, user]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const cancelOrder = (order) => Alert.alert('Cancel this order?', 'This will remove the pending order from your order history.', [
    { text: 'Keep order', style: 'cancel' },
    { text: 'Cancel order', style: 'destructive', onPress: async () => {
      try {
        const { data } = await api.delete(`/api/order/${order._id}`);
        if (!data.success) throw new Error(data.message || 'Unable to cancel order');
        await load();
      } catch (error) {
        Alert.alert('Order', error.response?.data?.message || error.message);
      }
    } },
  ]);

  if (!user) return <Screen style={{ padding: 20, justifyContent: 'center' }}><EmptyState title="Sign in to view your orders" /><Button title="Sign in" onPress={() => router.push('/auth')} /></Screen>;
  if (busy && !orders.length) return <Screen style={{ alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.blue} /></Screen>;

  return (
    <Screen>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />} contentContainerStyle={{ padding: 17, paddingBottom: 25 }}>
        <PageTitle title="My orders" subtitle="Track your campus purchases" right={<Pressable onPress={() => router.push('/cart')}><Text style={{ color: colors.blue, fontWeight: '700' }}>Cart  →</Text></Pressable>} />
        {!orders.length ? <EmptyState title="No orders yet" detail="Your purchases and order updates will show up here." /> : orders.map((order) => (
          <View key={order._id} style={{ backgroundColor: colors.white, padding: 13, borderRadius: 16, marginBottom: 11, ...shadow }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: colors.navy, fontWeight: '800' }}>{order.status || 'Order placed'}</Text>
              <Text style={{ color: colors.green, fontSize: 11, fontWeight: '700' }}>{order.paymentType === 'NONE' ? 'Pay on collection' : order.paymentType}</Text>
            </View>
            {(order.items || []).slice(0, 2).map((item, index) => {
              const product = item.product;
              return product ? <View key={`${product._id}-${index}`} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 11 }}>
                <Image source={{ uri: product.image?.[0] }} style={{ width: 56, height: 56, borderRadius: 10, backgroundColor: colors.paleBlue }} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text numberOfLines={1} style={{ color: colors.navy, fontWeight: '700' }}>{product.name}</Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>Qty {item.quantity}</Text>
                </View>
                <Text style={{ color: colors.blue, fontWeight: '800' }}>{currency}{product.offerPrice}</Text>
              </View> : null;
            })}
            <Text style={{ color: colors.muted, fontSize: 11, marginTop: 11 }}>{new Date(order.createdAt).toLocaleDateString()}</Text>
            <Text style={{ color: colors.navy, fontWeight: '800', marginTop: 4 }}>Total {currency}{order.amount}</Text>
            {!['Delivered', 'Cancelled'].includes(order.status) ? <Text onPress={() => cancelOrder(order)} style={{ color: colors.red, marginTop: 10, fontWeight: '700' }}>Cancel order</Text> : null}
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}
