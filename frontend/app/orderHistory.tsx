import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, Platform, StyleSheet } from 'react-native';
import {
    Montserrat_400Regular,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    useFonts
} from '@expo-google-fonts/montserrat';

import Navbar from '@/components/Navbar/Navbar';
import OrderStatus, { StatusType } from '../components/OrderStatus/OrderStatus';

export type ExtendedStatus = StatusType | 'Cancelled' | 'Refund Requested';
//MOCK DATA - Later to be replaced with real API calls
const INITIAL_MOCK_ORDERS = [
  {
    id: '7e8f8f62-4a2f-4a60-bec5-3bfdfb879c1b',
    date: '2026-04-18',
    totalPrice: 479999.99,
    status: 'Delivered' as ExtendedStatus,
  },
  {
    id: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
    date: '2026-04-20',
    totalPrice: 120000.00,
    status: 'In-transit' as ExtendedStatus,
  },
  {
    id: '9z8y7x6w-5v4u-3t2s-1r0q-p9o8n7m6l5k4',
    date: '2026-04-21',
    totalPrice: 95000.00,
    status: 'Processing' as ExtendedStatus,
  },
];
//MOCK DATA END
export default function OrderHistoryScreen() {
    const router = useRouter();
  const [orders, setOrders] = useState(INITIAL_MOCK_ORDERS);

  let [fontsLoaded] = useFonts({
      Montserrat_700Bold,
      Montserrat_400Regular,
      Montserrat_600SemiBold,
  });

  const handleCancelOrder = (orderId: string) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId ? { ...order, status: 'Cancelled' } : order
      )
    );
    if (Platform.OS === 'web') window.alert('Order cancelled successfully.');
    else Alert.alert('Success', 'Order cancelled successfully.');
  };

  const handleRefundRequest = (orderId: string) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId ? { ...order, status: 'Refund Requested' } : order
      )
    );
    if (Platform.OS === 'web') window.alert('Refund request sent to customer support.');
    else Alert.alert('Request Sent', 'Refund request sent to customer support.');
  };

  const renderOrderItem = ({ item }: { item: typeof INITIAL_MOCK_ORDERS[0] }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.orderIdText}>Order #{item.id.split('-')[0].toUpperCase()}</Text>
        <Text style={styles.dateText}>{item.date}</Text>
      </View>
      
      <Text style={styles.priceText}>${item.totalPrice.toLocaleString()}</Text>
      
      <TouchableOpacity onPress={() => router.push(`/order/${item.id}`)}>
          <Text style={styles.viewDetailsText}>View Details →</Text>
      </TouchableOpacity>

      {(item.status === 'Processing' || item.status === 'In-transit' || item.status === 'Delivered') && (
        <OrderStatus status={item.status as StatusType} />
      )}

      {item.status === 'Processing' && (
        <TouchableOpacity 
          style={[styles.actionButton, styles.cancelButton]} 
          onPress={() => handleCancelOrder(item.id)}
        >
          <Text style={styles.actionButtonText}>Cancel Order</Text>
        </TouchableOpacity>
      )}

      {item.status === 'In-transit' && (
        <View style={[styles.actionButton, styles.disabledButton]}>
          <Text style={styles.disabledButtonText}>Modification Unavailable (In-Transit)</Text>
        </View>
      )}

      {item.status === 'Delivered' && (
        <TouchableOpacity 
          style={[styles.actionButton, styles.refundButton]} 
          onPress={() => handleRefundRequest(item.id)}
        >
          <Text style={styles.actionButtonText}>Request Refund</Text>
        </TouchableOpacity>
      )}

      {item.status === 'Cancelled' && (
        <Text style={styles.statusMessageText}>Order Cancelled</Text>
      )}

      {item.status === 'Refund Requested' && (
        <Text style={[styles.statusMessageText, { color: '#283618' }]}>Refund Pending Approval</Text>
      )}
    </View>
  );


  if (!fontsLoaded) return null;

  return (
    <View style={styles.mainContainer}>
      <Navbar />
      <View style={styles.contentContainer}>
        <Text style={styles.pageTitle}>Your Order History</Text>
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#d6cba6',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
  listContainer: {
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#fefae0',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  cancelButton: {
    backgroundColor: '#bc4749', 
  },
  refundButton: {
    backgroundColor: '#283618', 
  },
  disabledButton: {
    backgroundColor: '#e9e5d3', 
  },
  pageTitle: {
    marginBottom: 20,
    fontFamily: 'Montserrat_700Bold',
    fontSize: 28,
    color: '#283618',
  },
  orderIdText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 16,
    color: '#283618',
  },
  dateText: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 14,
    color: '#606c38',
  },
  priceText: {
    marginBottom: 12,
    fontFamily: 'Montserrat_700Bold',
    fontSize: 18,
    color: '#bc4749',
  },
  actionButtonText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 14,
    color: '#fefae0',
  },
  disabledButtonText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 14,
    color: '#606c38',
  },
  statusMessageText: {
    alignSelf: 'center',
    marginTop: 16,
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 14,
    color: '#bc4749',
  },
  viewDetailsText: {
    marginBottom: 16,
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 14,
    color: '#606c38',
    textDecorationLine: 'underline',
  },
});