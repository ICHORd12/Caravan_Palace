import { useRouter, useFocusEffect } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, Platform, StyleSheet, ActivityIndicator } from 'react-native';
import {
    Montserrat_400Regular,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    useFonts
} from '@expo-google-fonts/montserrat';

import Navbar from '@/components/Navbar/Navbar';
import OrderStatus, { StatusType } from '../components/OrderStatus/OrderStatus';
import { useAuth } from '@/context/AuthContext';
import { useTransition } from '@/context/TransitionContext';
import { API_BASE_URL, GET_ORDERS_END_POINT } from '@/constants/API';

export type ExtendedStatus = StatusType | 'Cancelled' | 'Refund Requested';

const mapBackendStatus = (backendStatus: string): ExtendedStatus => {
  const status = backendStatus.toLowerCase();
  if (status === 'pending') return 'Processing';
  if (status === 'shipped') return 'In-transit';
  if (status === 'delivered') return 'Delivered';
  if (status === 'cancelled') return 'Cancelled';
  return 'Processing'; 
};

export default function OrderHistoryScreen() {

  const [orders, setOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  const { isAuthenticated, token } = useAuth();
  const router = useRouter();
  const { revealWipe } = useTransition();
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  let [fontsLoaded] = useFonts({
      Montserrat_700Bold,
      Montserrat_400Regular,
      Montserrat_600SemiBold,
  });

  useEffect(() => {
      const timer = setTimeout(() => {
          setIsAuthChecking(false);
      }, 100); 
      return () => clearTimeout(timer);
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoadingOrders(true);
      const response = await fetch(`${API_BASE_URL}${GET_ORDERS_END_POINT}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
       
        const formattedOrders = data.orders.map((backendOrder: any) => ({
          id: backendOrder.orderId,
          date: backendOrder.orderDate.split('T')[0], 
          totalPrice: parseFloat(backendOrder.totalPrice),
          status: mapBackendStatus(backendOrder.status)
        }));
        
        setOrders(formattedOrders);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setIsLoadingOrders(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      if (!isAuthChecking) {
        if (!isAuthenticated) {
          router.replace('/login');
        } else {
          fetchOrders();
        }
      }
    }, [isAuthenticated, isAuthChecking, router, fetchOrders])
  );

  useEffect(() => {
    if (fontsLoaded && !isAuthChecking && isAuthenticated && !isLoadingOrders) {
        revealWipe();
    }
  }, [fontsLoaded, isAuthChecking, isAuthenticated, isLoadingOrders, revealWipe]);


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

  const renderOrderItem = ({ item }: { item: any }) => (
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

  if (!fontsLoaded || isAuthChecking || !isAuthenticated) return null;

  return (
    <View style={styles.mainContainer}>
      <Navbar />
      <View style={styles.contentContainer}>
        <Text style={styles.pageTitle}>Your Order History</Text>
        
        {isLoadingOrders ? (
            <ActivityIndicator size="large" color="#283618" style={{ marginTop: 50 }} />
        ) : orders.length === 0 ? (
            <Text style={[styles.dateText, { textAlign: 'center', marginTop: 40 }]}>You have no past orders.</Text>
        ) : (
            <FlatList
            data={orders}
            keyExtractor={(item) => item.id}
            renderItem={renderOrderItem}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            />
        )}
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