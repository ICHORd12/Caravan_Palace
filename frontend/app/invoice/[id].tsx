import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    Montserrat_400Regular,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    useFonts
} from '@expo-google-fonts/montserrat';

import Navbar from '@/components/Navbar/Navbar';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL, GET_ORDERS_END_POINT, FETCH_PRODUCTS_DETAILS_END_POINT } from '@/constants/API';

export default function PaperInvoiceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  

  const { token, isAuthenticated, user } = useAuth();

  const [orderData, setOrderData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

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
          invoiceNumber: backendOrder.invoiceNumber || backendOrder.orderId.substring(0, 8).toUpperCase(),
          orderId: backendOrder.orderId, 
          date: backendOrder.orderDate.split('T')[0],
          totalPrice: parseFloat(backendOrder.totalPrice),
          deliveryAddress: backendOrder.deliveryAddress,
          cardLast4: backendOrder.cardLast4, 
          items: backendOrder.items.map((item: any) => ({
            id: item.productId,
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

  if (!fontsLoaded) return null;

  const renderInvoiceItem = ({ item }: { item: any }) => (
    <View style={styles.invoiceRow}>
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.invoiceText}>{item.quantity}</Text>
      <Text style={styles.invoiceText}>${item.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</Text>
      <Text style={[styles.invoiceText, styles.rowTotal]}>${(item.price * item.quantity).toLocaleString(undefined, {minimumFractionDigits: 2})}</Text>
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      <Navbar />
      <View style={styles.contentContainer}>
        
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back to Order Details</Text>
        </TouchableOpacity>

        {isLoading ? (
            <ActivityIndicator size="large" color="#283618" style={{ marginTop: 50 }} />
        ) : !orderData ? (
            <Text style={styles.pageTitle}>Order Not Found</Text>
        ) : (
            <View style={styles.invoicePaper}>
                {/* INVOICE HEADER */}
                <View style={styles.invoiceHeader}>
                    <View>
                        <Text style={styles.sellerName}>Caravan Palace</Text>
                        <Text style={styles.invoiceTitle}>Official Invoice / Receipt</Text>
                        <Text style={styles.invoiceNumber}>Invoice Number: {orderData.invoiceNumber}</Text>
                        <Text style={styles.invoiceNumber}>Order ID: {orderData.orderId}</Text>
                        <Text style={styles.invoiceNumber}>Order Date: {orderData.date}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* ADDRESS & BILLING INFO (MATCHING PDF) */}
                <View style={styles.billingSection}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.sectionHeader}>Billed To:</Text>
                        {/* Assuming your Auth context provides user.name and user.email */}
                        <Text style={styles.addressText}>{user?.name || "Customer Name"}</Text>
                        <Text style={styles.addressText}>{user?.email || "customer@example.com"}</Text>
                        
                        <Text style={[styles.sectionHeader, { marginTop: 15 }]}>Payment Method:</Text>
                        <Text style={styles.addressText}>Card ending in {orderData.cardLast4 || "****"}</Text>
                    </View>
                    
                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                        <Text style={styles.sectionHeader}>Delivery Address:</Text>
                        <Text style={[styles.addressText, { textAlign: 'right' }]}>{orderData.deliveryAddress}</Text>
                    </View>
                </View>

                {/* ITEMS TABLE HEADER */}
                <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderText, { flex: 2 }]}>Product</Text>
                    <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Qty</Text>
                    <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Unit Price</Text>
                    <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Subtotal</Text>
                </View>

                {/* ITEMS LIST */}
                <FlatList
                    data={orderData.items}
                    keyExtractor={(item) => item.id}
                    renderItem={renderInvoiceItem}
                    style={styles.listContainer}
                />

                <View style={styles.divider} />

                {/* TOTAL */}
                <View style={styles.totalContainer}>
                    <Text style={styles.totalLabel}>Total:</Text>
                    <Text style={styles.totalValue}>${orderData.totalPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}</Text>
                </View>
                
                {/* FOOTER */}
                <Text style={styles.footerText}>Thank you for shopping at Caravan Palace!</Text>
            </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#d6cba6' },
  contentContainer: { flex: 1, padding: 20, maxWidth: 900, width: '100%', alignSelf: 'center' },
  backButton: { alignSelf: 'flex-start', marginBottom: 16 },
  backButtonText: { fontFamily: 'Montserrat_600SemiBold', fontSize: 16, color: '#606c38' },
  invoicePaper: { backgroundColor: '#ffffff', borderRadius: 8, padding: 40, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  invoiceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  sellerName: { fontFamily: 'Montserrat_700Bold', fontSize: 24, color: '#283618', marginBottom: 4 },
  invoiceTitle: { fontFamily: 'Montserrat_600SemiBold', fontSize: 18, color: '#606c38', marginBottom: 12 },
  invoiceNumber: { fontFamily: 'Montserrat_400Regular', fontSize: 14, color: '#283618', marginTop: 4 },
  divider: { height: 1, backgroundColor: '#e9e5d3', marginVertical: 20 },
  billingSection: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  sectionHeader: { fontFamily: 'Montserrat_700Bold', fontSize: 14, color: '#606c38', marginBottom: 4 },
  addressText: { fontFamily: 'Montserrat_600SemiBold', fontSize: 14, color: '#283618', marginTop: 2 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#fefae0', padding: 12, borderRadius: 4, marginBottom: 10 },
  tableHeaderText: { fontFamily: 'Montserrat_700Bold', fontSize: 14, color: '#283618' },
  listContainer: { flexGrow: 0 },
  invoiceRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#fefae0', alignItems: 'center' },
  itemName: { flex: 2, fontFamily: 'Montserrat_600SemiBold', fontSize: 14, color: '#283618' },
  invoiceText: { flex: 1, fontFamily: 'Montserrat_400Regular', fontSize: 14, color: '#283618', textAlign: 'center' },
  rowTotal: { fontFamily: 'Montserrat_600SemiBold', textAlign: 'right' },
  totalContainer: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 10 },
  totalLabel: { fontFamily: 'Montserrat_700Bold', fontSize: 16, color: '#606c38', marginRight: 20 },
  totalValue: { fontFamily: 'Montserrat_700Bold', fontSize: 20, color: '#283618' },
  pageTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 24, color: '#283618', textAlign: 'center' },
  footerText: { fontFamily: 'Montserrat_400Regular', fontSize: 14, color: '#606c38', textAlign: 'center', marginTop: 40 }
});