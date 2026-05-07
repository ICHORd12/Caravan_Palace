import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform, Alert } from "react-native";
import Navbar from "@/components/Navbar/Navbar";
import { Colors } from '@/constants/theme';
import { useRoutePayload } from "@/context/RoutePayloadPassing"; 
import { useTransition } from "@/context/TransitionContext";
import { router } from "expo-router"; 

import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL, INVOICE_API_END_POINT } from '@/constants/API';

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

type PaymentSuccessPayload = {
    cartItems: CartItemFE[];
    totalPaid: number | string;
    orderId: string; 
};

export default function PaymentSuccessfulPage() {
    const { routePayload, clearRoutePayload } = useRoutePayload();
    const { revealWipe, navigateWithWipe } = useTransition();
    
    const { token } = useAuth();
    const [isEmailing, setIsEmailing] = useState(false);

    useEffect(() => {
        revealWipe();
        
        return () => {
            clearRoutePayload();
        };
    }, [revealWipe, clearRoutePayload]);

    const orderDetails = routePayload as PaymentSuccessPayload | null;

    const handleEmailInvoice = async () => {
        if (!orderDetails?.orderId) return;
        try {
            setIsEmailing(true);
            const response = await fetch(`${API_BASE_URL}${INVOICE_API_END_POINT}/${orderDetails.orderId}/email`, {
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
        if (!orderDetails?.orderId) return;
        try {
            if (Platform.OS !== 'web') {
                Alert.alert('Notice', 'PDF downloads on mobile require Expo FileSystem. Try this on web!');
                return;
            }

            const response = await fetch(`${API_BASE_URL}${INVOICE_API_END_POINT}/${orderDetails.orderId}/pdf`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to download PDF');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice-order-${orderDetails.orderId}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error("Error downloading PDF:", error);
            if (Platform.OS === 'web') window.alert('Failed to download PDF.');
        }
    };

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
                
                <View style={styles.header}>
                    <Text style={styles.successTitle}>Payment Successful!</Text>
                    <Text style={styles.successSubtitle}>Thank you for your purchase.</Text>
                </View>

              
                {orderDetails.orderId && (
                    <View style={styles.invoiceButtonRow}>
                        <TouchableOpacity 
                            style={styles.actionButton} 
                            onPress={() => router.push(`/invoice/${orderDetails.orderId}`)}
                        >
                            <Text style={styles.actionButtonText}>📄 View Invoice</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={[styles.actionButton, { backgroundColor: '#bc4749' }]} 
                            onPress={handleDownloadPDF}
                        >
                            <Text style={styles.actionButtonText}>⬇️ Download PDF</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.actionButton, { backgroundColor: '#5b0f79' }]} 
                            onPress={handleEmailInvoice}
                            disabled={isEmailing}
                        >
                            <Text style={styles.actionButtonText}>{isEmailing ? "Sending..." : "✉️ Email PDF"}</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.totalContainer}>
                    <Text style={styles.totalLabel}>Total Paid:</Text>
                    <Text style={styles.totalAmount}>${orderDetails.totalPaid}</Text>
                </View>

                <Text style={styles.sectionTitle}>Order Summary</Text>
                <FlatList
                    data={orderDetails.cartItems}
                    keyExtractor={(item) => item.cartItemId}
                    renderItem={renderCartItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />

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
        backgroundColor: Colors.light.mainBackground || '#F5F7FA', 
    },
    contentContainer: {
        flex: 1,
        width: '100%',
        maxWidth: 800, 
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
        color: '#2E7D32', 
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
        backgroundColor: '#007BFF', 
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
    },
    // --- NEW INVOICE BUTTON STYLES ---
    invoiceButtonRow: { 
        flexDirection: 'row', 
        gap: 10, 
        marginBottom: 20 
    },
    actionButton: { 
        backgroundColor: '#283618', 
        paddingVertical: 12, 
        paddingHorizontal: 10, 
        borderRadius: 8, 
        alignItems: 'center', 
        flex: 1 
    },
    actionButtonText: { 
        fontWeight: 'bold', 
        fontSize: 14, 
        color: '#fff' 
    }
});