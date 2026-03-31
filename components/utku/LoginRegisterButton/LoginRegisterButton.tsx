import React, { useRef, useState } from 'react';
import { Pressable, Animated, Easing } from 'react-native';

import { styles } from '../LoginRegisterButton/LoginRegisterButton.style';

type LoginRegisterButtonProps = {
    title: string;
    onPress: () => void;
};

const LoginRegisterButton = ({ title, onPress }: LoginRegisterButtonProps) => {
    const [isHovered, setIsHovered] = useState(false);
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
        >
            <Animated.Text style={[
            styles.GeneralButton, 
            isHovered && styles.GeneralButtonHovered, 
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

export default LoginRegisterButton;