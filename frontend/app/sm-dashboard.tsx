import { useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Navbar from '../components/Navbar/Navbar';
import { Ionicons } from '@expo/vector-icons';
import { useTransition } from '../context/TransitionContext';

type TabType = 'products' | 'orders' | 'refunds';

export default function SMDashboard() {
    const [activeTab, setActiveTab] = useState<TabType>('products');
    const { revealWipe } = useTransition();

    useFocusEffect(
        useCallback(() => {
            revealWipe();
        }, [])
    );

    return (
        <View style={styles.mainContainer}>
            <Navbar />

            { }
            <View style={[styles.tabBarContainer, { marginTop: 30 }]}>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'products' && styles.activeTabButton]}
                    onPress={() => setActiveTab('products')}
                    activeOpacity={0.7}
                >
                    <Ionicons name="cube" size={20} color={activeTab === 'products' ? '#fff' : '#222'} style={styles.tabIcon} />
                    <Text style={[styles.tabText, activeTab === 'products' && styles.activeTabText]}>
                        Products
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'orders' && styles.activeTabButton]}
                    onPress={() => setActiveTab('orders')}
                    activeOpacity={0.7}
                >
                    <Ionicons name="list" size={20} color={activeTab === 'orders' ? '#fff' : '#222'} style={styles.tabIcon} />
                    <Text style={[styles.tabText, activeTab === 'orders' && styles.activeTabText]}>
                        Orders
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'refunds' && styles.activeTabButton]}
                    onPress={() => setActiveTab('refunds')}
                    activeOpacity={0.7}
                >
                    <Ionicons name="cash" size={20} color={activeTab === 'refunds' ? '#fff' : '#222'} style={styles.tabIcon} />
                    <Text style={[styles.tabText, activeTab === 'refunds' && styles.activeTabText]}>
                        Refund Requests
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#d6cba6',
    },
    tabBarContainer: {
        flexDirection: 'row',
        backgroundColor: '#e6dfc8',
        marginHorizontal: 20,
        borderRadius: 12,
        padding: 4,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    tabButton: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
    },
    activeTabButton: {
        backgroundColor: '#a94c0f',
    },
    tabIcon: {
        marginRight: 6,
    },
    tabText: {
        fontFamily: 'Montserrat_600SemiBold',
        fontSize: 14,
        color: '#222222',
    },
    activeTabText: {
        color: '#ffffff',
    },
});
