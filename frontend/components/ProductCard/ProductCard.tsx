import WrappedGeneralButton from '@/components/Buttons/GeneralButtonWithWrapper/GeneralButtonWithWrapper';
import { Caravan } from '@/models/BACKEND_MODELS';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { styles } from '../ProductCard/ProductCard.styles';

interface ProductCardProps {
    isAuthenticated: boolean;
    dimensionStyle?: object; 
    caravan: Caravan;
    quantity: number; // Added: Passed from parent
    disabled?: boolean;
    isWished: boolean;
    onWishButtonClick: (productId: string) => void;
    onUpdateQuantity: (newAmount: number) => void; 
    onClick: (productId: string) => void;
}

export default function ProductCard({ isAuthenticated, dimensionStyle, caravan, quantity, disabled=false, isWished=false, onWishButtonClick, onUpdateQuantity, onClick}: ProductCardProps) {
    const [isHovered, setIsHovered] = useState(false);

    // Carousel state can stay here as it only affects this specific UI component
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Image Carousel Handlers
    function nextImage() {}
    function prevImage() {}

    return (
        <Pressable
            // @ts-ignore
            onMouseEnter={() => setIsHovered(true)} 
            onMouseLeave={() => setIsHovered(false)}
            style={[styles.outerContainer, dimensionStyle]}
            onPress={() => onClick(caravan.productId)}
        >
            <View style={[styles.cardContainer, isHovered && styles.cardContainerHovered]}>
                
                {/* Image Carousel Area */}
                <View style={styles.imageContainer}>
                    {(isAuthenticated) && (

                        <Pressable
                        style={styles.wishButtonContainer}
                        onPress={(event: any) => {
                            event?.stopPropagation?.();
                            onWishButtonClick(caravan.productId);
                        }}
                        >
                            <Ionicons
                                name={isWished ? "bookmark" : "bookmark-outline"}
                                size={26}
                                color={isWished ? "#bc6c25" : "#283618"}
                            />
                        </Pressable>
                    )}
                    
                </View>

                {/* Details Area */}
                <View style={styles.detailsContainer}>
                    <View style={styles.titleRow}>
                        <Text style={styles.cardTitle}>{caravan.name}</Text>
                    </View>

                    <Text style={styles.priceText}>{caravan.currentPrice}</Text>

                    <View style={styles.specsGrid}>
                        <Text style={styles.specText}>• Fuel: {caravan.fuelType}</Text>
                        <Text style={styles.specText}>• Weight: {caravan.weightKg} kg</Text>
                        <Text style={styles.specText}>• Kitchen: {caravan.hasKitchen ? 'Yes' : 'No'}</Text>
                        <Text style={styles.specText}>Stock: {caravan.quantityInStocks}</Text>
                    </View>

                    {/* Add to Cart / Quantity Manager */}
                    <View style={styles.cartContainer}>
                        {quantity === 0 ? (
                            <WrappedGeneralButton
                                title="Add to Cart"
                                onPress={(event: any) => {
                                    event?.stopPropagation?.();
                                    onUpdateQuantity(1)
                                }}
                                wrapperStyles={styles.addButtonWrapper}
                                textStyles={styles.addButtonText}
                                disabled={disabled || caravan.quantityInStocks <= 0}
                            />
                        ) : (
                            <View style={styles.quantityControls}>
                                <Pressable 
                                    disabled={disabled} 
                                    style={[styles.qtyButton, (disabled) && {opacity: 0.5}]} 
                                    onPress={(event: any) => {
                                        event?.stopPropagation?.();
                                        onUpdateQuantity(-1)
                                    }}
                                >
                                    <Ionicons name={quantity === 1 ? "trash-outline" : "remove"} size={18} color="#fefae0" />
                                </Pressable>

                                <Text style={styles.qtyText}>{quantity}</Text>

                                <Pressable 
                                    disabled={disabled || caravan.quantityInStocks <= quantity} 
                                    style={[styles.qtyButton, (disabled || caravan.quantityInStocks <= quantity) && {opacity: 0.5}]} 
                                    onPress={(event: any) => {
                                        event?.stopPropagation?.();
                                        onUpdateQuantity(1)
                                    }}
                                >
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