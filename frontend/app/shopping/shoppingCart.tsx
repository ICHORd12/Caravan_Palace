//#region IMPORTS
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import {
    Montserrat_400Regular,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    useFonts
} from '@expo-google-fonts/montserrat';

import Navbar from '@/components/Navbar/Navbar';
import ShopCard from '@/components/ShopCard/ShopCard';

import {
    API_BASE_URL,
    FETCH_PRODUCTS_DETAILS_END_POINT,
    GET_BACKEND_CART,
} from '@/constants/API';

import { Caravan, CartItem, GetBackendCartResponse } from '@/models/BACKEND_MODELS';
import { CartItemFE } from '@/models/FRONTEND_MODELS';
import { useToast } from '@/context/ToastContext';
import { useTransition } from '@/context/TransitionContext';
import { FetchProductDetailsResponse} from '@/models/BACKEND_MODELS';
import { useAuth } from '@/context/AuthContext'


import getLocalCartMap from '@/functions/getLocalCartMap';
import mapCaravansToCartItemFEs from '@/functions/mapCaravansToCartItemFEs';
import mapCartItemsToCartItemFEs from '@/functions/mapCartItemsToCartItemFEs';
import getLocalCartProductIds from '@/functions/getLocalCartProductIds';
//#endregion


//#region INPUT DEFINITIONS FOR TYPE HELP


export interface UpdateQuantityInput {
    productId: string;
    delta: number;
}

//#endregion


export default function ShoppingCart() {
    const router = useRouter();
    
    const { showToast } = useToast();
    const { revealWipe } = useTransition();
    const {token, isAuthenticated} = useAuth();
   
    // State
    const [cartItemFEs, setCartItemFEs] = useState<CartItemFE[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    let [fontsLoaded] = useFonts({
        Montserrat_700Bold,
        Montserrat_400Regular,
        Montserrat_600SemiBold,
    });

    //#region FETCH CART


    async function fetchCartNotAuth(): Promise<CartItemFE[]>
    {
        let cartItemFEs: CartItemFE[] = [];
        const productIds: string[] = getLocalCartProductIds();
        try {
            const response = await fetch(`${API_BASE_URL}${FETCH_PRODUCTS_DETAILS_END_POINT}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ productIds: productIds })
            });

            const responseData: FetchProductDetailsResponse = await response.json();
            if (response.ok)
            {
                const caravans: Caravan[] = responseData.products;
                const localCart: Record<string, number> = getLocalCartMap();
                cartItemFEs = mapCaravansToCartItemFEs(caravans, localCart);
            }
            else
            {
                showToast(`${responseData.message}`, 'error');
            }
        } catch(error) {
            showToast(`${error}`, 'error');
        } finally {
            return cartItemFEs;
        }
    }

    async function fetchCartAuth(): Promise<CartItemFE[]>
    {
        let cartItemFEs: CartItemFE[] = [];
        try {
            const response = await fetch(`${API_BASE_URL}${GET_BACKEND_CART}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const responseData = await response.json();
            if (response.ok)
            {
                cartItemFEs = mapCartItemsToCartItemFEs(responseData.items);
            }
            else
            {
                showToast(`${responseData.message}`, 'error');
            }
        } catch(error) {
            showToast(`${error}`, 'error');
        } finally {
            return cartItemFEs;
        }
    }


    async function fetchCart()
    {
        setIsLoading(true);

        if (!isAuthenticated)
        {
            const cartItemFEsPromise: Promise<CartItemFE[]> = fetchCartNotAuth();
            const cartItemFEs: CartItemFE[] = await cartItemFEsPromise;
            setCartItemFEs(cartItemFEs);
        }
        else
        {
            const cartItemFEsPromise: Promise<CartItemFE[]> = fetchCartAuth();
            const cartItemFEs: CartItemFE[] = await cartItemFEsPromise;
            setCartItemFEs(cartItemFEs);
        }

        setIsLoading(false);
    }

    //#endregion


    //#region UPDATE QUANTITY


    async function updateQuantityNotAuth({productId, delta}: UpdateQuantityInput)
    {
        const targetItem = cartItemFEs.find(item => item.productId === productId);
        const quantityInStocks: number = targetItem ? targetItem.product.quantityInStocks : 0;
        const currentQuantity: number = targetItem ? targetItem.quantity : 0;
        const targetQuantity: number = currentQuantity + delta;

        if (targetQuantity > quantityInStocks) 
        {
            showToast('There is not enough stock!', 'error');
            return;
        }

        if (Platform.OS === 'web') 
        {
            if (targetQuantity === 0) window.localStorage.removeItem(`cart_${productId}`);
            else window.localStorage.setItem(`cart_${productId}`, targetQuantity.toString());
        }

        if (targetQuantity === 0) 
        {
            setCartItemFEs(prev => prev.filter(item => item.productId !== productId));
        } 
        else 
        {
            setCartItemFEs(prev => 
                prev.map(item => 
                    item.productId === productId ? { ...item, quantity: targetQuantity } : item
                )
            );
        }
    }

    async function updateQuantityAuth({productId, delta}: UpdateQuantityInput)
    {
        // Need backend support
    }

    async function updateQuantity({productId, delta}: UpdateQuantityInput)
    {
        if (!isAuthenticated)   updateQuantityNotAuth({productId: productId, delta: delta});
        else                    updateQuantityAuth({productId: productId, delta: delta});
    }
    
    //#endregion

    

    // I will also add discount
    function calculateTotal () 
    {
        return cartItemFEs.reduce((total, item) => total + (parseFloat(item.product.currentPrice as any) * item.quantity), 0);
    };

    
    useFocusEffect(
        useCallback(() => {
            fetchCart();
        }, [isAuthenticated])
    );

    useEffect(() => {
        if (fontsLoaded && !isLoading) 
        {
            revealWipe();
        }
        
    }, [fontsLoaded, isLoading, revealWipe]);



    if (!fontsLoaded || isLoading) return null;
    const cartTotal = calculateTotal();

    return (
        <View style={styles.mainContainer}>
            <Navbar />

            <View style={styles.contentContainer}>
                <View>
                    <Text style={styles.pageTitle}>Your Cart</Text>

                    {cartItemFEs.length === 0 ? (
                        <Text style={styles.emptyCartText}>Your cart is currently empty.</Text>
                    ) : (
                        <>
                            <FlatList
                                data={cartItemFEs}
                                keyExtractor={(item) => item.productId}
                                renderItem={({ item }) => (
                                    <ShopCard 
                                        cartItem={item} 
                                        updateQuantity={updateQuantity} 
                                    />
                                )}
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

    listContainer: {

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