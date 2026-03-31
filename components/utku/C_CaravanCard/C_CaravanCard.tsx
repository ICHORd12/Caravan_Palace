import React, { useRef, useState } from "react";
import { Animated, Easing, Image, Pressable, ScrollView, Text, View } from "react-native";
import { styles } from "./C_CaravanCard.style";

type C_CaravanCardProps = {
  starIcon?: any;
  capacityIcon?: any;
  seasonIcon?: any;
  caravanImages?: any[];
  name: string;
  type: string;
  score: string;
  price: string;
  stock: number;
  onAddToCart?: () => void;
  onPress?: () => void;
  imageUrl?: string;
};

export default function C_CaravanCard(props: C_CaravanCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const hoverAnim = useRef(new Animated.Value(0)).current;
  const buttonHoverAnim = useRef(new Animated.Value(0)).current;

  const isOutOfStock = props.stock <= 0;

  const handleHoverIn = () => {
    setIsHovered(true);
    Animated.timing(hoverAnim, {
      toValue: 1, duration: 100,
      easing: Easing.out(Easing.ease), useNativeDriver: true,
    }).start();
  };

  const handleHoverOut = () => {
    setIsHovered(false);
    Animated.timing(hoverAnim, {
      toValue: 0, duration: 100,
      easing: Easing.in(Easing.ease), useNativeDriver: true,
    }).start();
  };

  const handleButtonHoverIn = () => {
    if (isOutOfStock) return;
    setIsButtonHovered(true);
    Animated.timing(buttonHoverAnim, {
      toValue: 1, duration: 150,
      easing: Easing.out(Easing.ease), useNativeDriver: false,
    }).start();
  };

  const handleButtonHoverOut = () => {
    setIsButtonHovered(false);
    Animated.timing(buttonHoverAnim, {
      toValue: 0, duration: 150,
      easing: Easing.in(Easing.ease), useNativeDriver: false,
    }).start();
  };

  const animatedScale = hoverAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] });
  const animatedTranslateY = hoverAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -1.5] });
  const buttonWidth = buttonHoverAnim.interpolate({ inputRange: [0, 1], outputRange: ['65%', '100%'] });
  const buttonBorderRadius = buttonHoverAnim.interpolate({ inputRange: [0, 1], outputRange: [25, 0] });
  const buttonBottom = buttonHoverAnim.interpolate({ inputRange: [0, 1], outputRange: [15, 0] });

  return (
    <Pressable onHoverIn={handleHoverIn} onHoverOut={handleHoverOut} onPress={props.onPress}>
      <Animated.View style={[
        styles.container,
        { transform: [{ scale: animatedScale }, { translateY: animatedTranslateY }] },
        isOutOfStock && styles.outOfStockContainer,
      ]}>

        {/* Out of Stock Badge */}
        {isOutOfStock && (
          <View style={styles.outOfStockBadge}>
            <Text style={styles.outOfStockText}>OUT OF STOCK</Text>
          </View>
        )}

        {/* Stock Count Badge (when in stock) */}
        {!isOutOfStock && (
          <View style={styles.stockBadge}>
            <Text style={styles.stockBadgeText}>{props.stock} in stock</Text>
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>{props.name}</Text>
        </View>

        {/* Image */}
        <View style={styles.imageContainer}>
          {props.caravanImages ? (
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
              {props.caravanImages.map((imgUrl, index) => (
                <Image key={index} source={typeof imgUrl === 'string' ? { uri: imgUrl } : imgUrl} style={styles.image} resizeMode="cover" />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Image source={require('../../../assets/images/caravan.jpg')} style={styles.image} resizeMode="cover" />
            </View>
          )}
        </View>

        {/* Info Row */}
        <View style={styles.infoRow}>
          <View style={styles.leftInfo}>
            <View style={styles.stars}>
              {[1, 2, 3, 4].map((_, i) => (
                <Text key={i} style={styles.starIcon}>⭐</Text>
              ))}
            </View>
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreText}>{props.score}</Text>
            </View>
          </View>
        </View>

        {/* Price */}
        <Text style={styles.price}>{props.price}</Text>

        {/* Action Button */}
        <View style={styles.buttonContainer}>
          <Pressable
            onHoverIn={handleButtonHoverIn}
            onHoverOut={handleButtonHoverOut}
            onPress={(e) => {
              e.stopPropagation?.();
              if (!isOutOfStock && props.onAddToCart) props.onAddToCart();
            }}
            style={styles.pressableButtonWrapper}
            disabled={isOutOfStock}
          >
            <Animated.View style={[
              styles.button,
              {
                width: buttonWidth,
                borderRadius: buttonBorderRadius,
                bottom: buttonBottom,
              },
              isOutOfStock && styles.buttonDisabled,
            ]}>
              <Text style={[styles.buttonText, isOutOfStock && styles.buttonTextDisabled]}>
                {isOutOfStock ? "UNAVAILABLE" : "ADD TO CART"}
              </Text>
            </Animated.View>
          </Pressable>
        </View>
      </Animated.View>
    </Pressable>
  );
}