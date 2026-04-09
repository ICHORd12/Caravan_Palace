//#region IMPORTS
import { useFocusEffect, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import {
    Montserrat_400Regular,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    useFonts
} from '@expo-google-fonts/montserrat';

import Navbar from '@/components/Navbar/Navbar';

import {
    API_BASE_URL,
    DELETE_ITEM_END_POINT,
    FETCH_PRODUCTS_DETAILS_END_POINT,
    MERGE_BACKEND_CART_END_POINT,
    UPDATE_QUANTITY_END_POINT
} from '@/constants/API';
import { CartItem } from '@/constants/BACKEND_MODELS';
import { useToast } from '@/context/ToastContext';
import { useTransition } from '@/context/TransitionContext';
//#endregion

export default function ShoppingCart() {
    const { showToast } = useToast();
    const { revealWipe } = useTransition();
    const router = useRouter();

    // State
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    let [fontsLoaded] = useFonts({
        Montserrat_700Bold,
        Montserrat_400Regular,
        Montserrat_600SemiBold,
    });

    //#region API FUNCTIONS 
    async function apiFetchProductDetails(items: { id: string, quantity: number }[]): Promise<CartItem[]> 
    {
        if (items.length === 0) return [];
        
        // Extract IDs as an array for the request body
        const ids = items.map(item => item.id);
        
        try {
            const response = await fetch(`${API_BASE_URL}${FETCH_PRODUCTS_DETAILS_END_POINT}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ productIds: ids }) 
            });

            if (!response.ok) throw new Error('Failed to fetch product details');
            
            const products = await response.json();
            
            console.log("Fetch Product Details: ", products)

            // Map the products into cart model
            return []

        } catch (error) {
            console.error("Error fetching product details:", error);
            return [];
        }
    };

    async function apiMergeBackendCart(localItems: { id: string, quantity: number }[], token: string): Promise<CartItem[]> 
    {
        try {
            
            const payload = localItems.map(item => ({ 
                productId: item.id, 
                quantity: item.quantity 
            }));

            const response = await fetch(`${API_BASE_URL}${MERGE_BACKEND_CART_END_POINT}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                
                body: JSON.stringify({ items: payload.length > 0 ? payload : [] })
            });

            if (!response.ok) throw new Error('Failed to merge backend cart');
            
            const products = await response.json();
            console.log("Merge Backend", products)

            return products.items 

        } catch (error) {
            console.error("Error merging cart:", error);
            return [];
        }
    };

    async function apiUpdateQuantity(item: { id: string,  quantity: number }, token: string): Promise<boolean>
    {
        try {
            const response = await fetch(`${API_BASE_URL}${UPDATE_QUANTITY_END_POINT}/${item.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                // This payload correctly sends the final absolute value (e.g., 5 instead of +1)
                body: JSON.stringify({ quantity: item.quantity })
            });
            return response.ok;
        } catch (error) {
            console.error("Error updating quantity:", error);
            return false;
        }
    }

    async function apiDeleteItem(item: {id: string}, token: string): Promise<boolean>
    {
        try {
            const response = await fetch(`${API_BASE_URL}${DELETE_ITEM_END_POINT}/${item.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.ok;
        } catch (error) {
            console.error("Error deleting item:", error);
            return false;
        }
    }
    //#endregion

    //#region HELPER FUNCTIONS
    async function clearLocalCart() {
        if (Platform.OS === 'web') {
            // Collect keys first to avoid mutation bugs during iteration
            const keysToRemove: string[] = [];
            for (let i = 0; i < window.localStorage.length; i++) {
                const key = window.localStorage.key(i);
                if (key && key.startsWith('cart_')) {
                    keysToRemove.push(key);
                }
            }
            // Remove them all
            keysToRemove.forEach(key => window.localStorage.removeItem(key));
        } else {
            // If you decide to support local carts for mobile via SecureStore later,
            // the deletion logic would go here!
        }
    }
    //#endregion

    const initializeCart = useCallback(async () => {
        setIsLoading(true);
        try {
            // Check Auth Status
            let token = null;
            if (Platform.OS === 'web') 
            {
                token = window.localStorage.getItem('userToken');
            } 
            else 
            {
                token = await SecureStore.getItemAsync('userToken');
            }

            const isAuth = !!token;
            setIsAuthenticated(isAuth);

            // Get Local Cart Items
            let localItemsData: { id: string, quantity: number }[] = [];
            if (Platform.OS === 'web') 
            {
                for (let i = 0; i < window.localStorage.length; i++) 
                {
                    const key = window.localStorage.key(i);
                    if (key && key.startsWith('cart_')) 
                    {
                        const productId = key.replace('cart_', '');
                        const quantity = parseInt(window.localStorage.getItem(key) || '0', 10);
                        if (quantity > 0) localItemsData.push({ id: productId, quantity });
                    }
                }
            }

            if (!isAuth) 
            {
                // Guest: Fetch product details for the local items
                const localCart = localItemsData.length > 0 ? await apiFetchProductDetails(localItemsData) : [];
                setCartItems(localCart);
            } 
            else 
            {
                // Authenticated: Directly merge raw local items with backend
                const backendCart = await apiMergeBackendCart(localItemsData, token!);
                setCartItems(backendCart); 
                
                // NEW: Clear the local storage items so they don't get merged repeatedly
                if (localItemsData.length > 0) {
                    await clearLocalCart();
                }
            }
        } catch (error) {
            showToast('Error loading cart', 'error');
        } finally {
            setIsLoading(false);
        }
    }, []);

    async function updateQuantity (id: string, delta: number)
    {
        const itemIndex = cartItems.findIndex(item => item.productId === id);
        if (itemIndex === -1) return;

        const currentItem = cartItems[itemIndex];
        
        // This calculates the final value (e.g., 4 + 1 = 5) which the backend expects
        const newQuantity = Math.max(1, currentItem.quantity + delta);

        if (newQuantity === currentItem.quantity) return; // Ignore if trying to go below 1

        // Optimistic UI Update
        const updatedCart = [...cartItems];
        updatedCart[itemIndex].quantity = newQuantity;
        setCartItems(updatedCart);

        // Fetch token based on platform
        let token = Platform.OS === 'web' 
            ? window.localStorage.getItem('userToken') 
            : await SecureStore.getItemAsync('userToken');

        if (!token) 
        {
            // Logged out: update locally
            if (Platform.OS === 'web') {
                window.localStorage.setItem(`cart_${id}`, newQuantity.toString());
            }
        } 
        else 
        {
            // Logged in: update backend with the absolute new value
            const success = await apiUpdateQuantity({ id, quantity: newQuantity }, token);
            if (!success) {
                showToast('Failed to update quantity', 'error');
                setCartItems(cartItems); // Revert optimistic update
            }
        }
    };

    async function removeItem (id: string) 
    {
        // Optimistic UI Update
        const previousCart = [...cartItems];
        const updatedCart = cartItems.filter(item => item.productId !== id);
        setCartItems(updatedCart);

        // Fetch token based on platform
        let token = Platform.OS === 'web' 
            ? window.localStorage.getItem('userToken') 
            : await SecureStore.getItemAsync('userToken');

        if (!token) 
        {
            // Logged out: remove locally
            if (Platform.OS === 'web') {
                window.localStorage.removeItem(`cart_${id}`);
            }
            showToast('Item removed', 'success');
        } 
        else 
        {
            // Logged in: send delete request to backend
            const success = await apiDeleteItem({ id }, token);
            if (success) {
                showToast('Item removed', 'success');
            } else {
                showToast('Failed to remove item', 'error');
                setCartItems(previousCart); // Revert optimistic update
            }
        }
    };

    function calculateTotal () 
    {
        return cartItems.reduce((total, item) => total + (parseFloat(item.product.currentPrice as any) * item.quantity), 0);
    };

    useFocusEffect(
        useCallback(() => {
            initializeCart();
        }, [initializeCart])
    );

    useEffect(() => {
        if (fontsLoaded) {
            revealWipe();
        }
    }, [fontsLoaded, revealWipe]);

    //#region COMPONENT
    const renderCartItem = ({ item }: { item: CartItem }) => (
        <View style={styles.cartCard}>
            
            <View style={styles.itemDetails}>
                <Text style={styles.itemName} numberOfLines={2}>{item.product.name}</Text>
                <Text style={styles.itemPrice}>${item.product.currentPrice}</Text>

                <TouchableOpacity onPress={() => removeItem(item.productId)}>
                    <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>

            </View>

            <View style={styles.quantityContainer}>

                <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.productId, -1)}>
                    <Text style={styles.qtyBtnText}>-</Text>
                </TouchableOpacity>

                <Text style={styles.qtyText}>{item.quantity}</Text>

                <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.productId, 1)}>
                    <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>

            </View>
        </View>
    );
    //#endregion


    if (!fontsLoaded || isLoading) return null;
    const cartTotal = calculateTotal();


    return (
        <View style={styles.mainContainer}>
            <Navbar />

            <View style={styles.contentContainer}>

                <Text style={styles.pageTitle}>Your Cart</Text>

                {cartItems.length === 0 ? (
                    <Text style={styles.emptyCartText}>Your cart is currently empty.</Text>
                ) : (
                    <>
                        <FlatList
                            data={cartItems}
                            keyExtractor={(item) => item.productId}
                            renderItem={renderCartItem}
                            contentContainerStyle={styles.listContainer}
                            showsVerticalScrollIndicator={false}
                        />

                        <View style={styles.summaryContainer}>

                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Subtotal</Text>
                                <Text style={styles.summaryValue}>${cartTotal.toFixed(2)}</Text>
                            </View>

                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Taxes (10%)</Text>
                                <Text style={styles.summaryValue}>${(cartTotal * 0.10).toFixed(2)}</Text>
                            </View>

                            <View style={[styles.summaryRow, styles.totalRow]}>
                                <Text style={styles.totalLabel}>Total</Text>
                                <Text style={styles.totalValue}>${(cartTotal * 1.10).toFixed(2)}</Text>
                            </View>

                            <TouchableOpacity
                                style={styles.checkoutBtn}
                                onPress={() => {
                                    if (!isAuthenticated) {
                                        router.push('/login');
                                    } else {
                                        showToast('Proceeding to payment...', 'success');
                                        // Navigate to payment screen
                                    }
                                }}
                            >
                                <Text style={styles.checkoutBtnText}>
                                    {isAuthenticated ? "Checkout" : "Login To Continue"}
                                </Text>

                            </TouchableOpacity>

                        </View>
                    </>
                )}
            </View>

        </View>
    );
}

//#region STYLES
const styles = StyleSheet.create({
    /* LAYOUTS */
    mainContainer: {
        flex: 1,
        backgroundColor: '#d6cba6'
    },
    contentContainer: {
        flex: 1,
        padding: 20,
        maxWidth: 800,
        width: '100%',
        alignSelf: 'center',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    /* TYPOGRAPHY */
    pageTitle: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 28,
        color: '#283618',
        marginBottom: 20,
    },
    emptyCartText: {
        fontFamily: 'Montserrat_600SemiBold',
        fontSize: 16,
        color: '#606c38',
        textAlign: 'center',
        marginTop: 40,
    },

    /* CART ITEM CARD */
    listContainer: {
        paddingBottom: 20,
    },
    cartCard: {
        flexDirection: 'row',
        backgroundColor: '#fefae0',
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
        alignItems: 'center',
    },
    itemImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: '#e9e5d3',
    },
    itemDetails: {
        flex: 1,
        marginLeft: 15,
        justifyContent: 'space-between',
        height: 80,
    },
    itemName: {
        fontFamily: 'Montserrat_600SemiBold',
        fontSize: 16,
        color: '#283618',
    },
    itemPrice: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 16,
        color: '#bc4749',
    },
    removeText: {
        fontFamily: 'Montserrat_400Regular',
        fontSize: 13,
        color: '#666',
        textDecorationLine: 'underline',
    },

    /* QUANTITY CONTROLS */
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e9e5d3',
        borderRadius: 8,
        paddingHorizontal: 5,
        height: 40,
    },
    qtyBtn: {
        paddingHorizontal: 12,
        paddingVertical: 5,
    },
    qtyBtnText: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 18,
        color: '#283618',
    },
    qtyText: {
        fontFamily: 'Montserrat_600SemiBold',
        fontSize: 16,
        color: '#283618',
        minWidth: 20,
        textAlign: 'center',
    },

    /* SUMMARY SECTION */
    summaryContainer: {
        backgroundColor: '#fefae0',
        padding: 20,
        borderRadius: 12,
        marginTop: 10,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    summaryLabel: {
        fontFamily: 'Montserrat_400Regular',
        fontSize: 16,
        color: '#606c38',
    },
    summaryValue: {
        fontFamily: 'Montserrat_600SemiBold',
        fontSize: 16,
        color: '#283618',
    },
    totalRow: {
        borderTopWidth: 1,
        borderTopColor: '#d6cba6',
        paddingTop: 15,
        marginTop: 5,
    },
    totalLabel: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 20,
        color: '#283618',
    },
    totalValue: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 20,
        color: '#bc4749',
    },
    checkoutBtn: {
        backgroundColor: '#283618',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    checkoutBtnText: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 18,
        color: '#fefae0',
    },

    /* MODAL STYLES */
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fefae0',
        padding: 25,
        borderRadius: 12,
        width: '100%',
        maxWidth: 400,
    },
    modalTitle: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 20,
        color: '#283618',
        marginBottom: 10,
        textAlign: 'center',
    },
    modalBody: {
        fontFamily: 'Montserrat_400Regular',
        fontSize: 14,
        color: '#606c38',
        marginBottom: 20,
        textAlign: 'center',
        lineHeight: 20,
    },
    modalBtnPrimary: {
        backgroundColor: '#283618',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
    },
    modalBtnTextPrimary: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 14,
        color: '#fefae0',
    },
    modalBtnSecondary: {
        backgroundColor: '#e9e5d3',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
    },
    modalBtnTextSecondary: {
        fontFamily: 'Montserrat_600SemiBold',
        fontSize: 14,
        color: '#283618',
    }
});
//#endregion