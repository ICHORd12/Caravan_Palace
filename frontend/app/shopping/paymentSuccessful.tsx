import React, { useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import Navbar from "@/components/Navbar/Navbar";
import { Colors } from '@/constants/theme';
import { useRoutePayload } from "@/context/RoutePayloadPassing"; // Update with your actual path
import { useTransition } from "@/context/TransitionContext"
import { router } from "expo-router"; // Assuming you use expo-router for the 'Go Home' button

// Your provided models
export type CartProduct = {
    name: string;
    currentPrice: string;
    quantityInStocks: number;
};

export type CartItemFE = {
    cartItemId: string;
    productId: string;
    quantity: number;
    product: CartProduct;
};

// Define the shape of the payload we expect
type PaymentSuccessPayload = {
    cartItems: CartItemFE[];
    totalPaid: number | string;
};

export default function PaymentSuccessfulPage() {
    const { routePayload, clearRoutePayload } = useRoutePayload();
    const {revealWipe, navigateWithWipe} = useTransition();

    // Clean up the payload when leaving the page
    useEffect(() => {
        revealWipe();
        
        return () => {
            clearRoutePayload();
        };
    }, [revealWipe, clearRoutePayload]);

    // Safely cast the generic context payload to our specific type
    const orderDetails = routePayload as PaymentSuccessPayload | null;

    // Fallback UI if accessed directly without a payload
    if (!orderDetails || !orderDetails.cartItems) {
        return (
            <View style={styles.mainContainer}>
                <Navbar />
                <View style={styles.contentContainer}>
                    <Text style={styles.errorText}>No order details found.</Text>
                    <TouchableOpacity style={styles.homeButton} onPress={() => router.replace('/')}>
                        <Text style={styles.homeButtonText}>Go to Home</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const renderCartItem = ({ item }: { item: CartItemFE }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.productName}>{item.product.name}</Text>
                <Text style={styles.productPrice}>${item.product.currentPrice}</Text>
            </View>
            <View style={styles.cardFooter}>
                <Text style={styles.quantityText}>Qty: {item.quantity}</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.mainContainer}>
            <Navbar />
            <View style={styles.contentContainer}>
                
                {/* Header Section */}
                <View style={styles.header}>
                    <Text style={styles.successTitle}>Payment Successful!</Text>
                    <Text style={styles.successSubtitle}>Thank you for your purchase.</Text>
                </View>

                {/* Total Paid Section */}
                <View style={styles.totalContainer}>
                    <Text style={styles.totalLabel}>Total Paid:</Text>
                    <Text style={styles.totalAmount}>${orderDetails.totalPaid}</Text>
                </View>

                {/* Items List */}
                <Text style={styles.sectionTitle}>Order Summary</Text>
                <FlatList
                    data={orderDetails.cartItems}
                    keyExtractor={(item) => item.cartItemId}
                    renderItem={renderCartItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />

                {/* Action Button */}
                <TouchableOpacity style={styles.homeButton} onPress={() => navigateWithWipe("/")}>
                    <Text style={styles.homeButtonText}>Continue Shopping</Text>
                </TouchableOpacity>

            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: Colors.light.mainBackground || '#F5F7FA', // Fallback color added
    },
    contentContainer: {
        flex: 1,
        width: '100%',
        maxWidth: 800, // Web-friendly constraint
        alignSelf: 'center',
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginVertical: 24,
    },
    successTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2E7D32', // A pleasant success green
        marginBottom: 8,
    },
    successSubtitle: {
        fontSize: 16,
        color: '#555',
    },
    totalContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    totalAmount: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#000',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    listContent: {
        paddingBottom: 20,
    },
    card: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    productName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        flex: 1,
        marginRight: 10,
    },
    productPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
    },
    quantityText: {
        fontSize: 14,
        color: '#666',
    },
    homeButton: {
        backgroundColor: '#007BFF', // Replace with your theme's primary color
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 20,
    },
    homeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    errorText: {
        fontSize: 18,
        color: '#D32F2F',
        textAlign: 'center',
        marginTop: 40,
        marginBottom: 20,
    }
});