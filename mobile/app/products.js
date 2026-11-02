import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useApp } from '../context/AppContext';
import { EmptyState, ProductCard, Screen } from '../components/UI';
import { colors } from '../theme';

export default function ProductsScreen() {
  const { products, categories, favorites, toggleFavorite, refreshProducts } = useApp();
  const params = useLocalSearchParams();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(useCallback(() => {
    setActiveCategory(
      typeof params.category === 'string' && !params.all ? params.category : '',
    );
  }, [params.category, params.all]));

  const loadProducts = useCallback(async () => {
    try {
      await refreshProducts();
    } finally {
      setRefreshing(false);
    }
  }, [refreshProducts]);

  useFocusEffect(useCallback(() => {
    loadProducts();
  }, [loadProducts]));

  const filteredProducts = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    return products.filter((product) => {
      const productCategories = product.categories?.length ? product.categories : [product.category];
      const matchesCategory = !activeCategory || productCategories.some(
        (category) => category?.toLocaleLowerCase() === activeCategory.toLocaleLowerCase(),
      );
      const matchesSearch = !search || [
        product.name,
        product.category,
        ...(product.categories || []),
        ...(Array.isArray(product.description) ? product.description : [product.description]),
      ].join(' ').toLocaleLowerCase().includes(search);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, products, query]);

  return (
    <Screen>
      <FlatList
        data={filteredProducts}
        numColumns={2}
        keyExtractor={(product) => product._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadProducts(); }} />}
        contentContainerStyle={{ paddingHorizontal: 13, paddingBottom: 28 }}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        ListHeaderComponent={(
          <View style={{ paddingHorizontal: 5, paddingTop: 17, paddingBottom: 8 }}>
            <Text style={{ color: colors.navy, fontSize: 25, fontWeight: '800' }}>All Products</Text>
            <Text style={{ color: colors.muted, marginTop: 4 }}>Browse every marketplace listing.</Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search products..."
              placeholderTextColor={colors.muted}
              accessibilityLabel="Search all products"
              style={{ height: 46, marginTop: 14, borderRadius: 24, paddingHorizontal: 16, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, color: colors.ink }}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 12, gap: 8 }}>
              {['', ...categories].map((category) => {
                const selected = activeCategory === category;
                return (
                  <Pressable
                    key={category || 'all'}
                    accessibilityRole="button"
                    accessibilityLabel={category ? `Filter by ${category}` : 'Show all categories'}
                    onPress={() => setActiveCategory(category)}
                    style={{ paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, backgroundColor: selected ? colors.blue : colors.white, borderWidth: 1, borderColor: selected ? colors.blue : colors.border }}
                  >
                    <Text style={{ color: selected ? colors.white : colors.navy, fontSize: 12, fontWeight: '600' }}>{category || 'All'}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2, marginBottom: 3 }}>
              {activeCategory ? `${activeCategory} · ` : ''}{filteredProducts.length} listings
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={{ width: '50%' }}>
            <ProductCard
              product={item}
              onPress={() => router.push(`/product/${item._id}`)}
              onFavorite={() => toggleFavorite(item._id)}
              favorite={Boolean(favorites[item._id])}
              onAdd={() => toggleFavorite(item._id)}
            />
          </View>
        )}
        ListEmptyComponent={(
          <EmptyState
            title={refreshing ? 'Loading products…' : 'No products found'}
            detail="Try another search or category."
          />
        )}
      />
    </Screen>
  );
}
