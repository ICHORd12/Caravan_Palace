import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import {
    Montserrat_400Regular,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    useFonts
} from '@expo-google-fonts/montserrat';

import Navbar from '@/components/Navbar/Navbar';
import ManagerDashboardCard from '@/components/ManagerUI/ManagerDashboardCard';
import { Colors, Fonts } from '@/constants/theme';
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

    return (
        <View style={styles.mainContainer}>
            <Navbar />
            <View style={styles.contentContainer}>
                
                <View style={styles.header}>
                    <Text style={styles.greeting}>Welcome, {user?.name || 'Product Manager'}</Text>
                    <Text style={styles.subGreeting}>Product & Inventory Dashboard</Text>
                </View>

                <View style={styles.grid}>
                    <ManagerDashboardCard
                        icon="📦"
                        title="Product Management" 
                        description="Create, edit, and toggle active status for caravans." 
                        onPress={() => navigateWithWipe('/productManager/products')}
                    />
                    <ManagerDashboardCard
                        icon="🏷️"
                        title="Categories" 
                        description="Manage caravan categories and their visibility." 
                        onPress={() => navigateWithWipe('/productManager/categories')}
                    />
                    <ManagerDashboardCard
                        icon="🚚"
                        title="Order Statuses" 
                        description="Transition orders to In-Transit or Delivered." 
                        onPress={() => navigateWithWipe('/productManager/orders')}
                    />
                    <ManagerDashboardCard
                        icon="📊"
                        title="Stock Adjustment" 
                        description="Monitor and update inventory levels." 
                        onPress={() => navigateWithWipe('/productManager/stock')}
                    />
                </View>

            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: Colors.light.salesManagerBackground },
    contentContainer: { flex: 1, padding: 24, maxWidth: 1100, width: '100%', alignSelf: 'center' },
    header: { marginTop: 20, marginBottom: 26 },
    greeting: { fontFamily: Fonts.bold, fontSize: 30, color: Colors.light.greenButtonBackground, marginBottom: 8 },
    subGreeting: { fontFamily: Fonts.semibold, fontSize: 17, color: Colors.light.mainTextColor },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between' },
});