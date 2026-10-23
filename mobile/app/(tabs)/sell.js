import { useCallback, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../../context/AppContext';
import { Button, EmptyState, Field, Screen } from '../../components/UI';
import { colors } from '../../theme';
import appendImageToFormData from '../../utils/appendImageToFormData';

export default function SellScreen() {
  const { api, user, seller, setSeller, categories, refreshProducts } = useApp();
  const [form, setForm] = useState({ storeName: '', phone: '', storeDescription: '' });
  const [product, setProduct] = useState({ name: '', category: '', price: '', offerPrice: '', stockQuantity: '1', description: '' });
  const [images, setImages] = useState([]);
  const [myProducts, setMyProducts] = useState([]);
  const [sellerOrders, setSellerOrders] = useState([]);
  const [sellerView, setSellerView] = useState('listings');
  const [busy, setBusy] = useState(false);
  const updateSellerForm = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));
  const updateProduct = (key) => (value) => setProduct((current) => ({ ...current, [key]: value }));

  const loadSeller = useCallback(async () => {
    if (!seller?.isApproved) return;
    try {
      const [productsResponse, ordersResponse] = await Promise.all([
        api.get('/api/product/seller/list'),
        api.get('/api/order/seller'),
      ]);
      if (productsResponse.data.success) setMyProducts(productsResponse.data.products || []);
      if (ordersResponse.data.success) setSellerOrders(ordersResponse.data.orders || []);
    } catch (error) {
      Alert.alert('Seller dashboard', error.response?.data?.message || error.message);
    }
  }, [api, seller]);
  useFocusEffect(useCallback(() => { loadSeller(); }, [loadSeller]));

  const selectImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo access needed', 'Allow access to your photos to add product images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: 4, quality: 0.85 });
    if (!result.canceled) setImages(result.assets.slice(0, 4));
  };

  const registerSeller = async () => {
    setBusy(true);
    try {
      const { data } = await api.post('/api/seller/register', form);
      if (!data.success) throw new Error(data.message || 'Seller registration failed');
      setSeller(data.seller);
      Alert.alert('Seller application sent', data.message || 'Your seller profile is ready.');
    } catch (error) {
      Alert.alert('Seller registration', error.response?.data?.message || error.message);
    } finally {
      setBusy(false);
    }
  };

  const submitProduct = async () => {
    if (!product.name.trim() || !product.category.trim() || !product.description.trim() || !product.price || !images.length) {
      Alert.alert('Listing details needed', 'Add a name, category, price, description, and at least one photo.');
      return;
    }
    setBusy(true);
    try {
      const data = new FormData();
      data.append('productData', JSON.stringify({
        name: product.name.trim(),
        category: product.category.trim(),
        categories: [product.category.trim()],
        price: Number(product.price),
        offerPrice: Number(product.offerPrice || product.price),
        stockQuantity: Number(product.stockQuantity),
        description: product.description.split('\n').map((line) => line.trim()).filter(Boolean),
      }));
      for (const [index, image] of images.entries()) {
        await appendImageToFormData(data, 'images', image, `listing-${index}.jpg`);
      }
      const response = await api.post('/api/product/add', data);
      if (!response.data.success) throw new Error(response.data.message || 'Listing upload failed');
      setProduct({ name: '', category: '', price: '', offerPrice: '', stockQuantity: '1', description: '' });
      setImages([]);
      await Promise.all([loadSeller(), refreshProducts()]);
      Alert.alert('Listing published', 'Your product was added to the campus marketplace.');
    } catch (error) {
      Alert.alert('Could not publish listing', error.response?.data?.message || error.message);
    } finally {
      setBusy(false);
    }
  };

  const changeStock = async (item, quantity) => {
    try {
      const { data } = await api.post('/api/product/stock', { id: item._id, stockQuantity: quantity });
      if (!data.success) throw new Error(data.message || 'Unable to update stock');
      await loadSeller();
      await refreshProducts();
    } catch (error) {
      Alert.alert('Stock update', error.response?.data?.message || error.message);
    }
  };

  if (!user) return <Screen style={{ padding: 18, justifyContent: 'center' }}><EmptyState title="Start selling on campus" detail="Sign in with your student account to register as a seller." /><Button title="Sign in" onPress={() => router.push('/auth')} /></Screen>;

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 17, paddingBottom: 28 }}>
          <Text style={{ color: colors.navy, fontSize: 24, fontWeight: '800', marginBottom: 4 }}>Sell on NicheTrade</Text>
          <Text style={{ color: colors.muted, marginBottom: 16 }}>List products for your campus community.</Text>

          {user.role !== 'seller' ? (
            <View style={{ padding: 15, backgroundColor: colors.white, borderRadius: 16 }}>
              <Text style={{ color: colors.navy, fontSize: 17, fontWeight: '800', marginBottom: 13 }}>Register as a seller</Text>
              <Field label="Store name" value={form.storeName} onChangeText={updateSellerForm('storeName')} placeholder="Your store name" />
              <Field label="Phone" value={form.phone} onChangeText={updateSellerForm('phone')} placeholder="Contact phone" keyboardType="phone-pad" />
              <Field label="Store description" value={form.storeDescription} onChangeText={updateSellerForm('storeDescription')} placeholder="Tell students about your store" multiline />
              <Button title="Submit seller registration" disabled={busy} onPress={registerSeller} />
            </View>
          ) : !seller?.isApproved ? (
            <View style={{ padding: 18, backgroundColor: colors.paleBlue, borderRadius: 16 }}>
              <Text style={{ color: colors.navy, fontSize: 17, fontWeight: '800' }}>Seller application pending</Text>
              <Text style={{ color: colors.muted, marginTop: 6, lineHeight: 20 }}>Your seller registration is awaiting admin approval. You can list items once your account is approved.</Text>
            </View>
          ) : (
            <>
              <View style={{ backgroundColor: colors.white, padding: 15, borderRadius: 16 }}>
                <Text style={{ color: colors.navy, fontSize: 17, fontWeight: '800', marginBottom: 13 }}>Add new listing</Text>
                <Field label="Product name" value={product.name} onChangeText={updateProduct('name')} placeholder="Enter product name" />
                <Text style={{ color: colors.ink, fontWeight: '700', marginBottom: 7 }}>Category</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 12 }}>
                  {categories.map((category) => <Text key={category} onPress={() => updateProduct('category')(category)} style={{ color: product.category === category ? colors.white : colors.navy, backgroundColor: product.category === category ? colors.blue : colors.canvas, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 }}>{category}</Text>)}
                  <Field label="" value={product.category} onChangeText={updateProduct('category')} placeholder="Or type a category" />
                </View>
                <Field label="Price (₹)" value={product.price} onChangeText={updateProduct('price')} placeholder="0" keyboardType="decimal-pad" />
                <Field label="Offer price (₹)" value={product.offerPrice} onChangeText={updateProduct('offerPrice')} placeholder="Leave blank to use the listed price" keyboardType="decimal-pad" />
                <Field label="Quantity in stock" value={product.stockQuantity} onChangeText={updateProduct('stockQuantity')} placeholder="1" keyboardType="number-pad" />
                <Field label="Description" value={product.description} onChangeText={updateProduct('description')} placeholder="Describe your item" multiline />
                <Pressable onPress={selectImages} style={{ padding: 15, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', borderRadius: 13, marginBottom: 12, alignItems: 'center' }}>
                  <Text style={{ color: colors.blue, fontWeight: '700' }}>{images.length ? `${images.length} photo(s) selected · Choose photos` : '＋  Add product photos'}</Text>
                </Pressable>
                {images.length ? <ScrollView horizontal style={{ marginBottom: 12 }}>{images.map((image) => <Image key={image.uri} source={{ uri: image.uri }} style={{ width: 75, height: 75, borderRadius: 10, marginRight: 8 }} />)}</ScrollView> : null}
                <Button title={busy ? 'Publishing…' : 'Publish listing'} disabled={busy} onPress={submitProduct} />
              </View>

              <View style={{ flexDirection: 'row', gap: 9, marginTop: 20, marginBottom: 10 }}>
                {['listings', 'orders'].map((view) => <Pressable key={view} onPress={() => setSellerView(view)} style={{ flex: 1, alignItems: 'center', padding: 11, borderRadius: 18, backgroundColor: sellerView === view ? colors.blue : colors.white }}>
                  <Text style={{ color: sellerView === view ? colors.white : colors.navy, fontWeight: '700' }}>{view === 'listings' ? `Listings (${myProducts.length})` : `Orders (${sellerOrders.length})`}</Text>
                </Pressable>)}
              </View>
              {sellerView === 'listings' ? myProducts.map((item) => <View key={item._id} style={{ padding: 13, backgroundColor: colors.white, borderRadius: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.navy, fontWeight: '700' }}>{item.name}</Text>
                  <Text style={{ color: colors.muted, marginTop: 4 }}>{item.stockQuantity} in stock · ₹{item.offerPrice}</Text>
                </View>
                <Pressable onPress={() => changeStock(item, item.stockQuantity ? 0 : 1)}><Text style={{ color: colors.blue, fontWeight: '700' }}>{item.stockQuantity ? 'Mark sold' : 'Restock'}</Text></Pressable>
              </View>) : sellerOrders.map((order) => <View key={order._id} style={{ backgroundColor: colors.white, padding: 13, borderRadius: 14, marginBottom: 8 }}>
                <Text style={{ color: colors.navy, fontWeight: '800' }}>{order.userId?.name || 'Buyer'} · {order.status}</Text>
                {(order.items || []).map((item) => <Text key={item._id || item.product?._id} style={{ color: colors.muted, marginTop: 4 }}>{item.product?.name || 'Listing'} × {item.quantity}</Text>)}
                <Text style={{ color: colors.muted, marginTop: 5 }}>{order.deliveryLocation || order.address?.street || 'Campus pickup'} · {order.deliveryTime || order.paymentType}</Text>
                {order.status !== 'Delivered' ? <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                  {['Processing', 'Shipped', 'Delivered'].filter((status) => status !== order.status).map((status) => <Text key={status} onPress={async () => {
                    try {
                      const { data } = await api.put(`/api/order/seller/status/${order._id}`, { status });
                      if (!data.success) throw new Error(data.message || 'Unable to update order');
                      await loadSeller();
                    } catch (error) {
                      Alert.alert('Order status', error.response?.data?.message || error.message);
                    }
                  }} style={{ color: colors.blue, paddingHorizontal: 9, paddingVertical: 7, backgroundColor: colors.paleBlue, borderRadius: 13, fontSize: 11, fontWeight: '700' }}>Mark {status}</Text>)}
                </View> : null}
              </View>)}

            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
