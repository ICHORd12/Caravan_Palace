import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';

import C_CaravanCard from '../components/utku/C_CaravanCard/C_CaravanCard';
import C_Navbar from '../components/utku/C_Navbar/C_Navbar';
import SearchBar from '../components/utku/SearchBar/SearchBar';
import SortDropdown from '../components/utku/SortDropdown/SortDropdown';
import Toast from '../components/utku/Toast/Toast';
import { useCart } from '../context/CartContext';
import { api, Category, Product } from '../services/api';
import { getProductImage } from '../utils/imageMapper';

export default function Caravans() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { addToCart } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [sortValue, setSortValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(
    params.category_id ? Number(params.category_id) : null
  );

  // Toast
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, prodRes] = await Promise.all([
        api.getCategories(),
        api.getProducts({
          search,
          sort: sortValue ? sortValue.split('_')[0] : undefined,
          order: sortValue ? sortValue.split('_')[1] : undefined,
          category_id: selectedCategory || undefined,
        }),
      ]);
      setCategories(catRes.categories);
      setProducts(prodRes.products);
    } catch (err) {
      console.error(err);
      showToast('Error loading products');
    } finally {
      setLoading(false);
    }
  }, [search, sortValue, selectedCategory]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
    showToast(`Added ${product.name} to cart`);
  };

  return (
    <View style={styles.container}>
      <Toast message={toastMessage} visible={toastVisible} onHide={() => setToastVisible(false)} />
      
      {/* HEADER */}
      <View style={styles.headerBarContainer}> 
        <C_Navbar />
      </View>

      <View style={styles.screenTitleContainer}>
        <Text style={styles.screenTitle}>Our Collection</Text>
      </View>

      {/* CONTENT CONTAINER */}
      <View style={styles.contentContainer}>
        
        {/* FILTER AREA (Left Side) */}
        <View style={styles.filterContainer}>
          <Text style={styles.filterTitle}>Search</Text>
          <SearchBar onSearch={setSearch} />

          <Text style={[styles.filterTitle, { marginTop: 30 }]}>Sort By</Text>
          <SortDropdown value={sortValue} onChange={setSortValue} />

          <Text style={[styles.filterTitle, { marginTop: 30 }]}>Categories</Text>
          <View style={styles.categoryList}>
            <Pressable 
              style={[styles.categoryItem, selectedCategory === null && styles.categoryItemActive]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={[styles.categoryText, selectedCategory === null && styles.categoryTextActive]}>
                All Products
              </Text>
            </Pressable>
            {categories.map(cat => (
              <Pressable 
                key={cat.category_id}
                style={[styles.categoryItem, selectedCategory === cat.category_id && styles.categoryItemActive]}
                onPress={() => setSelectedCategory(cat.category_id)}
              >
                <Text style={[styles.categoryText, selectedCategory === cat.category_id && styles.categoryTextActive]}>
                  {cat.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* CARAVAN CARDS GRID (Right Side) */}
        <View style={styles.gridWrapper}>
          {loading ? (
            <ActivityIndicator size="large" color="#5A7D71" style={{ marginTop: 100 }} />
          ) : (
            <ScrollView 
              style={styles.scrollArea}
              contentContainerStyle={styles.cardsGrid}
              showsVerticalScrollIndicator={false}
            >
              {products.length === 0 ? (
                <Text style={styles.noResults}>No products found.</Text>
              ) : (
                products.map((item) => (
                  <C_CaravanCard 
                    key={item.product_id}
                    name={item.name}
                    type={categories.find(c => c.category_id === item.category_id)?.name || "Accessory"}
                    score={(item.popularity / 20).toFixed(1)} 
                    price={`$${item.current_price.toLocaleString()}`}
                    stock={item.quantity_in_stocks}
                    caravanImages={[getProductImage(item.image_url)]}
                    onAddToCart={() => handleAddToCart(item)}
                    onPress={() => router.push(`/product/${item.product_id}`)}
                  />
                ))
              )}
            </ScrollView>
          )}
        </View>
        
      </View>
    </View> 
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  headerBarContainer: {
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  screenTitleContainer: {
    paddingHorizontal: 40,
    paddingVertical: 30,
  },
  screenTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 32,
    color: '#222',
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 40,
    paddingBottom: 20,
    gap: 40,
  },
  filterContainer: {
    width: 280,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    maxHeight: 600,
  },
  filterTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
  },
  categoryList: {
    gap: 8,
  },
  categoryItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  categoryItemActive: {
    backgroundColor: '#E8F5E9',
  },
  categoryText: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 14,
    color: '#666',
  },
  categoryTextActive: {
    fontFamily: 'Montserrat_600SemiBold',
    color: '#2E7D32',
  },
  gridWrapper: {
    flex: 1,
  },
  scrollArea: {
    flex: 1,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 30,
    justifyContent: 'flex-start',
    paddingBottom: 40,
  },
  noResults: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 18,
    color: '#888',
    marginTop: 40,
  }
});