import { Tabs } from 'expo-router';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../../theme';
import { useMessages } from '../../context/MessagesContext';
import { shadow } from '../../theme';
import { useCameraFlow } from '../../context/CameraFlowContext';
import AppHeader from '../../components/AppHeader';

const tabIcons = { index: '⌂', explore: '⌕', 'lost-found': '⌕', sell: '+', messages: '✉', requests: 'ⓘ' };

export default function TabLayout() {
  const { unreadCount } = useMessages();
  const { openCameraMenu } = useCameraFlow();
  const CameraTabButton = () => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open camera actions"
      onPress={openCameraMenu}
      style={{
        marginLeft: -10,
        width: 78,
        height: 62,
        borderRadius: 31,
        marginTop: -28,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.blue,
        borderWidth: 4,
        borderColor: colors.white,
        ...shadow,
      }}
    >
      <View style={{ width: 30, height: 23, borderRadius: 5, borderWidth: 2, borderColor: colors.white, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ position: 'absolute', left: 4, top: -5, width: 8, height: 6, borderRadius: 2, borderWidth: 2, borderBottomWidth: 0, borderColor: colors.white }} />
        <View style={{ width: 9, height: 9, borderRadius: 5, borderWidth: 2, borderColor: colors.white }} />
      </View>
    </Pressable>
  );
  const AboutTabButton = () => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="About NicheTrade"
      onPress={() => router.push('/about-links')}
      style={{ flex: 1, height: 58, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={{ color: colors.muted, fontSize: 21, fontWeight: '700' }}>ⓘ</Text>
      <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '600', marginTop: 1 }}>About</Text>
    </Pressable>
  );
  return (
    <View style={{ flex: 1 }}>
      <AppHeader />
      <View style={{ flex: 1 }}>
    <Tabs screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: colors.blue,
      tabBarInactiveTintColor: colors.muted,
      tabBarStyle: {
        height: 63,
        paddingTop: 5,
        paddingBottom: 7,
        borderTopColor: colors.border,
        backgroundColor: colors.white,
        position: 'relative',
      },
      tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      tabBarItemStyle: { flex: 1 },
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
      <Tabs.Screen name="messages" options={{ title: 'Messages' }} />
      <Tabs.Screen name="camera-action" options={{ title: '', tabBarLabel: () => null, tabBarButton: CameraTabButton }} />
      <Tabs.Screen name="sell" options={{ title: 'Sell' }} />
      <Tabs.Screen name="requests" options={{ title: 'About', tabBarLabel: () => null, tabBarButton: AboutTabButton }} />
    </Tabs>
      </View>
    </View>
  );
}
