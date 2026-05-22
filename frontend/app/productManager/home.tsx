import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import {
    Montserrat_400Regular,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    useFonts
} from '@expo-google-fonts/montserrat';

import Navbar from '@/components/Navbar/Navbar';
import { useAuth } from '@/context/AuthContext';
import { useTransition } from '@/context/TransitionContext';

export default function ProductManagerHome() {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    const { revealWipe, navigateWithWipe } = useTransition();
    const [isAuthChecking, setIsAuthChecking] = useState(true);

    let [fontsLoaded] = useFonts({
        Montserrat_700Bold,
        Montserrat_400Regular,
        Montserrat_600SemiBold,
    });

    useEffect(() => {
        const timer = setTimeout(() => setIsAuthChecking(false), 100);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!isAuthChecking) {
            // Security fallback: if they aren't logged in, or aren't a PM, kick them out
            if (!isAuthenticated) {
                router.replace('/login');
            } else if (user?.role !== 'product_manager') {
                router.replace('/');
            }
        }
    }, [isAuthenticated, isAuthChecking, user, router]);

    useEffect(() => {
        if (fontsLoaded && !isAuthChecking && isAuthenticated && user?.role === 'product_manager') {
            revealWipe();
        }
    }, [fontsLoaded, isAuthChecking, isAuthenticated, user, revealWipe]);

    if (!fontsLoaded || isAuthChecking || !isAuthenticated || user?.role !== 'product_manager') {
        return null; 
    }

    // A modular dashboard button component
    const DashboardCard = ({ title, description, route, icon }: { title: string, description: string, route: string, icon: string }) => (
        <TouchableOpacity 
            style={styles.card} 
            onPress={() => navigateWithWipe(route)}
        >
            <Text style={styles.cardIcon}>{icon}</Text>
            <View>
                <Text style={styles.cardTitle}>{title}</Text>
                <Text style={styles.cardDesc}>{description}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.mainContainer}>
            <Navbar />
            <View style={styles.contentContainer}>
                
                <View style={styles.header}>
                    <Text style={styles.greeting}>Welcome, {user?.name || 'Product Manager'}</Text>
                    <Text style={styles.subGreeting}>Product & Inventory Dashboard</Text>
                </View>

                <View style={styles.grid}>
                    <DashboardCard 
                        icon="📦"
                        title="Product Management" 
                        description="Create, edit, and toggle active status for caravans." 
                        route="/productManager/products" 
                    />
                    <DashboardCard 
                        icon="🏷️"
                        title="Categories" 
                        description="Manage caravan categories and their visibility." 
                        route="/productManager/categories" 
                    />
                    <DashboardCard 
                        icon="🚚"
                        title="Order Statuses" 
                        description="Transition orders to In-Transit or Delivered." 
                        route="/productManager/orders" 
                    />
                    <DashboardCard 
                        icon="📊"
                        title="Stock Adjustment" 
                        description="Monitor and update inventory levels." 
                        route="/productManager/stock" 
                    />
                </View>

            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: '#d6cba6' },
    contentContainer: { flex: 1, padding: 40, maxWidth: 1000, width: '100%', alignSelf: 'center' },
    header: { marginBottom: 40 },
    greeting: { fontFamily: 'Montserrat_700Bold', fontSize: 32, color: '#283618', marginBottom: 8 },
    subGreeting: { fontFamily: 'Montserrat_600SemiBold', fontSize: 18, color: '#606c38' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, justifyContent: 'flex-start' },
    card: { 
        backgroundColor: '#fefae0', 
        borderRadius: 12, 
        padding: 24, 
        width: '48%', 
        minWidth: 300,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 
    },
    cardIcon: { fontSize: 40, marginRight: 20 },
    cardTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 20, color: '#283618', marginBottom: 4 },
    cardDesc: { fontFamily: 'Montserrat_400Regular', fontSize: 14, color: '#606c38', paddingRight: 40 }
});