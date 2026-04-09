import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

interface AuthContextData {
    isAuthenticated: boolean;
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
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Check for existing token when the app starts
    useEffect(() => {
        const checkToken = async () => {
            let token = null;
            if (Platform.OS === 'web') {
                token = localStorage.getItem('userToken');
            } else {
                token = await SecureStore.getItemAsync('userToken');
            }
            if (token) setIsAuthenticated(true);
        };
        checkToken();
    }, []);

    const login = async (token: string) => {
        if (Platform.OS === 'web') {
            localStorage.setItem('userToken', token);
        } else {
            await SecureStore.setItemAsync('userToken', token);
        }
        setIsAuthenticated(true);
    };

    const logout = async () => {
        if (Platform.OS === 'web') {
            localStorage.removeItem('userToken');
        } else {
            await SecureStore.deleteItemAsync('userToken');
        }
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};