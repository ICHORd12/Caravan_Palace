import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';

import { useToast } from '@/context/ToastContext';
import { API_BASE_URL, MERGE_BACKEND_CART_END_POINT, TOKEN_VALIDATE} from '@/constants/API';
import getLocalCartMap from '@/functions/getLocalCartMap';
import deleteLocalCart from '@/functions/deleteLocalCart';

interface AuthContextData {
    isAuthenticated: boolean;
    token: string | null;
    isLoading: boolean; 
    login: (token: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { showToast } = useToast();

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true); // ADDED: Start in a loading state

    const logout = useCallback(async () => {
        if (Platform.OS === 'web') {
            localStorage.removeItem('userToken');
        } else {
            await SecureStore.deleteItemAsync('userToken');
        }
        setToken(null);
        setIsAuthenticated(false);

        // Delete all cache
        const localCart: Record<string, number> = getLocalCartMap();
        deleteLocalCart(localCart);
    }, []);

    useEffect(() => {
        const checkToken = async () => {
            setIsLoading(true); 
            
            try {
                let savedToken = null;
                if (Platform.OS === 'web') {
                    savedToken = localStorage.getItem('userToken');
                } else {
                    savedToken = await SecureStore.getItemAsync('userToken');
                }

                if (!savedToken) {
                    setIsLoading(false);
                    return; 
                }

                const response = await fetch(`${API_BASE_URL}${TOKEN_VALIDATE}`, {
                    method: 'GET', 
                    headers: {
                        'Authorization': `Bearer ${savedToken}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    setToken(savedToken);
                    setIsAuthenticated(true);
                } else {
                    
                    await logout(); 
                }
            } catch (error) {
                console.error("Token validation failed due to network error", error);
                await logout(); 
            } finally {
                setIsLoading(false); 
            }
        };

        checkToken();
    }, [logout]); 

    const login = async (newToken: string) => {
        if (Platform.OS === 'web') {
            localStorage.setItem('userToken', newToken);
        } else {
            await SecureStore.setItemAsync('userToken', newToken);
        }
        setToken(newToken);
        setIsAuthenticated(true);

        // Merge with backend
        const localCart: Record<string, number> = getLocalCartMap();
        const payloadItems = Object.entries(localCart).map(([productId, quantity]) => ({ productId, quantity }));

        try {
            const response = await fetch(`${API_BASE_URL}${MERGE_BACKEND_CART_END_POINT}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${newToken}`
                },
                body: JSON.stringify({ items: payloadItems }),
            });

            if (response.ok) {
                deleteLocalCart(localCart);
            } else {
                showToast("Error: Merge With Backend Failed", 'error');
            }

        } catch (err) {
            showToast("Error: Merge With Backend Failed", 'error');
            console.log(err);
        }
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, token, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};