import { useMemo } from 'react';
import { FlatList, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../context/AppContext';
import { EmptyState, ProductCard, Screen } from '../components/UI';
import { colors } from '../theme';

export default function FavoritesScreen() {
  const { products, favorites, toggleFavorite, addToCart } = useApp();
  const saved = useMemo(() => products.filter((product) => favorites[product._id]), [products, favorites]);
  return (
    <Screen>
      <FlatList
        data={saved}
        numColumns={2}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 9, paddingBottom: 20, flexGrow: 1 }}
        renderItem={({ item }) => <View style={{ width: '50%' }}><ProductCard
          product={item}
          favorite
          onPress={() => router.push(`/product/${item._id}`)}
          onFavorite={() => toggleFavorite(item._id)}
          onAdd={() => addToCart(item._id)}
        /></View>}
        ListEmptyComponent={<EmptyState title="No saved listings yet" detail="Tap the heart on a listing to save it to your account." />}
      />
    </Screen>
  );
}
