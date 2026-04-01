import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, Image } from 'react-native';

import C_Navbar from '../components/utku/C_Navbar/C_Navbar';
import GeneralButton from '../components/utku/GeneralButton/GeneralButton';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getProductImage } from '../utils/imageMapper';

export default function Cart() {
  const router = useRouter();
  const { cartItems, totalPrice, updateQuantity, removeFromCart } = useCart();
  const { isAuthenticated } = useAuth();

  const handleCheckout = () => {
    if (!isAuthenticated) {
      router.push({ pathname: '/login', params: { returnTo: '/checkout' } });
    } else {
      router.push('/checkout');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBarContainer}> 
        <C_Navbar />
      </View>

      <View style={styles.screenTitleContainer}>
        <Text style={styles.screenTitle}>Shopping Cart</Text>
      </View>

      <View style={styles.content}>
        {cartItems.length === 0 ? (
          <View style={styles.emptyCart}>
            <Text style={styles.emptyIcon}>🛒</Text>
            <Text style={styles.emptyText}>Your cart is empty.</Text>
            <GeneralButton title="CONTINUE SHOPPING" onPress={() => router.push('/caravans')} />
          </View>
        ) : (
          <View style={styles.cartLayout}>
            {/* List */}
            <View style={styles.itemsList}>
              <View style={styles.listHeader}>
                <Text style={[styles.headerCell, { flex: 3 }]}>Product</Text>
                <Text style={[styles.headerCell, { flex: 1, textAlign: 'center' }]}>Price</Text>
                <Text style={[styles.headerCell, { flex: 1, textAlign: 'center' }]}>Quantity</Text>
                <Text style={[styles.headerCell, { flex: 1, textAlign: 'right' }]}>Total</Text>
              </View>

              <ScrollView>
                {cartItems.map((item) => (
                  <View key={item.product.product_id} style={styles.cartRow}>
                    <View style={[styles.cell, { flex: 3, flexDirection: 'row', alignItems: 'center', gap: 15 }]}>
                      <View style={styles.thumb}>
                        <Image source={getProductImage(item.product.image_url)} style={{ width: '100%', height: '100%', borderRadius: 8 }} resizeMode="cover" />
                      </View>
                      <View style={{ flex: 1, paddingRight: 10 }}>
                        <Text style={styles.itemName} numberOfLines={2}>{item.product.name}</Text>
                        <Pressable onPress={() => removeFromCart(item.product.product_id)}>
                          <Text style={styles.removeBtn}>Remove</Text>
                        </Pressable>
                      </View>
                    </View>
                    
                    <View style={[styles.cell, { flex: 1 }]}>
                      <Text style={styles.cellTextCenter}>${item.product.current_price.toLocaleString()}</Text>
                    </View>
                    
                    <View style={[styles.cell, { flex: 1, alignItems: 'center' }]}>
                      <View style={styles.qtyControl}>
                        <Pressable onPress={() => updateQuantity(item.product.product_id, item.quantity - 1)} style={styles.qtyBtn}><Text>-</Text></Pressable>
                        <Text style={styles.qtyText}>{item.quantity}</Text>
                        <Pressable onPress={() => updateQuantity(item.product.product_id, item.quantity + 1)} style={styles.qtyBtn}><Text>+</Text></Pressable>
                      </View>
                    </View>

                    <View style={[styles.cell, { flex: 1 }]}>
                      <Text style={styles.cellTextRight}>${(item.product.current_price * item.quantity).toLocaleString()}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* Summary */}
            <View style={styles.summaryBox}>
              <Text style={styles.summaryTitle}>Order Summary</Text>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>${totalPrice.toLocaleString()}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Shipping</Text>
                <Text style={styles.summaryValue}>Calculated next step</Text>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryTotalLabel}>Total</Text>
                <Text style={styles.summaryTotalValue}>${totalPrice.toLocaleString()}</Text>
              </View>

              <Pressable style={styles.checkoutBtn} onPress={handleCheckout}>
                <Text style={styles.checkoutText}>PROCEED TO CHECKOUT</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  headerBarContainer: { paddingHorizontal: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  screenTitleContainer: { paddingHorizontal: 40, paddingVertical: 30 },
  screenTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 32, color: '#222' },
  content: { flex: 1, paddingHorizontal: 40, paddingBottom: 40 },
  emptyCart: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 80, marginBottom: 20 },
  emptyText: { fontFamily: 'Montserrat_400Regular', fontSize: 20, color: '#666', marginBottom: 30 },
  cartLayout: { flexDirection: 'row', gap: 40, height: '100%' },
  itemsList: { flex: 2, backgroundColor: '#fff', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#eee' },
  listHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 15, marginBottom: 15 },
  headerCell: { fontFamily: 'Montserrat_600SemiBold', fontSize: 13, color: '#888', textTransform: 'uppercase' },
  cartRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  cell: { justifyContent: 'center' },
  thumb: { width: 80, height: 80, backgroundColor: '#EAEAEA', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  itemName: { fontFamily: 'Montserrat_600SemiBold', fontSize: 16, color: '#222', marginBottom: 8 },
  removeBtn: { fontFamily: 'Montserrat_400Regular', fontSize: 12, color: '#E74C3C' },
  cellTextCenter: { fontFamily: 'Montserrat_600SemiBold', fontSize: 16, color: '#222', textAlign: 'center' },
  cellTextRight: { fontFamily: 'Montserrat_700Bold', fontSize: 16, color: '#222', textAlign: 'right' },
  qtyControl: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 6 },
  qtyBtn: { paddingHorizontal: 15, paddingVertical: 8 },
  qtyText: { fontFamily: 'Montserrat_600SemiBold', fontSize: 14, width: 25, textAlign: 'center' },
  summaryBox: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 30, borderWidth: 1, borderColor: '#eee', maxHeight: 350 },
  summaryTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 20, color: '#222', marginBottom: 30 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  summaryLabel: { fontFamily: 'Montserrat_400Regular', fontSize: 15, color: '#666' },
  summaryValue: { fontFamily: 'Montserrat_600SemiBold', fontSize: 15, color: '#222' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 20 },
  summaryTotalLabel: { fontFamily: 'Montserrat_700Bold', fontSize: 18, color: '#222' },
  summaryTotalValue: { fontFamily: 'Montserrat_700Bold', fontSize: 24, color: '#D35400' },
  checkoutBtn: { backgroundColor: '#5A7D71', paddingVertical: 18, borderRadius: 8, marginTop: 30, alignItems: 'center' },
  checkoutText: { fontFamily: 'Montserrat_700Bold', color: '#fff', fontSize: 14, letterSpacing: 1 }
});
