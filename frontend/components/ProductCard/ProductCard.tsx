import WrappedGeneralButton from '@/components/Buttons/GeneralButtonWithWrapper/GeneralButtonWithWrapper';
import { Caravan } from '@/models/BACKEND_MODELS';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { styles } from '../ProductCard/ProductCard.styles';

interface ProductCardProps {
    dimensionStyle?: object; 
    caravan: Caravan;
    quantity: number; // Added: Passed from parent
    disabled?: boolean;
    onUpdateQuantity: (newAmount: number) => void; // Added: Handled by parent
}

export default function ProductCard({ dimensionStyle, caravan, quantity, disabled=false, onUpdateQuantity }: ProductCardProps) {
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
        >
            <View style={[styles.cardContainer, isHovered && styles.cardContainerHovered]}>
                
                {/* Image Carousel Area */}
                <View style={styles.imageContainer}></View>

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
                    </View>

                    {/* Add to Cart / Quantity Manager */}
                    <View style={styles.cartContainer}>
                        {quantity === 0 ? (
                            <WrappedGeneralButton
                                title="Add to Cart"
                                onPress={() => onUpdateQuantity(1)}
                                wrapperStyles={styles.addButtonWrapper}
                                textStyles={styles.addButtonText}
                                disabled={disabled}
                            />
                        ) : (
                            <View style={styles.quantityControls}>
                                <Pressable disabled={disabled} style={[styles.qtyButton, disabled && {opacity: 0.5}]} onPress={() => onUpdateQuantity(quantity - 1)}>
                                    <Ionicons name={quantity === 1 ? "trash-outline" : "remove"} size={18} color="#fefae0" />
                                </Pressable>

                                <Text style={styles.qtyText}>{quantity}</Text>

                                <Pressable disabled={disabled} style={[styles.qtyButton, disabled && {opacity: 0.5}]} onPress={() => onUpdateQuantity(quantity + 1)}>
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