import { useRouter, useFocusEffect } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, Platform, StyleSheet, ActivityIndicator } from 'react-native';
import {
    Montserrat_400Regular,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    useFonts
} from '@expo-google-fonts/montserrat';
import * as SecureStore from 'expo-secure-store';

import Navbar from '@/components/Navbar/Navbar';
import OrderStatus, { StatusType } from '../components/OrderStatus/OrderStatus';
import { useAuth } from '@/context/AuthContext';
import { useTransition } from '@/context/TransitionContext';
import { API_BASE_URL, GET_ORDERS_END_POINT } from '@/constants/API';

export type ExtendedStatus = StatusType | 'Cancelled' | 'Refund Requested' | 'Returned';


const getPendingRefunds = async (): Promise<string[]> => {
    try {
        if (Platform.OS === 'web') {
            const stored = window.localStorage.getItem('pendingRefunds');
            return stored ? JSON.parse(stored) : [];
        } else {
            const stored = await SecureStore.getItemAsync('pendingRefunds');
            return stored ? JSON.parse(stored) : [];
        }
    } catch { return []; }
};

const addPendingRefund = async (orderId: string) => {
    try {
        const current = await getPendingRefunds();
        if (!current.includes(orderId)) {
            current.push(orderId);
            const serialized = JSON.stringify(current);
            if (Platform.OS === 'web') {
                window.localStorage.setItem('pendingRefunds', serialized);
            } else {
                await SecureStore.setItemAsync('pendingRefunds', serialized);
            }
        }
    } catch {}
};
// --------------------------------------------------------

const mapBackendStatus = (backendStatus: string): ExtendedStatus => {
  const status = backendStatus.toLowerCase();
  
  if (status === 'pending' || status === 'processing') return 'Processing';
  if (status === 'in-transit' || status === 'shipped') return 'In-transit';
  if (status === 'delivered') return 'Delivered';
  if (status === 'cancelled') return 'Cancelled';
  if (status === 'returned') return 'Returned'; 
  if (status === 'refund-requested' || status === 'refund_requested') return 'Refund Requested'; 
  
  return 'Processing'; 
};

const isRefundEligible = (status: string, dateString: string) => {
  if (status !== 'Delivered') return false;
  
  const orderDate = new Date(dateString);
  const currentDate = new Date();
  const differenceInTime = currentDate.getTime() - orderDate.getTime();
  const differenceInDays = differenceInTime / (1000 * 3600 * 24);
  
  return differenceInDays <= 30;
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
      const timer = setTimeout(() => setIsAuthChecking(false), 100); 
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
        const pendingRefunds = await getPendingRefunds(); // Load memory

        const formattedOrders = data.orders.map((backendOrder: any) => {
          let mappedStatus = mapBackendStatus(backendOrder.status);


          if (mappedStatus === 'Delivered' && pendingRefunds.includes(backendOrder.orderId)) {
             mappedStatus = 'Refund Requested';
          }

          return {
            id: backendOrder.orderId,
            date: backendOrder.orderDate.split('T')[0], 
            totalPrice: parseFloat(backendOrder.totalPrice),
            status: mappedStatus
          };
        });
        
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
      const verifyAuthStatus = async () => {
        if (isAuthenticated) {
          fetchOrders();
          return;
        }

        let savedToken = null;
        if (Platform.OS === 'web') {
          savedToken = window.localStorage.getItem('userToken');
        } else {
          savedToken = await SecureStore.getItemAsync('userToken');
        }

        if (!savedToken) router.replace('/login');
        else fetchOrders();
      };

      if (!isAuthChecking) verifyAuthStatus();
    }, [isAuthenticated, isAuthChecking, router, fetchOrders])
  );

  useEffect(() => {
    if (fontsLoaded && !isAuthChecking && isAuthenticated && !isLoadingOrders) {
        revealWipe();
    }
  }, [fontsLoaded, isAuthChecking, isAuthenticated, isLoadingOrders, revealWipe]);


  const handleCancelOrder = async (orderId: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}${GET_ORDERS_END_POINT}/${orderId}/cancel`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            setOrders(prevOrders => 
              prevOrders.map(order => 
                order.id === orderId ? { ...order, status: 'Cancelled' } : order
              )
            );
            if (Platform.OS === 'web') window.alert('Order cancelled successfully.');
            else Alert.alert('Success', 'Order cancelled successfully.');
        } else {
            const data = await response.json();
            if (Platform.OS === 'web') window.alert(data.message || 'Failed to cancel order.');
            else Alert.alert('Error', data.message || 'Failed to cancel order.');
        }
    } catch (error) {
        console.error("Cancel order error:", error);
    }
  };

  const handleRefundRequest = async (orderId: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}${GET_ORDERS_END_POINT}/${orderId}/refund-requests`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok || response.status === 201) { 
            await addPendingRefund(orderId); // Save to local memory!
            setOrders(prevOrders => 
              prevOrders.map(order => 
                order.id === orderId ? { ...order, status: 'Refund Requested' } : order
              )
            );
            if (Platform.OS === 'web') window.alert('Refund request sent to customer support.');
            else Alert.alert('Request Sent', 'Refund request sent to customer support.');
        } else {
            const data = await response.json();
            
            
            if (response.status === 409) {
                await addPendingRefund(orderId); 
                setOrders(prevOrders => 
                  prevOrders.map(order => 
                    order.id === orderId ? { ...order, status: 'Refund Requested' } : order
                  )
                );
                if (Platform.OS === 'web') window.alert('You have already requested a refund for this order.');
                else Alert.alert('Already Requested', 'You have already requested a refund for this order.');
            } else {
                if (Platform.OS === 'web') window.alert(data.message || 'Failed to request refund.');
                else Alert.alert('Error', data.message || 'Failed to request refund.');
            }
        }
    } catch (error) {
        console.error("Refund request error:", error);
    }
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

      {item.status === 'Delivered' && isRefundEligible(item.status, item.date) && (
        <TouchableOpacity 
          style={[styles.actionButton, styles.refundButton]} 
          onPress={() => handleRefundRequest(item.id)}
        >
          <Text style={styles.actionButtonText}>Request Refund</Text>
        </TouchableOpacity>
      )}

      {item.status === 'Delivered' && !isRefundEligible(item.status, item.date) && (
        <View style={[styles.actionButton, styles.disabledButton]}>
          <Text style={styles.disabledButtonText}>Refund Period Expired</Text>
        </View>
      )}

      {item.status === 'Cancelled' && (
        <Text style={styles.statusMessageText}>Order Cancelled</Text>
      )}

      {item.status === 'Refund Requested' && (
        <Text style={[styles.statusMessageText, { color: '#283618' }]}>Refund Pending Approval</Text>
      )}

      {item.status === 'Returned' && (
        <Text style={[styles.statusMessageText, { color: '#283618' }]}>Refund Approved & Returned</Text>
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