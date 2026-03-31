import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View, ScrollView, ActivityIndicator, Pressable } from 'react-native';

import C_Navbar from '../components/utku/C_Navbar/C_Navbar';
import Toast from '../components/utku/Toast/Toast';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useOrders } from '../context/OrderContext';
import { api } from '../services/api';

export default function Checkout() {
  const router = useRouter();
  const { cartItems, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const { placeOrder } = useOrders();

  const [address, setAddress] = useState('');
  const [card, setCard] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  // If visiting directly without items
  if (cartItems.length === 0 && !loading) {
    router.replace('/cart');
    return null;
  }

  const handlePaymentAndOrder = async () => {
    if (!address) return showToast("Please enter a shipping address");
    if (!card || !expiry || !cvv) return showToast("Please complete payment details");

    setLoading(true);
    try {
      // 1. Process payment (mock bank)
      await api.processPayment({ card_number: card, expiry, cvv, amount: totalPrice });

      // 2. Create order & decrement stock logically via API
      const itemsPayload = cartItems.map(item => ({
        product_id: item.product.product_id,
        quantity: item.quantity
      }));
      
      const order = await placeOrder(itemsPayload, address);

      // 3. Clear cart
      clearCart();

      // 4. Navigate to invoice
      router.replace(`/invoice/${order.order_id}`);

    } catch (err: any) {
      showToast(err.message || "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
  };

  return (
    <View style={styles.container}>
      <Toast type="error" message={toastMsg} visible={toastVisible} onHide={() => setToastVisible(false)} />
      
      <View style={styles.headerBarContainer}> 
        <C_Navbar />
      </View>

      <ScrollView style={styles.scrollArea}>
        <View style={styles.content}>
          <Text style={styles.screenTitle}>Checkout</Text>

          <View style={styles.layout}>
            {/* Left: Forms */}
            <View style={styles.formCol}>
              
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>1. Shipping Details</Text>
                <Text style={styles.label}>Full Name</Text>
                <TextInput style={styles.input} value={user?.name} editable={false} />
                <Text style={styles.label}>Email</Text>
                <TextInput style={styles.input} value={user?.email} editable={false} />
                <Text style={styles.label}>Shipping Address *</Text>
                <TextInput 
                  style={[styles.input, { height: 80, textAlignVertical: 'top' }]} 
                  multiline 
                  value={address} 
                  onChangeText={setAddress} 
                  placeholder="Enter full delivery address"
                />
              </View>

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>2. Payment Method</Text>
                <View style={styles.paymentBox}>
                  <Text style={styles.label}>Card Number *</Text>
                  <TextInput 
                    style={styles.input} 
                    value={card} 
                    onChangeText={setCard} 
                    placeholder="0000 0000 0000 0000" 
                    maxLength={19}
                  />
                  
                  <View style={styles.row}>
                    <View style={styles.half}>
                      <Text style={styles.label}>Expiry (MM/YY) *</Text>
                      <TextInput style={styles.input} value={expiry} onChangeText={setExpiry} placeholder="12/26" maxLength={5} />
                    </View>
                    <View style={styles.half}>
                      <Text style={styles.label}>CVV *</Text>
                      <TextInput style={styles.input} value={cvv} onChangeText={setCvv} placeholder="123" maxLength={4} secureTextEntry />
                    </View>
                  </View>
                </View>
              </View>

            </View>

            {/* Right: Order Summary */}
            <View style={styles.summaryCol}>
              <View style={styles.summaryCard}>
                <Text style={styles.sectionTitle}>Order Summary</Text>
                
                <ScrollView style={{ maxHeight: 300, marginBottom: 20 }}>
                  {cartItems.map(item => (
                    <View key={item.product.product_id} style={styles.summaryItemRow}>
                      <Text style={styles.itemName} numberOfLines={1}>{item.quantity}x {item.product.name}</Text>
                      <Text style={styles.itemPrice}>${(item.product.current_price * item.quantity).toLocaleString()}</Text>
                    </View>
                  ))}
                </ScrollView>

                <View style={styles.divider} />
                
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Due</Text>
                  <Text style={styles.totalValue}>${totalPrice.toLocaleString()}</Text>
                </View>

                <Pressable 
                  style={[styles.payBtn, loading && styles.payBtnDisabled]} 
                  onPress={handlePaymentAndOrder}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.payBtnText}>PAY & PLACE ORDER</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  headerBarContainer: { paddingHorizontal: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  scrollArea: { flex: 1 },
  content: { padding: 40, maxWidth: 1200, marginHorizontal: 'auto', width: '100%' },
  screenTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 32, color: '#222', marginBottom: 40 },
  layout: { flexDirection: 'row', gap: 40 },
  formCol: { flex: 2, gap: 30 },
  summaryCol: { flex: 1 },
  card: { backgroundColor: '#fff', padding: 30, borderRadius: 12, borderWidth: 1, borderColor: '#eee' },
  sectionTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 20, color: '#222', marginBottom: 25 },
  label: { fontFamily: 'Montserrat_600SemiBold', fontSize: 13, color: '#555', marginBottom: 8 },
  input: { fontFamily: 'Montserrat_400Regular', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 20, fontSize: 15, outlineStyle: 'none' },
  paymentBox: { backgroundColor: '#f9f9f9', padding: 20, borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
  row: { flexDirection: 'row', gap: 20 },
  half: { flex: 1 },
  summaryCard: { backgroundColor: '#fff', padding: 30, borderRadius: 12, borderWidth: 1, borderColor: '#eee', top: 0, position: 'sticky' as any },
  summaryItemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  itemName: { fontFamily: 'Montserrat_400Regular', flex: 1, fontSize: 15, color: '#444' },
  itemPrice: { fontFamily: 'Montserrat_600SemiBold', fontSize: 15, color: '#222', marginLeft: 10 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 20 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  totalLabel: { fontFamily: 'Montserrat_700Bold', fontSize: 18, color: '#222' },
  totalValue: { fontFamily: 'Montserrat_700Bold', fontSize: 24, color: '#D35400' },
  payBtn: { backgroundColor: '#5A7D71', paddingVertical: 18, borderRadius: 8, alignItems: 'center' },
  payBtnDisabled: { backgroundColor: '#999' },
  payBtnText: { fontFamily: 'Montserrat_700Bold', color: '#fff', fontSize: 15, letterSpacing: 1 },
});
