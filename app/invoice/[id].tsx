import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator } from 'react-native';

import C_Navbar from '../../components/utku/C_Navbar/C_Navbar';
import GeneralButton from '../../components/utku/GeneralButton/GeneralButton';
import { useAuth } from '../../context/AuthContext';
import { useOrders } from '../../context/OrderContext';

export default function Invoice() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { fetchOrderById } = useOrders();
  const { user } = useAuth();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [didEmail, setDidEmail] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchOrderById(Number(id))
      .then(data => {
        setOrder(data);
        // Simulate sending email receipt
        setTimeout(() => setDidEmail(true), 1500);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#5A7D71" /></View>;
  if (!order) return <View style={styles.center}><Text>Invoice not found.</Text></View>;

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBarContainer}> 
        <C_Navbar />
      </View>

      <ScrollView style={styles.scrollArea}>
        <View style={styles.content}>
          
          {didEmail && (
            <View style={styles.emailBanner}>
              <Text style={styles.emailBannerText}>✓ Receipt emailed to {user?.email}</Text>
            </View>
          )}

          <View style={styles.invoiceCard} id="printable-invoice">
            {/* INVOICE HEADER */}
            <View style={styles.invoiceHeader}>
              <View>
                <Text style={styles.logoText}>CARAVAN PALACE</Text>
                <Text style={styles.companyInfo}>123 Explorer Way, Nature City</Text>
                <Text style={styles.companyInfo}>support@caravanpalace.test</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.invoiceTitle}>INVOICE</Text>
                <Text style={styles.invoiceNumber}>#{order.order_id.toString().padStart(6, '0')}</Text>
                <Text style={styles.invoiceDate}>{new Date(order.created_at).toLocaleDateString()}</Text>
              </View>
            </View>

            {/* BILL TO */}
            <View style={styles.billToRow}>
              <View style={styles.billBox}>
                <Text style={styles.billLabel}>Billed To:</Text>
                <Text style={styles.billValueName}>{user?.name}</Text>
                <Text style={styles.billValue}>{user?.email}</Text>
              </View>
              <View style={styles.billBox}>
                <Text style={styles.billLabel}>Shipped To:</Text>
                <Text style={styles.billValue}>{order.shipping_address}</Text>
              </View>
              <View style={styles.billBox}>
                <Text style={styles.billLabel}>Payment Detals:</Text>
                <Text style={styles.billValue}>Credit Card (Paid)</Text>
                <Text style={styles.txnId}>TXN: {order.transaction_id || 'N/A'}</Text>
              </View>
            </View>

            {/* ITEMS TABLE */}
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { flex: 3 }]}>Description</Text>
                <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>Qty</Text>
                <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Unit Price</Text>
                <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Amount</Text>
              </View>
              
              {order.items?.map((item: any) => (
                <View key={item.product_id} style={styles.tr}>
                  <Text style={[styles.td, { flex: 3, fontFamily: 'Montserrat_600SemiBold' }]}>{item.name}</Text>
                  <Text style={[styles.td, { flex: 1, textAlign: 'center' }]}>{item.quantity}</Text>
                  <Text style={[styles.td, { flex: 1, textAlign: 'right' }]}>${Number(item.unit_price).toLocaleString()}</Text>
                  <Text style={[styles.td, { flex: 1, textAlign: 'right' }]}>${(item.quantity * item.unit_price).toLocaleString()}</Text>
                </View>
              ))}
            </View>

            {/* TOTALS */}
            <View style={styles.totalsArea}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal:</Text>
                <Text style={styles.totalValue}>${Number(order.total_amount).toLocaleString()}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Shipping:</Text>
                <Text style={styles.totalValue}>$0.00</Text>
              </View>
              <View style={[styles.totalRow, styles.grandTotalRow]}>
                <Text style={styles.grandTotalLabel}>Total Paid:</Text>
                <Text style={styles.grandTotalValue}>${Number(order.total_amount).toLocaleString()}</Text>
              </View>
            </View>

            <View style={styles.footerNote}>
              <Text style={styles.noteText}>Thank you for your purchase! Your order is now processing and will be delivered soon.</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <GeneralButton title="TRACK ORDER" onPress={() => router.push(`/order/${order.order_id}`)} />
            <View style={{ width: 20 }} />
            <GeneralButton title="PRINT / SAVE PDF" onPress={handlePrint} />
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
  content: { padding: 40, maxWidth: 800, marginHorizontal: 'auto', width: '100%' },
  emailBanner: { backgroundColor: '#E8F5E9', padding: 15, borderRadius: 8, marginBottom: 20, alignItems: 'center', borderWidth: 1, borderColor: '#C8E6C9' },
  emailBannerText: { fontFamily: 'Montserrat_600SemiBold', color: '#2E7D32' },
  invoiceCard: { backgroundColor: '#fff', padding: 50, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, borderWidth: 1, borderColor: '#eee' },
  invoiceHeader: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 2, borderBottomColor: '#222', paddingBottom: 30, marginBottom: 30 },
  logoText: { fontFamily: 'Montserrat_700Bold', fontSize: 24, color: '#222', letterSpacing: 1, marginBottom: 8 },
  companyInfo: { fontFamily: 'Montserrat_400Regular', color: '#666', fontSize: 13, marginBottom: 4 },
  invoiceTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 36, color: '#222', letterSpacing: 2 },
  invoiceNumber: { fontFamily: 'Montserrat_600SemiBold', fontSize: 16, color: '#666', marginTop: 10 },
  invoiceDate: { fontFamily: 'Montserrat_400Regular', fontSize: 14, color: '#888', marginTop: 4 },
  billToRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
  billBox: { flex: 1 },
  billLabel: { fontFamily: 'Montserrat_700Bold', fontSize: 12, color: '#888', textTransform: 'uppercase', marginBottom: 8 },
  billValueName: { fontFamily: 'Montserrat_700Bold', fontSize: 16, color: '#222', marginBottom: 4 },
  billValue: { fontFamily: 'Montserrat_400Regular', fontSize: 14, color: '#444', lineHeight: 20 },
  txnId: { fontFamily: 'Montserrat_400Regular', fontSize: 12, color: '#888', marginTop: 5 },
  table: { marginBottom: 40 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#ccc', paddingBottom: 10, marginBottom: 10 },
  th: { fontFamily: 'Montserrat_700Bold', fontSize: 13, color: '#222', textTransform: 'uppercase' },
  tr: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  td: { fontFamily: 'Montserrat_400Regular', fontSize: 14, color: '#444' },
  totalsArea: { alignItems: 'flex-end', marginBottom: 40 },
  totalRow: { flexDirection: 'row', width: 300, justifyContent: 'space-between', paddingVertical: 8 },
  totalLabel: { fontFamily: 'Montserrat_600SemiBold', fontSize: 14, color: '#666' },
  totalValue: { fontFamily: 'Montserrat_600SemiBold', fontSize: 14, color: '#222' },
  grandTotalRow: { borderTopWidth: 2, borderTopColor: '#222', marginTop: 10, paddingTop: 15 },
  grandTotalLabel: { fontFamily: 'Montserrat_700Bold', fontSize: 18, color: '#222' },
  grandTotalValue: { fontFamily: 'Montserrat_700Bold', fontSize: 22, color: '#D35400' },
  footerNote: { textAlign: 'center', backgroundColor: '#f9f9f9', padding: 20, borderRadius: 8 },
  noteText: { fontFamily: 'Montserrat_400Regular', fontSize: 14, color: '#666', textAlign: 'center', fontStyle: 'italic' },
  actions: { flexDirection: 'row', justifyContent: 'center', marginTop: 40 }
});
