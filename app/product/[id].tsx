import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Image, ActivityIndicator, ScrollView, Pressable } from 'react-native';

import C_Navbar from '../../components/utku/C_Navbar/C_Navbar';
import GeneralButton from '../../components/utku/GeneralButton/GeneralButton';
import Toast from '../../components/utku/Toast/Toast';
import { useCart } from '../../context/CartContext';
import { api, Product, Category } from '../../services/api';
import { getProductImage } from '../../utils/imageMapper';

export default function ProductDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { addToCart, getCartItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          api.getProduct(Number(id)),
          api.getCategories()
        ]);
        setProduct(prodRes.product);
        const cat = catRes.categories.find((c: Category) => c.category_id === prodRes.product.category_id);
        if (cat) setCategoryName(cat.name);
      } catch (err: any) {
        setToastMsg(err.message || "Failed to load product");
        setToastVisible(true);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
  };

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, quantity);
    showToast(`Added ${quantity} ${product.name} to cart`);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#5A7D71" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Product not found.</Text>
        <GeneralButton title="BACK TO CARAVANS" onPress={() => router.push('/caravans')} />
      </View>
    );
  }

  const inCart = getCartItem(product.product_id)?.quantity || 0;
  const isOutOfStock = product.quantity_in_stocks <= 0;
  const availableToadd = product.quantity_in_stocks - inCart;
  const canAdd = !isOutOfStock && availableToadd > 0;

  return (
    <View style={styles.container}>
      <Toast message={toastMsg} visible={toastVisible} onHide={() => setToastVisible(false)} />
      
      <View style={styles.headerBarContainer}> 
        <C_Navbar />
      </View>

      <ScrollView style={styles.scrollArea}>
        <View style={styles.content}>
          <Pressable onPress={() => router.push('/caravans')} style={styles.backButton}>
            <Text style={styles.backText}>← Back to products</Text>
          </Pressable>

          <View style={styles.productLayout}>
            {/* Image Column */}
            <View style={styles.imageColumn}>
              <View style={styles.imageWrapper}>
                <Image source={getProductImage(product.image_url)} style={{ width: '100%', height: '100%', borderRadius: 16 }} resizeMode="cover" />
              </View>
            </View>

            {/* Details Column */}
            <View style={styles.detailsColumn}>
              <Text style={styles.categoryBadge}>{categoryName || 'Accessory'}</Text>
              <Text style={styles.title}>{product.name}</Text>
              
              <View style={styles.priceRow}>
                <Text style={styles.price}>${product.current_price.toLocaleString()}</Text>
                {product.base_price > product.current_price && (
                  <Text style={styles.oldPrice}>${product.base_price.toLocaleString()}</Text>
                )}
              </View>

              <Text style={styles.paragraph}>{product.description}</Text>

              {/* Specs Grid */}
              <View style={styles.specsGrid}>
                {product.berth_count > 0 && <SpecBox label="Capacity" value={`${product.berth_count} Person`} />}
                {product.fuel_type !== 'N/A' && <SpecBox label="Fuel" value={product.fuel_type} />}
                <SpecBox label="Weight" value={`${product.weight_kg} kg`} />
                <SpecBox label="Warranty" value={product.warranty_status} />
              </View>

              <View style={styles.divider} />

              {/* Add to Cart Section */}
              <View style={styles.actionSection}>
                <Text style={[styles.stockStatus, isOutOfStock ? styles.outOfStock : styles.inStock]}>
                  {isOutOfStock ? "Out of Stock" : `${product.quantity_in_stocks} items left in stock`}
                </Text>

                <View style={styles.addToCartRow}>
                  <View style={styles.qtyControl}>
                    <Pressable 
                      style={styles.qtyBtn} 
                      onPress={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <Text style={styles.qtyText}>-</Text>
                    </Pressable>
                    <Text style={styles.qtyValue}>{quantity}</Text>
                    <Pressable 
                      style={styles.qtyBtn} 
                      onPress={() => setQuantity(Math.min(availableToadd, quantity + 1))}
                    >
                      <Text style={styles.qtyText}>+</Text>
                    </Pressable>
                  </View>

                  <Pressable 
                    style={[styles.mainBtn, !canAdd && styles.mainBtnDisabled]} 
                    onPress={handleAddToCart}
                    disabled={!canAdd}
                  >
                    <Text style={styles.mainBtnText}>
                      {isOutOfStock ? "UNAVAILABLE" : "ADD TO CART"}
                    </Text>
                  </Pressable>
                </View>
              </View>

            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function SpecBox({ label, value }: { label: string, value: string }) {
  return (
    <View style={styles.specBox}>
      <Text style={styles.specLabel}>{label}</Text>
      <Text style={styles.specValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF9F6',
  },
  headerBarContainer: {
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  scrollArea: {
    flex: 1,
  },
  content: {
    padding: 40,
    maxWidth: 1200,
    marginHorizontal: 'auto',
    width: '100%',
  },
  backButton: {
    marginBottom: 20,
  },
  backText: {
    fontFamily: 'Montserrat_600SemiBold',
    color: '#5A7D71',
  },
  productLayout: {
    flexDirection: 'row',
    gap: 60,
  },
  imageColumn: {
    flex: 1,
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#EAEAEA',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiPlaceholder: {
    fontSize: 100,
  },
  detailsColumn: {
    flex: 1,
  },
  categoryBadge: {
    fontFamily: 'Montserrat_600SemiBold',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontSize: 12,
    marginBottom: 10,
  },
  title: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 40,
    color: '#222',
    marginBottom: 20,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 15,
    marginBottom: 30,
  },
  price: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 32,
    color: '#D35400',
  },
  oldPrice: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 20,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  paragraph: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 16,
    lineHeight: 26,
    color: '#444',
    marginBottom: 40,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginBottom: 40,
  },
  specBox: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    minWidth: 120,
  },
  specLabel: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  specValue: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 16,
    color: '#222',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginBottom: 30,
  },
  actionSection: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  stockStatus: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 14,
    marginBottom: 20,
  },
  inStock: {
    color: '#27AE60',
  },
  outOfStock: {
    color: '#E74C3C',
  },
  addToCartRow: {
    flexDirection: 'row',
    gap: 20,
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  qtyBtn: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  qtyText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 20,
  },
  qtyValue: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 18,
    width: 30,
    textAlign: 'center',
  },
  mainBtn: {
    flex: 1,
    backgroundColor: '#5A7D71',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  mainBtnDisabled: {
    backgroundColor: '#aaa',
  },
  mainBtnText: {
    fontFamily: 'Montserrat_700Bold',
    color: '#fff',
    letterSpacing: 1,
  },
  errorText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 24,
    color: '#333',
    marginBottom: 20,
  }
});
