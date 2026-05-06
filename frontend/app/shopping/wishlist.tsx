import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useTransition } from '@/context/TransitionContext';
import { API_BASE_URL } from '@/constants/API';
import Navbar from '@/components/Navbar/Navbar';
import WrappedGeneralButton from '@/components/Buttons/GeneralButtonWithWrapper/GeneralButtonWithWrapper';

type ProductInfo = {
    name: string;
    model: string;
    currentPrice: string;
    basePrice: string;
    discountRate: number;
    quantityInStocks: number;
    imageUrl: string | null;
};

type WishlistItem = {
    wishlistId: string;
    productId: string;
    addedAt: string;
    product: ProductInfo;
};

export default function Wishlist() {
    const { token, isAuthenticated, isLoading } = useAuth();
    const { showToast } = useToast();
    const { revealWipe, navigateWithWipe } = useTransition();

    const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
    const [isFetching, setIsFetching] = useState(false);
    const [isWaitingResponse, setIsWaitingResponse] = useState(false);

    
    const fetchWishlistData = async () => {
        setIsFetching(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/v3/wishlist/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setWishlistItems(data.wishlist || []);
            } else {
                showToast('Failed to load wishlist', 'error');
            }
        } catch (error) {
            showToast('Network error loading wishlist', 'error');
        } finally {
            setIsFetching(false);
        }
    };

    const handleRemoveItem = async (productId: string) => {
        setIsWaitingResponse(true);
        
        // Optimistic UI update
        const previousItems = [...wishlistItems];
        setWishlistItems(prev => prev.filter(item => item.productId !== productId));

        try {
            const response = await fetch(`${API_BASE_URL}/api/v3/wishlist/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                showToast('Removed from wishlist', 'success');
            } else {
                // Revert on failure
                setWishlistItems(previousItems);
                showToast('Failed to remove item', 'error');
            }
        } catch (error) {
            setWishlistItems(previousItems);
            showToast('Network error removing item', 'error');
        } finally {
            setIsWaitingResponse(false);
        }
    };

    //#region EFFECTS

    useEffect(() => {
        if (isAuthenticated)
        {
            fetchWishlistData();
        }

    }, [isAuthenticated]);

    useFocusEffect(
        useCallback(() => {
            if (isLoading) return;
            if (!isAuthenticated) 
            {
                showToast("You need to log in to see your wish list", 'error');
                navigateWithWipe("/login");
                return;
            }
            else
            {
                if(!isFetching)
                {
                    revealWipe();
                }
            }
        }, [isAuthenticated, isLoading, isFetching])
    );
    //#endregion

    return (
        <View style={styles.mainContainer}>
            <Navbar />

            <ScrollView style={styles.contentContainer} contentContainerStyle={styles.scrollContent}>
                
                <View style={styles.titleContainer}>

                    <Text style={styles.titleText}>MY WISHLIST</Text>
                </View>

                <View style={styles.formContainer}>
                    <Text style={styles.sectionHeader}>Saved Products</Text>

                    {isFetching ? (
                        <ActivityIndicator size="large" color="#a94c0f" style={{ marginVertical: 20 }} />
                    ) : wishlistItems.length === 0 ? (
                        <Text style={styles.emptyText}>Your wishlist is currently empty.</Text>
                    ) : (
                        wishlistItems.map((item) => (
                            <View key={item.wishlistId} style={styles.itemCard}>
                                
                                {/* Render Image if available */}
                                {item.product.imageUrl && (
                                    <Image 
                                        source={{ uri: item.product.imageUrl }} 
                                        style={styles.productImage} 
                                        resizeMode="cover"
                                    />
                                )}
                                
                                <View style={styles.itemInfo}>
                                    <Text style={styles.itemTitle}>{item.product.name}</Text>
                                    <Text style={styles.itemSubtitle}>Model: {item.product.model}</Text>
                                    <View style={styles.priceContainer}>
                                        <Text style={styles.itemPrice}>${item.product.currentPrice}</Text>
                                        {item.product.discountRate > 0 && (
                                            <Text style={styles.basePrice}>${item.product.basePrice}</Text>
                                        )}
                                    </View>
                                    {item.product.quantityInStocks < 5 && (
                                        <Text style={styles.stockWarning}>
                                            Only {item.product.quantityInStocks} left in stock!
                                        </Text>
                                    )}
                                </View>

                                <View style={styles.itemActions}>
                                    <WrappedGeneralButton
                                        title="View"
                                        wrapperStyles={styles.smallButtonWrapper}
                                        textStyles={styles.smallButtonText}
                                        onPress={() => navigateWithWipe(`/product/${item.productId}`)}
                                        disabled={isLoading}
                                    />

                                    <TouchableOpacity
                                        style={[styles.iconButton, styles.iconButtonDelete]}
                                        onPress={() => handleRemoveItem(item.productId)}
                                        disabled={isLoading}
                                    >
                                        <Ionicons name="trash" size={18} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    )}
                </View>

            </ScrollView>
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
    },
    scrollContent: {
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    titleContainer: {
        
        
    },
    titleText: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 24,
        marginBottom: 20,
        color: '#222222',
    },
    formContainer: {
        width: '100%',
        maxWidth: 600, // Slightly widened to accommodate images better
        backgroundColor: 'rgba(159, 159, 159, 0.4)',
        borderRadius: 15,
        padding: 25,
        marginBottom: 30,
    },
    sectionHeader: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 20,
        color: '#222222',
        marginBottom: 20,
        textAlign: 'center',
    },
    emptyText: {
        fontFamily: 'Montserrat_400Regular',
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
        marginTop: 10,
        marginBottom: 20,
    },
    itemCard: {
        backgroundColor: '#e6dfc8',
        padding: 15,
        borderRadius: 8,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#ccc',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 15, // Increased gap for better spacing with image
    },
    productImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        backgroundColor: '#d5d5d5', // Fallback color while loading
    },
    itemInfo: {
        flex: 1,
        minWidth: 150,
    },
    itemTitle: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 16,
        color: '#222222',
        marginBottom: 4,
    },
    itemSubtitle: {
        fontFamily: 'Montserrat_400Regular',
        fontSize: 12,
        color: '#555',
        marginBottom: 4,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 2,
    },
    itemPrice: {
        fontFamily: 'Montserrat_600SemiBold',
        fontSize: 14,
        color: '#a94c0f',
    },
    basePrice: {
        fontFamily: 'Montserrat_400Regular',
        fontSize: 12,
        color: '#888',
        textDecorationLine: 'line-through',
    },
    stockWarning: {
        fontFamily: 'Montserrat_600SemiBold',
        fontSize: 11,
        color: '#c14e4e',
        marginTop: 4,
    },
    itemActions: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
    },
    iconButton: {
        backgroundColor: '#a94c0f',
        borderRadius: 8,
        padding: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconButtonDelete: {
        backgroundColor: '#c14e4e',
    },
    smallButtonWrapper: {
        backgroundColor: '#a94c0f',
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    smallButtonText: {
        color: '#222222',
        fontFamily: 'Montserrat_600SemiBold',
        fontSize: 12,
        textAlign: 'center',
    },
});