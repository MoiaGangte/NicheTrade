import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../context/AppContext';
import { Button, EmptyState, Screen } from '../components/UI';
import { colors, shadow } from '../theme';

export default function ProfileScreen() {
  const { api, user, seller, signOut } = useApp();
  const [orderCount, setOrderCount] = useState(null);
  const [signingOut, setSigningOut] = useState(false);
  const [adminEligible, setAdminEligible] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.get('/api/order/user').then(({ data }) => {
      if (data.success) setOrderCount((data.orders || []).length);
    }).catch(() => setOrderCount(null));
  }, [api, user]);

  useEffect(() => {
    let active = true;
    setAdminEligible(false);
    if (!user) return () => { active = false; };

    api.get('/api/user/admin-access')
      .then(({ data }) => {
        if (active) setAdminEligible(Boolean(data.success && data.eligible));
      })
      .catch((error) => {
        console.warn('Admin access eligibility check failed:', error.response?.data?.message || error.message);
      });

    return () => { active = false; };
  }, [api, user]);

  const completeSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      router.replace('/(tabs)');
    } catch (error) {
      const message = error.message || 'Please try again.';
      if (Platform.OS === 'web') globalThis.alert(`Unable to sign out: ${message}`);
      else Alert.alert('Unable to sign out', message);
    } finally {
      setSigningOut(false);
    }
  };

  const logout = () => {
    if (Platform.OS === 'web') {
      if (globalThis.confirm('Sign out of your NicheTrade account?')) {
        completeSignOut();
      }
      return;
    }

    Alert.alert('Sign out', 'Sign out of your NicheTrade account?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: completeSignOut },
    ]);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 18, paddingTop: 22, paddingBottom: 28 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Return to home"
          onPress={() => router.replace('/(tabs)')}
          style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingRight: 12, marginBottom: 10 }}
        >
          <Text style={{ color: colors.blue, fontSize: 20, fontWeight: '800', marginRight: 7 }}>←</Text>
          <Text style={{ color: colors.blue, fontWeight: '700' }}>Home</Text>
        </Pressable>
        <Text style={{ color: colors.navy, fontSize: 24, fontWeight: '800', marginBottom: 16 }}>Profile</Text>
        {user ? (
          <>
            <View style={{ backgroundColor: colors.white, borderRadius: 18, padding: 18, ...shadow }}>
              <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: colors.paleBlue, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: colors.blue, fontSize: 23, fontWeight: '800' }}>{user.name?.[0]?.toUpperCase() || 'N'}</Text>
              </View>
              <Text style={{ color: colors.navy, fontWeight: '800', fontSize: 19, marginTop: 12 }}>{user.name}</Text>
              <Text style={{ color: colors.muted, marginTop: 3 }}>{user.email}</Text>
              {[user.department, user.studentType, user.mobileNumber].filter(Boolean).map((detail) => <Text key={detail} style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>{detail}</Text>)}
            </View>
            {user.role === 'seller' ? (
              <View style={{ marginTop: 13, padding: 14, backgroundColor: colors.white, borderRadius: 15, borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ color: colors.navy, fontWeight: '800' }}>Seller account {seller?.isApproved ? '✓' : '· Pending approval'}</Text>
                {seller?.storeName ? <Text style={{ color: colors.muted, marginTop: 4 }}>{seller.storeName}</Text> : null}
              </View>
            ) : null}
            <View style={{ marginTop: 15, backgroundColor: colors.white, borderRadius: 17, overflow: 'hidden', ...shadow }}>
              <MenuRow title="Edit student profile" detail="Update your account information" onPress={() => router.push('/edit-profile')} />
              <MenuRow title="Saved listings" detail="Your favorite products" onPress={() => router.push('/favorites')} />
              <MenuRow title="Saved addresses" detail="Manage delivery addresses" onPress={() => router.push('/addresses')} />
              <MenuRow title="My listings" detail="Manage your products" onPress={() => router.push('/(tabs)/sell')} />
              <MenuRow title="My orders" detail={orderCount === null ? 'View your purchases' : `${orderCount} orders`} onPress={() => router.push('/orders')} />
              <MenuRow title="Lost & Found" detail="Campus lost items" onPress={() => router.push('/lost-found')} />
              <MenuRow title="Item requests" detail="Requests from students" onPress={() => router.push('/requests')} last />
            </View>
            <Button title={signingOut ? 'Signing out…' : 'Sign out'} secondary disabled={signingOut} onPress={logout} style={{ marginTop: 17 }} />
          </>
        ) : (
          <>
            <EmptyState title="Your campus account" detail="Sign in to manage your listings, saved items, orders, and profile." />
            <Button title="Login or create an account" onPress={() => router.push('/auth')} />
            <View style={{ height: 17 }} />
          </>
        )}
        <Button title="Support NicheTrade" secondary onPress={() => router.push('/donate')} style={{ marginTop: 13 }} />
        {adminEligible ? <Button title="Admin moderation" secondary onPress={() => router.push('/admin')} style={{ marginTop: 13 }} /> : null}
      </ScrollView>
    </Screen>
  );
}

function MenuRow({ title, detail, onPress, last }) {
  return (
    <Text onPress={onPress} style={{ paddingHorizontal: 15, paddingVertical: 15, color: colors.navy, fontWeight: '700', borderBottomColor: last ? 'transparent' : colors.border, borderBottomWidth: 1 }}>
      {title}  <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '400' }}>· {detail}</Text>  <Text style={{ color: colors.blue }}>›</Text>
    </Text>
  );
}
