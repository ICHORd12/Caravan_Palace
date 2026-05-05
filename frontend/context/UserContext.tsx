import React, { createContext, useContext, useState, useEffect } from 'react';
import {API_BASE_URL, ME_END_POINT} from '@/constants/API'
import { useAuth } from './AuthContext'; 

// --- Types ---
export interface Address {
    addressId: number;
    label: string;
    fullAddress: string;
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
    taxId: string;
    role: string;
    createdAt: string;
    addresses: Address[];
}

interface UserContextType {
    user: User | null;
    isLoadingUser: boolean;
    refreshUser: () => Promise<void>;
    addAddress: (newAddress: Address) => void;
    removeAddress: (addressId: number) => void;
    updateAddress: (addressId: number, updatedAddress: Address) => void;
}

// --- Context ---
const UserContext = createContext<UserContextType | undefined>(undefined);

// --- Provider ---
export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, token } = useAuth();
    const [user, setUser] = useState<User | null>(null);
    const [isLoadingUser, setIsLoadingUser] = useState(false);

    // Fetch user data from the API
    const fetchUser = async () => {
        if (!isAuthenticated || !token) {
            setUser(null);
            return;
        }

        setIsLoadingUser(true);
        try {
            // Replace with your actual base URL or API instance if you use axios
            const response = await fetch(`${API_BASE_URL}${ME_END_POINT}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`, 
                },
            });

            const data = await response.json();

            if (response.ok && data.user) {
                setUser(data.user);
            } else {
                console.error("Failed to fetch user:", data.message);
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        } finally {
            setIsLoadingUser(false);
        }
    };

    // Effect: Trigger fetch when auth state changes
    useEffect(() => {
        fetchUser();
    }, [isAuthenticated, token]);

    // --- State Mutation Functions ---
    // Note: You should still call your actual backend APIs for these actions inside 
    // your components, then call these context functions to update the UI instantly.

    const addAddress = (newAddress: Address) => {
        setUser((prevUser) => {
            if (!prevUser) return null;
            // If new address is default, you might want to set other addresses to isDefault: false here
            return {
                ...prevUser,
                addresses: [...prevUser.addresses, newAddress]
            };
        });
    };

    const removeAddress = (addressId: number) => {
        setUser((prevUser) => {
            if (!prevUser) return null;
            return {
                ...prevUser,
                addresses: prevUser.addresses.filter((a) => a.addressId !== addressId)
            };
        });
    };

    const updateAddress = (addressId: number, updatedAddress: Address) => {
        setUser((prevUser) => {
            if (!prevUser) return null;
            return {
                ...prevUser,
                addresses: prevUser.addresses.map((a) => 
                    a.addressId === addressId ? updatedAddress : a
                )
            };
        });
    };

    return (
        <UserContext.Provider value={{ 
            user, 
            isLoadingUser, 
            refreshUser: fetchUser, 
            addAddress, 
            removeAddress, 
            updateAddress 
        }}>
            {children}
        </UserContext.Provider>
    );
};

// --- Custom Hook ---
export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};