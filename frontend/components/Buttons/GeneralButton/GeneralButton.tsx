import React, { useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleProp, TextStyle } from 'react-native';

import { styles } from './GeneralButton.styles';

type GeneralButtonProps = {
    textStyle?: StyleProp<TextStyle>;
    title: string;
    disabled?: boolean;
    onPress: () => void;
};

const GeneralButton = ({textStyle, title, disabled=false, onPress}: GeneralButtonProps) => {
    const [isHovered, setIsHovered] = useState(false); // Used for underline style
    const hoverAnim = useRef(new Animated.Value(0)).current;

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
            <Animated.Text style={[
                styles.GeneralButton,
                isHovered && styles.GeneralButtonHovered,
                disabled && styles.GeneralButtonDisabled,
                textStyle,
                {
                    transform: [
                        { scale: animatedScale },
                        { translateY: animatedTranslateY }
                    ]
                }
            ]}>
                {title}
            </Animated.Text>
        </Pressable>
    );
};

export default GeneralButton;