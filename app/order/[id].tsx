import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, Image } from 'react-native';

import C_Navbar from '../../components/utku/C_Navbar/C_Navbar';
import GeneralButton from '../../components/utku/GeneralButton/GeneralButton';
import OrderStatusStepper from '../../components/utku/OrderStatusStepper/OrderStatusStepper';
import { useOrders } from '../../context/OrderContext';

export default function OrderDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { fetchOrderById } = useOrders();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Poll for status updates to show the mock delivery in real time
  useEffect(() => {
    if (!id) return;
    
    const load = async () => {
      try {
        const data = await fetchOrderById(Number(id));
        setOrder(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();

    const interval = setInterval(() => {
      load();
    }, 5000); // Poll every 5s

    return () => clearInterval(interval);
  }, [id]);

  if (loading && !order) return <View style={styles.center}><ActivityIndicator size="large" color="#5A7D71" /></View>;
  if (!order) return <View style={styles.center}><Text>Order not found.</Text></View>;

  return (
    <View style={styles.container}>
      <View style={styles.headerBarContainer}> 
        <C_Navbar />
      </View>

      <ScrollView style={styles.scrollArea}>
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.screenTitle}>Order #{order.order_id.toString().padStart(6, '0')}</Text>
            <GeneralButton title="VIEW INVOICE" onPress={() => router.push(`/invoice/${order.order_id}`)} />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Delivery Status</Text>
            <OrderStatusStepper currentStatus={order.status} />
            <Text style={styles.statusHelper}>
              {order.status === 'processing' && "We're preparing your caravan for deployment."}
              {order.status === 'in-transit' && "Your items are on the road heading to your address."}
              {order.status === 'delivered' && "Delivered! Enjoy your new gear."}
            </Text>
          </View>

          <View style={styles.layoutCols}>
            <View style={[styles.card, { flex: 2 }]}>
              <Text style={styles.sectionTitle}>Items Ordered</Text>
              {order.items?.map((item: any) => (
                <View key={item.product_id} style={styles.itemRow}>
                  <View style={styles.thumb}>
                    <Image source={require('../../assets/images/caravan.jpg')} style={{ width: '100%', height: '100%', borderRadius: 8 }} resizeMode="cover" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 20 }}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemPrice}>${Number(item.unit_price).toLocaleString()} x {item.quantity}</Text>
                  </View>
                  <Text style={styles.itemTotal}>${(item.quantity * item.unit_price).toLocaleString()}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.card, { flex: 1, gap: 30 }]}>
              <View>
                <Text style={styles.sectionTitle}>Shipping Details</Text>
                <Text style={styles.subtext}>{order.shipping_address}</Text>
              </View>

              <View>
                <Text style={styles.sectionTitle}>Order Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.subtext}>Date</Text>
                  <Text style={styles.subtextDark}>{new Date(order.created_at).toLocaleDateString()}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.subtext}>Total</Text>
                  <Text style={styles.totalText}>${Number(order.total_amount).toLocaleString()}</Text>
                </View>
              </View>

              <GeneralButton title="BACK TO ORDERS" onPress={() => router.push('/orders')} />
            </View>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerBarContainer: { paddingHorizontal: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  scrollArea: { flex: 1 },
  content: { padding: 40, maxWidth: 1000, marginHorizontal: 'auto', width: '100%' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  screenTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 32, color: '#222' },
  layoutCols: { flexDirection: 'row', gap: 30 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, borderWidth: 1, borderColor: '#eee', marginBottom: 30 },
  sectionTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 18, color: '#222', marginBottom: 20 },
  statusHelper: { fontFamily: 'Montserrat_400Regular', fontSize: 14, color: '#666', textAlign: 'center', fontStyle: 'italic', marginTop: 10 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  thumb: { width: 60, height: 60, backgroundColor: '#EAEAEA', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  itemName: { fontFamily: 'Montserrat_600SemiBold', fontSize: 15, color: '#222', marginBottom: 4 },
  itemPrice: { fontFamily: 'Montserrat_400Regular', fontSize: 14, color: '#666' },
  itemTotal: { fontFamily: 'Montserrat_700Bold', fontSize: 16, color: '#222' },
  subtext: { fontFamily: 'Montserrat_400Regular', fontSize: 14, color: '#666', lineHeight: 22 },
  subtextDark: { fontFamily: 'Montserrat_600SemiBold', fontSize: 14, color: '#222' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  totalText: { fontFamily: 'Montserrat_700Bold', fontSize: 18, color: '#D35400' }
});
