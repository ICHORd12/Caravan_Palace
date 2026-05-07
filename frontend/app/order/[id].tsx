import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    Montserrat_400Regular,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    useFonts
} from '@expo-google-fonts/montserrat';

import Navbar from '@/components/Navbar/Navbar';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL, GET_ORDERS_END_POINT, FETCH_PRODUCTS_DETAILS_END_POINT, INVOICE_API_END_POINT } from '@/constants/API';

const mapBackendStatus = (backendStatus: string) => {
  const status = backendStatus.toLowerCase();
  if (status === 'pending') return 'Processing';
  if (status === 'in-transit') return 'In-transit';
  if (status === 'delivered') return 'Delivered';
  if (status === 'cancelled') return 'Cancelled';
  return 'Processing'; 
};

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { token, isAuthenticated } = useAuth();

  const [orderData, setOrderData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEmailing, setIsEmailing] = useState(false);

  let [fontsLoaded] = useFonts({
      Montserrat_700Bold,
      Montserrat_400Regular,
      Montserrat_600SemiBold,
  });

  useEffect(() => {
    if (!isAuthenticated || !token || !id) return;

    const fetchOrderDetails = async () => {
      try {
        setIsLoading(true);
        const orderResponse = await fetch(`${API_BASE_URL}${GET_ORDERS_END_POINT}/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!orderResponse.ok) throw new Error('Failed to fetch order');
        const orderJson = await orderResponse.json();
        const backendOrder = orderJson.order;

        const productIds = backendOrder.items.map((item: any) => item.productId);
        let productsMap: Record<string, string> = {};

        if (productIds.length > 0) {
            const productsResponse = await fetch(`${API_BASE_URL}${FETCH_PRODUCTS_DETAILS_END_POINT}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productIds })
            });

            if (productsResponse.ok) {
                const productsJson = await productsResponse.json();
                productsJson.products.forEach((prod: any) => {
                    productsMap[prod.productId] = prod.name;
                });
            }
        }

        const formattedOrder = {
          date: backendOrder.orderDate.split('T')[0],
          status: mapBackendStatus(backendOrder.status),
          totalPrice: parseFloat(backendOrder.totalPrice),
          items: backendOrder.items.map((item: any) => ({
            id: item.orderItemId,
            name: productsMap[item.productId] || 'Caravan Model',
            price: parseFloat(item.purchasedPrice),
            quantity: item.quantity
          }))
        };

        setOrderData(formattedOrder);
      } catch (error) {
        console.error("Error fetching order details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id, token, isAuthenticated]);

  const handleEmailInvoice = async () => {
    try {
        setIsEmailing(true);
        const response = await fetch(`${API_BASE_URL}${INVOICE_API_END_POINT}/${id}/email`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            if (Platform.OS === 'web') window.alert('Invoice emailed successfully!');
            else Alert.alert('Success', 'Invoice emailed successfully!');
        } else {
            throw new Error('Failed to send email');
        }
    } catch (error) {
        if (Platform.OS === 'web') window.alert('Backend SMTP not configured yet.');
        else Alert.alert('Notice', 'Backend SMTP not configured yet.');
    } finally {
        setIsEmailing(false);
    }
  };
  const handleDownloadPDF = async () => {
    try {
        if (Platform.OS !== 'web') {
            Alert.alert('Notice', 'PDF downloads on mobile require Expo FileSystem. Try this on web!');
            return;
        }

        const response = await fetch(`${API_BASE_URL}${INVOICE_API_END_POINT}/${id}/pdf`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to download PDF');

       
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-order-${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

    } catch (error) {
        console.error("Error downloading PDF:", error);
        if (Platform.OS === 'web') window.alert('Failed to download PDF.');
    }
  };

  if (!fontsLoaded) return null;

  const renderProductItem = ({ item }: { item: any }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemDetails}>
         <Text style={styles.itemName}>{item.name}</Text>
         <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
      </View>
      <Text style={styles.itemPrice}>${(item.price * item.quantity).toLocaleString()}</Text>
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      <Navbar />
      <View style={styles.contentContainer}>
        
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back to History</Text>
        </TouchableOpacity>

        <Text style={styles.pageTitle}>Order Details</Text>
        
        {isLoading ? (
            <ActivityIndicator size="large" color="#283618" style={{ marginTop: 50 }} />
        ) : !orderData ? (
            <Text style={styles.sectionTitle}>Order Not Found</Text>
        ) : (
            <>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Order ID: <Text style={styles.summaryValue}>#{id ? id.split('-')[0].toUpperCase() : 'UNKNOWN'}</Text></Text>
                    <Text style={styles.summaryLabel}>Date: <Text style={styles.summaryValue}>{orderData.date}</Text></Text>
                    <Text style={styles.summaryLabel}>Status: <Text style={styles.summaryValue}>{orderData.status}</Text></Text>
                    
                    {/* THE NEW INVOICE BUTTONS */}
                    <View style={styles.invoiceButtonRow}>
                        <TouchableOpacity 
                            style={styles.actionButton} 
                            onPress={() => router.push(`/invoice/${id}`)}
                        >
                            <Text style={styles.actionButtonText}>📄 View Invoice</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={[styles.actionButton, { backgroundColor: '#bc4749' }]} 
                            onPress={handleDownloadPDF}
                        >
                            <Text style={styles.actionButtonText}>⬇️ Get PDF</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.actionButton, { backgroundColor: '#5b0f79' }]} 
                            onPress={handleEmailInvoice}
                            disabled={isEmailing}
                        >
                            <Text style={styles.actionButtonText}>{isEmailing ? "Sending..." : "✉️ Email PDF"}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Items Purchased</Text>

                <FlatList
                    data={orderData.items}
                    keyExtractor={(item) => item.id}
                    renderItem={renderProductItem}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                />

                <View style={styles.totalContainer}>
                    <Text style={styles.totalLabel}>Total Paid:</Text>
                    <Text style={styles.totalValue}>${orderData.totalPrice.toLocaleString()}</Text>
                </View>
            </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#d6cba6' },
  contentContainer: { flex: 1, padding: 20, maxWidth: 800, width: '100%', alignSelf: 'center' },
  itemDetails: { justifyContent: 'center' },
  summaryCard: { backgroundColor: '#fefae0', borderRadius: 8, padding: 16, marginBottom: 24 },
  itemCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fefae0', borderRadius: 8, padding: 16, marginBottom: 12 },
  listContainer: { paddingBottom: 20 },
  totalContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#283618', borderRadius: 8, padding: 20, marginTop: 10, marginBottom: 40 },
  backButton: { alignSelf: 'flex-start', marginBottom: 16 },
  pageTitle: { marginBottom: 20, fontFamily: 'Montserrat_700Bold', fontSize: 28, color: '#283618' },
  sectionTitle: { marginBottom: 12, fontFamily: 'Montserrat_600SemiBold', fontSize: 20, color: '#283618' },
  backButtonText: { fontFamily: 'Montserrat_600SemiBold', fontSize: 16, color: '#606c38' },
  summaryLabel: { marginBottom: 6, fontFamily: 'Montserrat_600SemiBold', fontSize: 14, color: '#606c38' },
  summaryValue: { fontFamily: 'Montserrat_700Bold', fontSize: 14, color: '#283618' },
  itemName: { marginBottom: 4, fontFamily: 'Montserrat_600SemiBold', fontSize: 16, color: '#283618' },
  itemQuantity: { fontFamily: 'Montserrat_400Regular', fontSize: 14, color: '#606c38' },
  itemPrice: { fontFamily: 'Montserrat_700Bold', fontSize: 16, color: '#bc4749' },
  totalLabel: { fontFamily: 'Montserrat_700Bold', fontSize: 20, color: '#fefae0' },
  totalValue: { fontFamily: 'Montserrat_700Bold', fontSize: 22, color: '#fefae0' },
  invoiceButtonRow: { flexDirection: 'row', gap: 10, marginTop: 15 },
  actionButton: { backgroundColor: '#283618', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 6, alignItems: 'center', flex: 1 },
  actionButtonText: { fontFamily: 'Montserrat_600SemiBold', fontSize: 14, color: '#fefae0' }
});