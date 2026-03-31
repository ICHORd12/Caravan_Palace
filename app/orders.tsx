import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, Pressable } from 'react-native';

import C_Navbar from '../components/utku/C_Navbar/C_Navbar';
import GeneralButton from '../components/utku/GeneralButton/GeneralButton';
import { useOrders } from '../context/OrderContext';

export default function Orders() {
  const router = useRouter();
  const { orders, loading, fetchOrders } = useOrders();

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.headerBarContainer}> 
        <C_Navbar />
      </View>

      <ScrollView style={styles.scrollArea}>
        <View style={styles.content}>
          <Text style={styles.screenTitle}>My Orders</Text>

          {loading ? (
            <ActivityIndicator size="large" color="#5A7D71" />
          ) : orders.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyText}>You haven't placed any orders yet.</Text>
              <GeneralButton title="START SHOPPING" onPress={() => router.push('/caravans')} />
            </View>
          ) : (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { flex: 1 }]}>Order ID</Text>
                <Text style={[styles.th, { flex: 2 }]}>Date</Text>
                <Text style={[styles.th, { flex: 1 }]}>Total</Text>
                <Text style={[styles.th, { flex: 1 }]}>Status</Text>
                <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Action</Text>
              </View>

              {orders.map((order) => (
                <View key={order.order_id} style={styles.tr}>
                  <Text style={[styles.td, { flex: 1, fontFamily: 'Montserrat_700Bold' }]}>#{order.order_id}</Text>
                  <Text style={[styles.td, { flex: 2 }]}>{new Date(order.created_at).toLocaleString()}</Text>
                  <Text style={[styles.td, { flex: 1, fontFamily: 'Montserrat_600SemiBold' }]}>${Number(order.total_amount).toLocaleString()}</Text>
                  <View style={[styles.td, { flex: 1 }]}>
                    <View style={[styles.statusBadge, styles[`status_${order.status}` as keyof typeof styles]]}>
                      <Text style={styles.statusText}>{order.status.toUpperCase()}</Text>
                    </View>
                  </View>
                  <View style={[styles.td, { flex: 1, alignItems: 'flex-end' }]}>
                    <GeneralButton title="VIEW" onPress={() => router.push(`/order/${order.order_id}`)} />
                  </View>
                </View>
              ))}
            </View>
          )}

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  headerBarContainer: { paddingHorizontal: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  scrollArea: { flex: 1 },
  content: { padding: 40, maxWidth: 1000, marginHorizontal: 'auto', width: '100%' },
  screenTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 32, color: '#222', marginBottom: 40 },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyIcon: { fontSize: 80, marginBottom: 20 },
  emptyText: { fontFamily: 'Montserrat_400Regular', fontSize: 18, color: '#666', marginBottom: 30 },
  table: { backgroundColor: '#fff', borderRadius: 12, padding: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, borderWidth: 1, borderColor: '#eee' },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#ddd', paddingBottom: 15, marginBottom: 15 },
  th: { fontFamily: 'Montserrat_600SemiBold', fontSize: 14, color: '#888', textTransform: 'uppercase' },
  tr: { flexDirection: 'row', alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  td: { fontFamily: 'Montserrat_400Regular', fontSize: 15, color: '#333' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  statusText: { fontFamily: 'Montserrat_700Bold', fontSize: 10, color: '#fff', letterSpacing: 0.5 },
  status_processing: { backgroundColor: '#F39C12' },
  status_in: { backgroundColor: '#3498DB' }, 
  'status_in-transit': { backgroundColor: '#3498DB' },
  status_delivered: { backgroundColor: '#27AE60' },
});
