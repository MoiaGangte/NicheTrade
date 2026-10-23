import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '../../theme';

const tabIcons = { index: '⌂', explore: '⌕', 'lost-found': '⌕', sell: '+', orders: '▤', requests: '◇', profile: '♙' };

export default function TabLayout() {
  return (
    <Tabs screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: colors.blue,
      tabBarInactiveTintColor: colors.muted,
      tabBarStyle: { height: 63, paddingTop: 5, paddingBottom: 7, borderTopColor: colors.border, backgroundColor: colors.white },
      tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      tabBarIcon: ({ color }) => <Text style={{ color, fontSize: route.name === 'sell' ? 31 : 23, fontWeight: '700' }}>{tabIcons[route.name]}</Text>,
    })}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
      <Tabs.Screen name="lost-found" options={{ title: 'Lost & Found' }} />
      <Tabs.Screen name="sell" options={{ title: 'Sell' }} />
      <Tabs.Screen name="orders" options={{ href: null }} />
      <Tabs.Screen name="requests" options={{ title: 'Request Item' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
