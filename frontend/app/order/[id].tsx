import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    Montserrat_400Regular,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    useFonts
} from '@expo-google-fonts/montserrat';

import Navbar from '@/components/Navbar/Navbar';

// MOCK DATA - Later to be replaced with real API calls
const MOCK_ORDER_DETAILS: Record<string, any> = {
  '7e8f8f62-4a2f-4a60-bec5-3bfdfb879c1b': {
    date: '2026-04-18',
    status: 'Delivered',
    items: [
      { id: 'item-1', name: 'Eco Camper Van', price: 479999.99, quantity: 1 }
    ]
  },
  '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p': {
    date: '2026-04-20',
    status: 'In-transit',
    items: [
      { id: 'item-2', name: 'Silver Palace', price: 120000.00, quantity: 1 }
    ]
  },
  '9z8y7x6w-5v4u-3t2s-1r0q-p9o8n7m6l5k4': {
    date: '2026-04-21',
    status: 'Processing',
    items: [
      { id: 'item-3', name: 'Caravan X', price: 95000.00, quantity: 1 }
    ]
  }
};
//MOCK DATA END
export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  let [fontsLoaded] = useFonts({
      Montserrat_700Bold,
      Montserrat_400Regular,
      Montserrat_600SemiBold,
  });

  if (!fontsLoaded) return null;

 
  const orderData = id ? MOCK_ORDER_DETAILS[id] : null;

  if (!orderData) {
    return (
      <View style={styles.mainContainer}>
        <Navbar />
        <View style={styles.contentContainer}>
          <Text style={styles.pageTitle}>Order Not Found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>← Back to History</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const calculateTotal = () => {
    return orderData.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
  };

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
        
        <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Order ID: <Text style={styles.summaryValue}>#{id?.split('-')[0].toUpperCase()}</Text></Text>
            <Text style={styles.summaryLabel}>Date: <Text style={styles.summaryValue}>{orderData.date}</Text></Text>
            <Text style={styles.summaryLabel}>Status: <Text style={styles.summaryValue}>{orderData.status}</Text></Text>
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
            <Text style={styles.totalValue}>${calculateTotal().toLocaleString()}</Text>
        </View>

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
  itemDetails: {
    justifyContent: 'center',
  },
  summaryCard: {
    backgroundColor: '#fefae0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fefae0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  listContainer: {
    paddingBottom: 20,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#283618',
    borderRadius: 8,
    padding: 20,
    marginTop: 10,
    marginBottom: 40,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  pageTitle: {
    marginBottom: 20,
    fontFamily: 'Montserrat_700Bold',
    fontSize: 28,
    color: '#283618',
  },
  sectionTitle: {
    marginBottom: 12,
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 20,
    color: '#283618',
  },
  backButtonText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 16,
    color: '#606c38',
  },
  summaryLabel: {
    marginBottom: 6,
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 14,
    color: '#606c38',
  },
  summaryValue: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 14,
    color: '#283618',
  },
  itemName: {
    marginBottom: 4,
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 16,
    color: '#283618',
  },
  itemQuantity: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 14,
    color: '#606c38',
  },
  itemPrice: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 16,
    color: '#bc4749',
  },
  totalLabel: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 20,
    color: '#fefae0',
  },
  totalValue: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 22,
    color: '#fefae0',
  }
});