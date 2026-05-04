import WrappedGeneralButton from '@/components/Buttons/GeneralButtonWithWrapper/GeneralButtonWithWrapper';
import { Caravan } from '@/models/BACKEND_MODELS';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { Pressable, Text, View, TextInput, Image } from 'react-native';
import { useRouter } from 'expo-router';
import getImageForProduct from '@/functions/getImageForProduct';
import { styles } from '../ProductCard/ProductCard.styles';

interface ProductCardProps {
    dimensionStyle?: object; 
    caravan: Caravan;
    quantity: number; // Added: Passed from parent
    disabled?: boolean;
    onUpdateQuantity: (newAmount: number) => void; // Added: Handled by parent
}

export default function ProductCard({ dimensionStyle, caravan, quantity, disabled=false, onUpdateQuantity }: ProductCardProps) {
    const router = useRouter();
    const [isHovered, setIsHovered] = useState(false);
    // Carousel state can stay here as it only affects this specific UI component
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const [localQty, setLocalQty] = useState(quantity.toString());

    useEffect(() => {
        setLocalQty(quantity.toString());
    }, [quantity]);


    function nextImage(e: any) {
        if (e && e.stopPropagation) e.stopPropagation();
        if (!caravan.images || caravan.images.length <= 1) return;
        
        setCurrentImageIndex((prevIndex) => 
            prevIndex === caravan.images.length - 1 ? 0 : prevIndex + 1
        );
    }

    function prevImage(e: any) {
        if (e && e.stopPropagation) e.stopPropagation();
        if (!caravan.images || caravan.images.length <= 1) return;
        
        setCurrentImageIndex((prevIndex) => 
            prevIndex === 0 ? caravan.images.length - 1 : prevIndex - 1
        );
    }


    const handleQtyChange = (text: string) => {
        const numericText = text.replace(/[^0-9]/g, '');
        setLocalQty(numericText);
    };

    const handleBlur = () => {
        let newQty = parseInt(localQty, 10);
        if (isNaN(newQty)) newQty = 0;
        if (newQty < 0) newQty = 0;
        if (newQty > caravan.quantityInStocks) {
            newQty = caravan.quantityInStocks;
        }
        
        if (newQty !== quantity) {
            onUpdateQuantity(newQty - quantity);
        } else {
            setLocalQty(newQty.toString());
        }
    };


    return (
        <Pressable
            // @ts-ignore
            onMouseEnter={() => setIsHovered(true)} 
            onMouseLeave={() => setIsHovered(false)}
            onPress={() => router.push(`/product/${caravan.productId}`)}
            style={[styles.outerContainer, dimensionStyle]}
        >
            <View style={[styles.cardContainer, isHovered && styles.cardContainerHovered]}>
                
                {/* Image Carousel Area */}
                <View style={styles.imageContainer}>
                    {caravan.images && caravan.images.length > 0 ? (
                        <>
                            <Image 
                                source={{ uri: caravan.images[currentImageIndex].url }} 
                                style={{ width: '100%', height: '100%' }} 
                                resizeMode="cover"
                            />
                            
                            {/* Only show arrows if there is more than one image */}
                            {caravan.images.length > 1 && (
                                <>
                                    <Pressable 
                                        onPress={prevImage} 
                                        style={{ position: 'absolute', left: 8, top: '50%', marginTop: -16, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20, padding: 4 }}
                                    >
                                        <Ionicons name="chevron-back" size={24} color="white" />
                                    </Pressable>
                                    
                                    <Pressable 
                                        onPress={nextImage} 
                                        style={{ position: 'absolute', right: 8, top: '50%', marginTop: -16, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20, padding: 4 }}
                                    >
                                        <Ionicons name="chevron-forward" size={24} color="white" />
                                    </Pressable>
                                </>
                            )}
                        </>
                    ) : (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <Ionicons name="image-outline" size={32} color="#ccc" />
                        </View>
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
                                onPress={() => onUpdateQuantity(1)}
                                wrapperStyles={styles.addButtonWrapper}
                                textStyles={styles.addButtonText}
                                disabled={disabled || caravan.quantityInStocks <= 0}
                            />
                        ) : (
                            <View style={styles.quantityControls}>
                                <Pressable 
                                    disabled={disabled} 
                                    style={[styles.qtyButton, (disabled) && {opacity: 0.5}]} 
                                    onPress={(e) => {
                                        // Optional: prevent navigation when adjusting quantity
                                        // @ts-ignore for web support if needed
                                        if (e && e.stopPropagation) e.stopPropagation();
                                        onUpdateQuantity(-1);
                                    }}
                                >
                                    <Ionicons name={quantity === 1 ? "trash-outline" : "remove"} size={18} color="#fefae0" />
                                </Pressable>

                                <Pressable 
                                    onPress={(e) => {
                                        if (e && e.stopPropagation) e.stopPropagation();
                                    }}
                                    // Optional: Add cursor style if you want standard web text-selection behavior
                                    // @ts-ignore
                                    style={{ cursor: 'text' }} 
                                >
                                    <TextInput 
                                        style={styles.qtyText} 
                                        value={localQty} 
                                        onChangeText={handleQtyChange}
                                        onBlur={handleBlur}
                                        onSubmitEditing={handleBlur}
                                        keyboardType="numeric"
                                        editable={!disabled}
                                        // You can remove the onPressIn entirely now
                                    />
                                </Pressable>

                                <Pressable 
                                    disabled={disabled || caravan.quantityInStocks <= quantity} 
                                    style={[styles.qtyButton, (disabled || caravan.quantityInStocks <= quantity) && {opacity: 0.5}]} 
                                    onPress={(e) => {
                                        // @ts-ignore
                                        if (e && e.stopPropagation) e.stopPropagation();
                                        onUpdateQuantity(1);
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