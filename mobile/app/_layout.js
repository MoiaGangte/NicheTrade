import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from '../context/AppContext';
import { MessagesProvider } from '../context/MessagesContext';
import { colors } from '../theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <MessagesProvider>
          <StatusBar style="dark" backgroundColor={colors.canvas} />
          <Stack screenOptions={{
            headerStyle: { backgroundColor: colors.white },
            headerTintColor: colors.navy,
            headerTitleStyle: { fontWeight: '700' },
            contentStyle: { backgroundColor: colors.canvas },
          }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="product/[id]" options={{ title: 'Product Details' }} />
            <Stack.Screen name="messages/[conversationId]" options={{ title: 'Messages', headerShown: false }} />
            <Stack.Screen name="orders" options={{ title: 'My orders' }} />
            <Stack.Screen name="profile" options={{ title: 'Profile' }} />
            <Stack.Screen name="auth" options={{ title: 'Your account', presentation: 'modal' }} />
            <Stack.Screen name="cart" options={{ title: 'Your cart', presentation: 'modal' }} />
            <Stack.Screen name="lost-found" options={{ title: 'Lost & Found' }} />
            <Stack.Screen name="requests" options={{ title: 'Item requests' }} />
            <Stack.Screen name="admin" options={{ title: 'Admin moderation' }} />
            <Stack.Screen name="favorites" options={{ title: 'Saved listings' }} />
            <Stack.Screen name="addresses" options={{ title: 'Saved addresses' }} />
            <Stack.Screen name="edit-profile" options={{ title: 'Edit profile' }} />
            <Stack.Screen name="donate" options={{ title: 'Support NicheTrade' }} />
            <Stack.Screen name="about-links" options={{ title: 'About NicheTrade' }} />
            <Stack.Screen name="about-info" options={{ title: 'NicheTrade' }} />
            <Stack.Screen name="lost-found-detail" options={{ title: 'Lost & Found Details' }} />
            <Stack.Screen name="request-item-detail" options={{ title: 'Request Details' }} />
          </Stack>
        </MessagesProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
}
