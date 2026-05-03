import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { styles } from './Invoice.styles';

export interface InvoiceItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  status: string;
  totalPrice: number;
  deliveryAddress: string;
  items: InvoiceItem[];
}

interface InvoiceProps {
  orderData: InvoiceData;
}

export default function Invoice({ orderData }: InvoiceProps) {
  
  const renderInvoiceItem = ({ item }: { item: InvoiceItem }) => (
    <View style={styles.invoiceRow}>
      <View style={styles.invoiceItemInfo}>
         <Text style={styles.itemName}>{item.name}</Text>
         <Text style={styles.itemIdText}>ID: {item.id.split('-')[0].toUpperCase()}</Text>
      </View>
      <Text style={styles.invoiceText}>{item.quantity}</Text>
      <Text style={styles.invoiceText}>${item.price.toLocaleString()}</Text>
      <Text style={[styles.invoiceText, styles.rowTotal]}>${(item.price * item.quantity).toLocaleString()}</Text>
    </View>
  );

  return (
    <View style={styles.invoicePaper}>
        {/* INVOICE HEADER */}
        <View style={styles.invoiceHeader}>
            <View>
                <Text style={styles.invoiceTitle}>INVOICE</Text>
                <Text style={styles.invoiceNumber}>{orderData.invoiceNumber}</Text>
            </View>
            <View style={styles.sellerDetails}>
                <Text style={styles.sellerName}>Caravan Palace</Text>
                <Text style={styles.sellerText}>contact@caravanpalace.com</Text>
                <Text style={styles.sellerText}>Status: {orderData.status}</Text>
            </View>
        </View>

        <View style={styles.divider} />

        {/* ADDRESS & DATE */}
        <View style={styles.billingSection}>
            <View>
                <Text style={styles.sectionHeader}>Billed & Delivered To:</Text>
                <Text style={styles.addressText}>{orderData.deliveryAddress}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.sectionHeader}>Date of Issue:</Text>
                <Text style={styles.addressText}>{orderData.date}</Text>
            </View>
        </View>

        {/* ITEMS TABLE HEADER */}
        <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 2 }]}>Description</Text>
            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Qty</Text>
            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Unit Price</Text>
            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Amount</Text>
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
            <Text style={styles.totalLabel}>Total Due:</Text>
            <Text style={styles.totalValue}>${orderData.totalPrice.toLocaleString()}</Text>
        </View>
    </View>
  );
}