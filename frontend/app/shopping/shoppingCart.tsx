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

import { Caravan, CartItem } from '@/constants/BACKEND_MODELS';
import { useToast } from '@/context/ToastContext';
import { useTransition } from '@/context/TransitionContext';
import { FetchProductDetailsResponse, MergeBackendCartResponse } from '@/constants/BACKEND_MODELS';
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
    async function apiFetchProductDetails(items: { id: string, quantity: number }[]): Promise<Caravan[]> 
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

            let result: FetchProductDetailsResponse = {message: "", products: []}
            if (!response.ok)
            {
                showToast('Failed to fetch product details', 'error')
            }
            else
            {
                result = await response.json();
            }
            
            return result.products;

        } catch (error) {
            showToast('Failed to fetch product details', 'error')
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

            let result: MergeBackendCartResponse = {message: "", items: [], adjustments: []};
            if (!response.ok) 
            {
                showToast("Failed to merge backend cart", 'error');
            }
            else
            {
                result = await response.json();
            }

            return result.items;

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

            let result: boolean = false;
            if (!response.ok)
            {
                showToast("An Error Occured While Updating Item Quantity", 'error');
            }
            else
            {
                result = true;
            }

            return result;

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

            let result: boolean = false;
            if (!response.ok)
            {
                showToast("An Error Occured While Deleting Card Item", 'error');
            }
            else
            {
                result = true;
            }

            return result;

        } catch (error) {
            console.error("Error deleting item:", error);
            return false;
        }
    }
    //#endregion

    //#region HELPER FUNCTIONS
    async function clearLocalCart() 
    {
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

    function mapCaravansToCartItems(
        caravans: Caravan[], 
        localItemsData: { id: string, quantity: number }[]
    ): CartItem[] {
        return caravans.map(caravan => {
            // Find the matching local item to get the saved quantity
            const localData = localItemsData.find(item => item.id === caravan.productId);
            
            // Fallback to 1 if something goes wrong and it isn't found
            const quantity = localData ? localData.quantity : 1;

            return {
                // Generate a temporary mock ID for the cart item since it's local
                cartItemId: `local_cart_${caravan.productId}`, 
                userId: "guest", // Placeholder since there is no logged-in user
                productId: caravan.productId,
                quantity: quantity,
                addedAt: new Date().toISOString(), // Current timestamp
                product: {
                    name: caravan.name,
                    currentPrice: caravan.currentPrice,
                    quantityInStocks: caravan.quantityInStocks
                }
            };
        });
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
                const localCartCaravans = localItemsData.length > 0 ? await apiFetchProductDetails(localItemsData) : [];

                const formattedCartItems = mapCaravansToCartItems(localCartCaravans, localItemsData);

                setCartItems(formattedCartItems);
            } 
            else 
            {
                // Authenticated: Directly merge raw local items with backend
                const backendCart = await apiMergeBackendCart(localItemsData, token!);
                setCartItems(backendCart); 
                
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


    async function updateQuantity(id: string, delta: 1 | -1) 
    {

        const currentItem = cartItems.find(item => item.productId === id);
        if (!currentItem) return;

        const originalQuantity = currentItem.quantity;
        const newQuantity = Math.max(1, originalQuantity + delta);

        if (originalQuantity === newQuantity) return;

        // Optimistic UI update
        setCartItems(prevCart => 
            prevCart.map(item => 
                item.productId === id 
                    ? { ...item, quantity: newQuantity } 
                    : item
            )
        );


        let token: string | null = null;
        if (Platform.OS === 'web') 
        {
            token = window.localStorage.getItem('userToken');
        } 
        else 
        {
            token = await SecureStore.getItemAsync('userToken');
        }

        let isSuccess = false;
        if (token) 
        {
            isSuccess = await apiUpdateQuantity({ id, quantity: newQuantity }, token);

            if (!isSuccess) 
            {
                showToast('Failed to update quantity', 'error');
                
                // Revert using the exact original quantity, not a backward calculation
                setCartItems(prevCart => 
                    prevCart.map(item => 
                        item.productId === id 
                            ? { ...item, quantity: originalQuantity } 
                            : item
                    )
                );
            } 
        }
        else
        {
            if (Platform.OS === 'web') 
            {
                window.localStorage.setItem(`cart_${id}`, newQuantity.toString());
            }
        }
    };

    async function removeItem(id: string) 
    {
        const itemIndex = cartItems.findIndex(item => item.productId === id);
        if (itemIndex === -1) return;
        
        const itemToRemove = cartItems[itemIndex];

        // Optimistic UI Update 
        setCartItems(prevCart => prevCart.filter(item => item.productId !== id));

        let token: string | null = null;
        if (Platform.OS === 'web') 
        {
            token = window.localStorage.getItem('userToken');
        } 
        else 
        {
            token = await SecureStore.getItemAsync('userToken');
        }

        let isSuccess = false;

        if (token) 
        {
            isSuccess = await apiDeleteItem({ id }, token);

            if (!isSuccess) 
            {
                showToast('Failed to remove item', 'error');
                
                // Safe Revert: Insert the item back exactly where it was
                setCartItems(prevCart => {
                    const restoredCart = [...prevCart];
                    restoredCart.splice(itemIndex, 0, itemToRemove);
                    return restoredCart;
                });
                
                return; 
            }
        }
        else
        {
            // Local Storage Update
            if (Platform.OS === 'web' && (!token || isSuccess)) 
            {
                window.localStorage.removeItem(`cart_${id}`);
            }
        }

        showToast('Item removed', 'success');
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
    }, [fontsLoaded, isLoading, revealWipe]);

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

                            <View style={[styles.summaryRow, styles.totalRow]}>
                                <Text style={styles.totalLabel}>Total</Text>
                                <Text style={styles.totalValue}>${(cartTotal).toFixed(2)}</Text>
                            </View>

                            <TouchableOpacity
                                style={styles.checkoutButton}
                                onPress={() => {
                                    if (!isAuthenticated) {
                                        router.push('/login');
                                    } else {
                                        showToast('Proceeding to payment...', 'success');
                                        // Navigate to payment screen
                                    }
                                }}
                            >
                                <Text style={styles.checkoutButtonText}>
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
        marginBottom: 20,
        fontFamily: 'Montserrat_700Bold',
        fontSize: 28,
        color: '#283618',
    },
    emptyCartText: {
        textAlign: 'center',
        marginTop: 40,
        fontFamily: 'Montserrat_600SemiBold',
        fontSize: 16,
        color: '#606c38',
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
        height: 40,
        backgroundColor: '#e9e5d3',
        borderRadius: 8,
        paddingHorizontal: 5,
    },
    qtyBtn: {
        paddingVertical: 5,
        paddingHorizontal: 12,
    },
    qtyBtnText: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 18,
        color: '#283618',
    },
    qtyText: {
        textAlign: 'center',
        minWidth: 20,
        fontFamily: 'Montserrat_600SemiBold',
        fontSize: 16,
        color: '#283618',
    },

    /* SUMMARY SECTION */
    summaryContainer: {
        backgroundColor: '#fefae0',
        borderRadius: 12,
        padding: 20,
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
        borderTopColor: '#d6cba6',
        borderTopWidth: 1,
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
    checkoutButton: {
        alignItems: 'center',
        backgroundColor: '#283618',
        borderRadius: 8,
        padding: 15,
        marginTop: 20,
    },
    checkoutButtonText: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 18,
        color: '#fefae0',
    },
});
//#endregion