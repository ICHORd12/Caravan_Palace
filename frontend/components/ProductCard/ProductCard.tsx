import WrappedGeneralButton from '@/components/Buttons/GeneralButtonWithWrapper/GeneralButtonWithWrapper';
import { Caravan } from '@/constants/BACKEND_MODELS';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { styles } from '../ProductCard/ProductCard.styles';


interface ProductCardProps {
    dimensionStyle?: object; // Optional style for dynamic width
    caravan: Caravan;
}

export default function ProductCard({ dimensionStyle, caravan }: ProductCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [cartQuantity, setCartQuantity] = useState(0);

    // Load initial cart quantity from localStorage on mount
    function loadCartQuantity() {
        if (Platform.OS === 'web') {
            const savedQuantity = window.localStorage.getItem(`cart_${caravan.productId}`);
            if (savedQuantity) {
                setCartQuantity(parseInt(savedQuantity, 10));
            }
        }
    }
    useEffect(() => { loadCartQuantity(); }, [caravan.productId]);

    // Update quantity function and sync to localStorage
    function updateQuantity(newAmount: number) {
        const validatedAmount = Math.max(0, newAmount); // Prevent negative numbers

        setCartQuantity(validatedAmount);


        if (Platform.OS === 'web') {
            if (validatedAmount === 0) {
                window.localStorage.removeItem(`cart_${caravan.productId}`);
            }
            else {
                window.localStorage.setItem(`cart_${caravan.productId}`, validatedAmount.toString());
            }
        }
    };

    // Image Carousel Handlers
    function nextImage() {
        
    };
    function prevImage() {
        
    };


    return (
        <Pressable
            // @ts-ignore
            onMouseEnter={() => setIsHovered(true)} 
            onMouseLeave={() => setIsHovered(false)}
            style={[ 
                styles.outerContainer, 
                dimensionStyle
            ]}
        >

            <View
                style={[
                    styles.cardContainer,
                    isHovered && styles.cardContainerHovered,  
                ]}
            >
                {/* Image Carousel Area */}
                <View style={styles.imageContainer}>
                </View>

                {/* Details Area */}
                <View style={styles.detailsContainer}>

                    <View style={styles.titleRow}>
                        <Text style={styles.cardTitle}>{caravan.model}</Text>
                    </View>

                    <Text style={styles.priceText}>{caravan.currentPrice}</Text>

                    <View style={styles.specsGrid}>
                        <Text style={styles.specText}>• Fuel: {caravan.fuelType}</Text>
                        <Text style={styles.specText}>• Weight: {caravan.weightKg} kg</Text>
                        <Text style={styles.specText}>• Kitchen: {caravan.hasKitchen ? 'Yes' : 'No'}</Text>
                    </View>

                    {/* Add to Cart / Quantity Manager */}
                    <View style={styles.cartContainer}>
                        {cartQuantity === 0 ? (
                            <WrappedGeneralButton
                                title="Add to Cart"
                                onPress={() => updateQuantity(1)}
                                wrapperStyles={styles.addButtonWrapper}
                                textStyles={styles.addButtonText}
                            />
                        ) : (
                            <View style={styles.quantityControls}>
                                <Pressable style={styles.qtyButton} onPress={() => updateQuantity(cartQuantity - 1)}>
                                    <Ionicons name={cartQuantity === 1 ? "trash-outline" : "remove"} size={18} color="#fefae0" />
                                </Pressable>

                                <Text style={styles.qtyText}>{cartQuantity}</Text>

                                <Pressable style={styles.qtyButton} onPress={() => updateQuantity(cartQuantity + 1)}>
                                    <Ionicons name="add" size={18} color="#fefae0" />
                                </Pressable>
                            </View>
                        )}
                    </View>
                </View>

            </View>

        </Pressable>
    );
}

