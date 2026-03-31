import React, { useRef, useState } from "react";
import { Animated, Easing, Image, Pressable, ScrollView, Text, View } from "react-native";
import { styles } from "./C_CaravanCard.style";

type C_CaravanCardProps = {
    starIcon: string;
    capacityIcon: string;
    seasonIcon: string;
    caravanImages: string[];
    name: string;
    type: string;
    score: string;
    price: string;
}

export default function C_CaravanCard(props: C_CaravanCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [isButtonHovered, setIsButtonHovered] = useState(false);

    // Animation Refs
    const hoverAnim = useRef(new Animated.Value(0)).current;
    const buttonHoverAnim = useRef(new Animated.Value(0)).current;

    // --- Main Card Hover Logic ---
    const handleHoverIn = () => {
        setIsHovered(true);
        Animated.timing(hoverAnim, {
            toValue: 1,
            duration: 100,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
        }).start();
    };

    const handleHoverOut = () => {
        setIsHovered(false);
        Animated.timing(hoverAnim, {
            toValue: 0,
            duration: 100,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
        }).start();
    };

    // --- Button Hover Logic ---
    const handleButtonHoverIn = () => {
        setIsButtonHovered(true);
        Animated.timing(buttonHoverAnim, {
            toValue: 1,
            duration: 150,
            easing: Easing.out(Easing.ease),
            useNativeDriver: false, // Must be false for width/borderRadius
        }).start();
    };

    const handleButtonHoverOut = () => {
        setIsButtonHovered(false);
        Animated.timing(buttonHoverAnim, {
            toValue: 0,
            duration: 150,
            easing: Easing.in(Easing.ease),
            useNativeDriver: false,
        }).start();
    };

    // --- Interpolations ---
    const animatedScale = hoverAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.05]
    });

    const animatedTranslateY = hoverAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -1.5]
    });

    const buttonWidth = buttonHoverAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['65%', '100%'] // Expands to full width
    });

    const buttonBorderRadius = buttonHoverAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [25, 0] // Sharpens corners
    });

    const buttonBottom = buttonHoverAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [15, 0] // Docks to the very bottom vertically
    });

    return (
        <Pressable
            
            onHoverIn={handleHoverIn}
            onHoverOut={handleHoverOut}
        >
            <Animated.View style={[
                styles.container,
                {
                    transform: [
                        { scale: animatedScale },
                        { translateY: animatedTranslateY }
                    ]
                }
            ]}>
                
                {/* Header Section */}
                <View style={styles.header}>
                    <Text style={styles.name}>{props.name}</Text>
                    <Text style={styles.type}>{props.type}</Text>
                </View>

                {/* Swipeable Image Carousel */}
                <View style={styles.imageContainer}>
                    <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
                        {props.caravanImages.map((imgUrl, index) => (
                            <Image
                                key={index}
                                source={{ uri: imgUrl }}
                                style={styles.image}
                                resizeMode="cover"
                            />
                        ))}
                    </ScrollView>
                </View>

                {/* Info & Metrics Section */}
                <View style={styles.infoRow}>
                    <View style={styles.leftInfo}>
                        <View style={styles.stars}>
                            {/* Rendering 4 stars based on the image */}
                            {[1, 2, 3, 4].map((_, i) => (
                                <Image key={i} source={{ uri: props.starIcon }} style={styles.iconSmall} />
                            ))}
                        </View>
                        <View style={styles.scoreBadge}>
                            <Text style={styles.scoreText}>{props.score}</Text>
                        </View>
                    </View>
                    
                    <View style={styles.rightInfo}>
                        <Image source={{ uri: props.seasonIcon }} style={styles.iconMedium} />
                        <Text style={styles.capacityText}>4</Text>
                        <Image source={{ uri: props.capacityIcon }} style={styles.iconMedium} />
                    </View>
                </View>

                {/* Pricing */}
                <Text style={styles.price}>{props.price}</Text>

                {/* Expanding Action Button */}
                <View style={styles.buttonContainer}>
                    <Pressable
                        onHoverIn={handleButtonHoverIn}
                        onHoverOut={handleButtonHoverOut}
                        style={styles.pressableButtonWrapper}
                    >
                        <Animated.View style={[
                            styles.button,
                            {
                                width: buttonWidth,
                                borderRadius: buttonBorderRadius,
                                bottom: buttonBottom
                            }
                        ]}>
                            <Text style={styles.buttonText}>ADD TO CARD</Text>
                        </Animated.View>
                    </Pressable>
                </View>

            </Animated.View>
        </Pressable>
    );
}