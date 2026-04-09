import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text } from 'react-native';

type ToastType = 'success' | 'error' | 'info';

interface ToastContextData {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextData | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [message, setMessage] = useState('');
    const [type, setType] = useState<ToastType>('info');
    const translateY = useRef(new Animated.Value(-100)).current; 

    // 1. Wrap showToast in useCallback
    const showToast = useCallback((newMessage: string, newType: ToastType = 'info') => {
        setMessage(newMessage);
        setType(newType);

        Animated.timing(translateY, {
            toValue: Platform.OS === 'ios' ? 50 : 20, 
            duration: 300,
            useNativeDriver: true,
        }).start();

        setTimeout(() => {
            Animated.timing(translateY, {
                toValue: -100,
                duration: 300,
                useNativeDriver: true,
            }).start(() => setMessage('')); 
        }, 3000);
    }, [translateY]); 

    const getBackgroundColor = () => {
        switch (type) {
            case 'success': return '#4CAF50';
            case 'error': return '#7c120b';
            default: return '#333333';
        }
    };

    // 2. Memoize the context value
    const contextValue = useMemo(() => ({ showToast }), [showToast]);

    return (
        <ToastContext.Provider value={contextValue}>
            {children}
            {message !== '' && (
                <Animated.View
                    style={[
                        styles.toastContainer,
                        {
                            backgroundColor: getBackgroundColor(),
                            transform: [{ translateY }],
                        },
                    ]}
                >
                    <Text style={styles.toastText}>{message}</Text>
                </Animated.View>
            )}
        </ToastContext.Provider>
    );
};

const styles = StyleSheet.create({
    toastContainer: {
        position: 'absolute',
        top: 0,
        left: '25%',
        width: '50%',
        padding: 15,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 5, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        zIndex: 9999, 
    },
    toastText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Montserrat_400Regular', 
        textAlign: 'center',
        flexShrink: 1, 
    },
});