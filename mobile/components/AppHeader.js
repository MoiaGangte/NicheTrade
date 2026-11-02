import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { colors, shadow } from '../theme';

export default function AppHeader() {
  const { favorites, user } = useApp();
  const insets = useSafeAreaInsets();
  const favoriteCount = Object.values(favorites).filter(Boolean).length;

  return (
    <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 9, backgroundColor: colors.canvas }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Go to NicheTrade home" onPress={() => router.replace('/(tabs)')}>
          <Text style={{ color: colors.navy, fontSize: 25, fontWeight: '900', letterSpacing: -0.7 }}>
            Niche<Text style={{ color: colors.blue }}>Trade</Text>
          </Text>
          <Text style={{ color: colors.muted, fontSize: 11, marginTop: 1 }}>Buy · Sell · Earn · Connect</Text>
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Favorites, ${favoriteCount} listings`}
            onPress={() => router.push('/cart')}
            style={{ width: 44, height: 44, borderRadius: 15, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center', ...shadow }}
          >
            <Text style={{ color: favoriteCount ? colors.red : colors.navy, fontSize: 23 }}>♥</Text>
            {favoriteCount > 0 ? (
              <View style={{ position: 'absolute', top: -3, right: -3, minWidth: 18, height: 18, paddingHorizontal: 3, borderRadius: 9, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: colors.white, fontSize: 10, lineHeight: 12, fontWeight: '700' }}>{favoriteCount}</Text>
              </View>
            ) : null}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Profile"
            onPress={() => router.push(user ? '/profile' : '/auth')}
            style={{ paddingHorizontal: 12, height: 44, borderRadius: 15, backgroundColor: colors.white, justifyContent: 'center', ...shadow }}
          >
            <Text style={{ color: colors.blue, fontSize: 12, fontWeight: '700' }}>Profile</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
