import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { colors } from '../../theme';
import { useMessages } from '../../context/MessagesContext';

const tabIcons = { index: '⌂', explore: '⌕', 'lost-found': '⌕', sell: '+', messages: '✉', requests: '◇' };

export default function TabLayout() {
  const { unreadCount } = useMessages();
  return (
    <Tabs screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: colors.blue,
      tabBarInactiveTintColor: colors.muted,
      tabBarStyle: { height: 63, paddingTop: 5, paddingBottom: 7, borderTopColor: colors.border, backgroundColor: colors.white },
      tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      tabBarIcon: ({ color }) => (
        <View>
          <Text style={{ color, fontSize: route.name === 'sell' ? 31 : 23, fontWeight: '700' }}>{tabIcons[route.name]}</Text>
          {route.name === 'messages' && unreadCount > 0 ? (
            <View style={{ position: 'absolute', top: -3, right: -10, minWidth: 15, height: 15, paddingHorizontal: 3, borderRadius: 8, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: colors.white, fontSize: 9, fontWeight: '800' }}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          ) : null}
        </View>
      ),
    })}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
      <Tabs.Screen name="lost-found" options={{ title: 'Lost & Found' }} />
      <Tabs.Screen name="messages" options={{ title: 'Messages' }} />
      <Tabs.Screen name="sell" options={{ title: 'Sell' }} />
      <Tabs.Screen name="requests" options={{ title: 'Request Item' }} />
    </Tabs>
  );
}
