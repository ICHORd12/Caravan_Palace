import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleProp, Text, TextStyle, ViewStyle } from 'react-native';

import { styles } from './GeneralButtonWithWrapper.styles';

type WrappedGeneralButtonProps = {
    title: string;
    onPress: () => void;
    textStyles?: StyleProp<TextStyle>;
    wrapperStyles?: StyleProp<ViewStyle>; // Added to pass styles to the wrapper
    disabled?: boolean;
};

const WrappedGeneralButton = ({ title, onPress, textStyles, wrapperStyles, disabled=false }: WrappedGeneralButtonProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const hoverAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (disabled) {
            setIsHovered(false);
            Animated.timing(hoverAnim, {
                toValue: 0,
                duration: 100,
                easing: Easing.in(Easing.ease),
                useNativeDriver: true,
            }).start();
        }
    }, [disabled, hoverAnim]);


    const handleHoverIn = () => {
        if (disabled) return;
        setIsHovered(true);
        Animated.timing(hoverAnim, {
            toValue: 1,
            duration: 100,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
        }).start();
    };

    const handleHoverOut = () => {
        if (disabled) return;
        setIsHovered(false);
        Animated.timing(hoverAnim, {
            toValue: 0,
            duration: 100,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
        }).start();
    };

    const animatedScale = hoverAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.05]
    });

    const animatedTranslateY = hoverAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -1.5]
    });

    return (
        <Pressable
            onHoverIn={handleHoverIn}
            onHoverOut={handleHoverOut}
            onPressIn={handleHoverIn}
            onPressOut={handleHoverOut}
            onPress={onPress}
            disabled={disabled}
        >
            {/* The Animated wrapper now takes the transform animations */}
            <Animated.View style={[
                styles.buttonWrapper,
                wrapperStyles,
                disabled && { opacity: 0.6 },
                {
                    transform: [
                        { scale: animatedScale },
                        { translateY: animatedTranslateY }
                    ]
                }
            ]}>
                <Text style={[
                    styles.buttonText,
                    isHovered && styles.buttonTextHovered,
                    textStyles,
                    disabled && { color: '#555555' }
                ]}>
                    {title}
                </Text>
            </Animated.View>
        </Pressable>
    );
};

export default WrappedGeneralButton;