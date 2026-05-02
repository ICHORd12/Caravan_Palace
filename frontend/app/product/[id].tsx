import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import {
    Montserrat_400Regular,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    useFonts
} from '@expo-google-fonts/montserrat';

import Navbar from '@/components/Navbar/Navbar';
import WrappedGeneralButton from '@/components/Buttons/GeneralButtonWithWrapper/GeneralButtonWithWrapper';

import { API_BASE_URL, GET_BACKEND_CART, UPDATE_QUANTITY_END_POINT } from '@/constants/API';
import { Caravan, GetBackendCartResponse } from '@/models/BACKEND_MODELS';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import getLocalCartMap from '@/functions/getLocalCartMap';

export default function ProductDetailView() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { token, isAuthenticated } = useAuth();
    const { showToast } = useToast();

    const [product, setProduct] = useState<Caravan | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdatingCart, setIsUpdatingCart] = useState(false);

    // Cart tracking for this specific item
    const [cartQuantity, setCartQuantity] = useState(0);

    let [fontsLoaded] = useFonts({
        Montserrat_700Bold,
        Montserrat_400Regular,
        Montserrat_600SemiBold,
    });

    const productId = Array.isArray(id) ? id[0] : id;

    // Fetch Product Details
    useEffect(() => {
        if (!productId) return;

        const fetchProduct = async () => {
            setIsLoading(true);
            try {
                const headers: Record<string, string> = {
                    'Content-Type': 'application/json'
                };
                if (isAuthenticated && token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                const response = await fetch(`${API_BASE_URL}/api/v3/products/${productId}/details`, {
                    method: 'GET',
                    headers
                });

                if (response.ok) {
                    const data = await response.json();
                    setProduct(data.product);
                } else {
                    showToast('Failed to load product details.', 'error');
                }
            } catch (err) {
                console.error(err);
                showToast('Network error while fetching details.', 'error');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProduct();
    }, [productId, isAuthenticated, token]);

    // Fetch Cart Quantity
    useEffect(() => {
        if (!productId) return;

        const fetchCart = async () => {
            if (isAuthenticated && token) {
                try {
                    const response = await fetch(`${API_BASE_URL}${GET_BACKEND_CART}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    if (response.ok) {
                        const data: GetBackendCartResponse = await response.json();
                        const item = data.items.find(i => i.productId === productId);
                        setCartQuantity(item ? item.quantity : 0);
                    }
                } catch (err) {
                    console.error("Cart fetch error:", err);
                }
            } else {
                const localMap = getLocalCartMap();
                setCartQuantity(localMap[productId] || 0);
            }
        };

        fetchCart();
    }, [productId, isAuthenticated, token]);

    // Add to Cart
    const handleAddToCart = async () => {
        if (!product) return;

        setIsUpdatingCart(true);
        const targetQuantity = cartQuantity + 1;

        if (targetQuantity > product.quantityInStocks) {
            showToast('There is not enough stock!', 'error');
            setIsUpdatingCart(false);
            return;
        }

        if (isAuthenticated) {
            try {
                const response = await fetch(`${API_BASE_URL}${UPDATE_QUANTITY_END_POINT}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ productId: product.productId, quantity: targetQuantity })
                });

                if (response.ok) {
                    setCartQuantity(targetQuantity);
                    showToast('Added to cart!', 'success');
                } else {
                    const resData = await response.json();
                    showToast(resData.message || 'Failed to update cart', 'error');
                }
            } catch (err) {
                showToast('Error adding to cart', 'error');
            }
        } else {
            // Not authenticated local storage
            if (Platform.OS === 'web') {
                window.localStorage.setItem(`cart_${product.productId}`, targetQuantity.toString());
            }
            setCartQuantity(targetQuantity);
            showToast('Added to cart!', 'success');
        }
        setIsUpdatingCart(false);
    };

    if (!fontsLoaded) return null;

    return (
        <View style={styles.mainContainer}>
            <Navbar />
            {isLoading ? (
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color="#283618" />
                </View>
            ) : !product ? (
                <View style={styles.centerBox}>
                    <Text style={styles.errorText}>Product not found.</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <WrappedGeneralButton
                        title="← Back to Shop"
                        onPress={() => router.back()}
                        wrapperStyles={styles.backBtnWrapper}
                        textStyles={styles.backBtnText}
                    />

                    <View style={styles.detailContainer}>
                        { }
                        <View style={styles.imagePlaceholder}>
                            { }
                        </View>

                        {/* Product Info */}
                        <View style={styles.infoArea}>
                            <Text style={styles.productName}>{product.name}</Text>
                            <Text style={styles.productModel}>Model: {product.model || 'Unknown'}</Text>

                            {/* Price Area */}
                            {product.discountRate > 0 ? (
                                <View style={styles.priceRow}>
                                    <Text style={styles.basePrice}>${product.basePrice}</Text>
                                    <Text style={styles.productPrice}>${product.currentPrice}</Text>
                                    <View style={styles.discountBadge}>
                                        <Text style={styles.discountText}>-{product.discountRate}%</Text>
                                    </View>
                                </View>
                            ) : (
                                <Text style={styles.productPrice}>${product.currentPrice}</Text>
                            )}

                            {product.quantityInStocks <= 0 ? (
                                <View style={styles.outOfStockBadge}>
                                    <Text style={styles.outOfStockText}>OUT OF STOCK</Text>
                                </View>
                            ) : (
                                <Text style={styles.inStockText}>In Stock: {product.quantityInStocks}</Text>
                            )}

                            <Text style={styles.descriptionTitle}>Description</Text>
                            <Text style={styles.descriptionText}>{product.description || 'No description available.'}</Text>

                            <Text style={styles.descriptionTitle}>Specifications</Text>
                            <View style={styles.specsGrid}>
                                <View style={styles.specBox}>
                                    <Text style={styles.specLabel}>Fuel Type</Text>
                                    <Text style={styles.specValue}>{product.fuelType}</Text>
                                </View>
                                <View style={styles.specBox}>
                                    <Text style={styles.specLabel}>Weight</Text>
                                    <Text style={styles.specValue}>{product.weightKg} kg</Text>
                                </View>
                                <View style={styles.specBox}>
                                    <Text style={styles.specLabel}>Berths</Text>
                                    <Text style={styles.specValue}>{product.berthCount}</Text>
                                </View>
                                <View style={styles.specBox}>
                                    <Text style={styles.specLabel}>Kitchen</Text>
                                    <Text style={styles.specValue}>{product.hasKitchen ? 'Yes' : 'No'}</Text>
                                </View>
                                <View style={styles.specBox}>
                                    <Text style={styles.specLabel}>Warranty</Text>
                                    <Text style={styles.specValue}>{product.warrantyStatus}</Text>
                                </View>
                            </View>

                            <View style={styles.actionArea}>
                                <WrappedGeneralButton
                                    title={cartQuantity > 0 ? `Add Another (In Cart: ${cartQuantity})` : "Add to Cart"}
                                    onPress={handleAddToCart}
                                    disabled={product.quantityInStocks <= 0 || isUpdatingCart || cartQuantity >= product.quantityInStocks}
                                    wrapperStyles={[
                                        styles.addToCartWrapper,
                                        (product.quantityInStocks <= 0 || cartQuantity >= product.quantityInStocks) ? styles.disabledWrapper : undefined
                                    ]}
                                    textStyles={styles.addToCartText}
                                />
                            </View>
                        </View>
                    </View>
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#d6cba6',
    },
    centerBox: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    errorText: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 24,
        color: '#c1121f'
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 50,
    },
    backBtnWrapper: {
        alignSelf: 'flex-start',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#283618',
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 8,
        marginBottom: 20,
        // @ts-ignore
        ...(Platform.OS === 'web' && { cursor: 'pointer' }),
    },
    backBtnText: {
        fontFamily: 'Montserrat_600SemiBold',
        color: '#283618',
        fontSize: 14,
    },
    detailContainer: {
        flexDirection: Platform.OS === 'web' ? 'row' : 'column',
        backgroundColor: '#fefae0',
        borderRadius: 15,
        overflow: 'hidden',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        elevation: 3,
    },
    imagePlaceholder: {
        flex: 1,
        backgroundColor: '#a3895f',
        minHeight: 400,
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: Platform.OS === 'web' ? 1 : 0,
        borderBottomWidth: Platform.OS === 'web' ? 0 : 1,
        borderColor: '#ccc',
    },
    infoArea: {
        flex: 1,
        padding: 30,
    },
    productName: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 32,
        color: '#283618',
        marginBottom: 5,
    },
    productModel: {
        fontFamily: 'Montserrat_400Regular',
        fontSize: 16,
        color: '#606c38',
        marginBottom: 15,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 15,
        flexWrap: 'wrap',
    },
    basePrice: {
        fontFamily: 'Montserrat_600SemiBold',
        fontSize: 20,
        color: '#9ca3af',
        textDecorationLine: 'line-through',
    },
    productPrice: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 28,
        color: '#bc4749',
        marginBottom: 20,
    },
    discountBadge: {
        backgroundColor: '#bc4749',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 5,
    },
    discountText: {
        fontFamily: 'Montserrat_700Bold',
        color: '#fff',
        fontSize: 14,
    },
    outOfStockBadge: {
        backgroundColor: '#c1121f',
        alignSelf: 'flex-start',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 5,
        marginBottom: 20,
    },
    outOfStockText: {
        fontFamily: 'Montserrat_700Bold',
        color: '#fff',
        fontSize: 16,
    },
    inStockText: {
        fontFamily: 'Montserrat_600SemiBold',
        color: '#283618',
        fontSize: 16,
        marginBottom: 20,
    },
    descriptionTitle: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 20,
        color: '#283618',
        marginTop: 10,
        marginBottom: 10,
    },
    descriptionText: {
        fontFamily: 'Montserrat_400Regular',
        fontSize: 16,
        color: '#333',
        lineHeight: 24,
        marginBottom: 20,
    },
    specsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 15,
        marginBottom: 30,
    },
    specBox: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        minWidth: 120,
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        elevation: 2,
    },
    specLabel: {
        fontFamily: 'Montserrat_400Regular',
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    specValue: {
        fontFamily: 'Montserrat_600SemiBold',
        fontSize: 16,
        color: '#283618',
    },
    actionArea: {
        marginTop: 20,
        borderTopWidth: 1,
        borderColor: '#eee',
        paddingTop: 20,
    },
    addToCartWrapper: {
        backgroundColor: '#283618',
        borderRadius: 8,
        paddingVertical: 15,
        alignItems: 'center',
        // @ts-ignore
        ...(Platform.OS === 'web' && { cursor: 'pointer' }),
    },
    disabledWrapper: {
        backgroundColor: '#9ca3af',
        // @ts-ignore
        ...(Platform.OS === 'web' && { cursor: 'not-allowed' }),
    },
    addToCartText: {
        fontFamily: 'Montserrat_700Bold',
        color: '#fefae0',
        fontSize: 18,
    }
});
