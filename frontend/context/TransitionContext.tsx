import { useRouter } from 'expo-router';
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet } from 'react-native';

interface TransitionContextType {
    navigateWithWipe: (path: string) => void;
    revealWipe: () => void;
}

const TransitionContext = createContext<TransitionContextType | null>(null);

export const useTransition = () => {
    const context = useContext(TransitionContext);
    if (!context) throw new Error('useTransition must be used within a TransitionProvider');

    return context;
}

export const TransitionProvider = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();
    const wipeWidth = useRef(new Animated.Value(0)).current; 
    const [anchor, setAnchor] = useState<'left' | 'right'>('left');

    // 1. Wrap navigateWithWipe in useCallback
    const navigateWithWipe = useCallback((path: string) => {
        if (Platform.OS === 'web') {
            if (typeof document !== 'undefined' && document.activeElement) {
                (document.activeElement as HTMLElement).blur();
            }
        }
        setAnchor('left'); 
        Animated.timing(wipeWidth, {
            toValue: 100,
            duration: 400,
            useNativeDriver: false,
            easing: Easing.inOut(Easing.ease),
        }).start(() => {
            // @ts-ignore
            router.push(path);
        });
    }, [router, wipeWidth]);

    // 2. Wrap revealWipe in useCallback
    const revealWipe = useCallback(() => {
        setAnchor('right');

        setTimeout(() => {
            Animated.timing(wipeWidth, {
                toValue: 0,
                duration: 400,
                useNativeDriver: false,
                easing: Easing.inOut(Easing.ease),
            }).start();
        }, 10); 
    }, [wipeWidth]);

    // 3. Memoize the context value
    const contextValue = useMemo(() => ({ navigateWithWipe, revealWipe }), [navigateWithWipe, revealWipe]);

    return (
        <TransitionContext.Provider value={contextValue}>
            {children}
            
            <Animated.View style={[
                styles.globalWipe,
                anchor === 'left' ? { left: 0 } : { right: 0 },
                {
                    width: wipeWidth.interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0%', '100%']
                    })
                }
            ]} />
        </TransitionContext.Provider>
    );
};

const styles = StyleSheet.create({
    globalWipe: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#a94c0f', 
        zIndex: 99999,  
        elevation: 999, 
    }
});