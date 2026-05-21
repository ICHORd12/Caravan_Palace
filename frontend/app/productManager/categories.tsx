import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { useFocusEffect } from "expo-router";

import Navbar from "@/components/Navbar/Navbar";
import WrappedGeneralButton from "@/components/Buttons/GeneralButtonWithWrapper/GeneralButtonWithWrapper";

import { API_BASE_URL, CATEGORIES_ENDPOINT } from "@/constants/API";
import { Colors, Fonts } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useTransition } from "@/context/TransitionContext";

// --- TYPES ---
interface PMCategory {
    categoryId: string;
    categoryName: string;
    isActive?: boolean; // assumed the backend will return this for PMs eventually
}

export default function ProductManagerCategories() {
    const { token, user } = useAuth();
    const { showToast } = useToast();
    const { navigateWithWipe, revealWipe } = useTransition();

    const [categories, setCategories] = useState<PMCategory[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({});

    const isPM = user?.role === "product_manager";

    //#region API FUNCTIONS
    const fetchCategories = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            // Backend note: This endpoint needs to return inactive categories for PMs too
            const response = await fetch(`${API_BASE_URL}${CATEGORIES_ENDPOINT}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await response.json();
            
            if (response.ok) {
                // Defaulting isActive to true since the current endpoint only returns active ones
                const mappedCategories = (data.categories || []).map((c: any) => ({
                    ...c, isActive: c.isActive !== undefined ? c.isActive : true 
                }));
                setCategories(mappedCategories);
            } else {
                showToast(data.message || "Failed to fetch categories", "error");
            }
        } catch (error) {
            showToast("Network error", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const toggleActivation = async (categoryId: string, currentStatus: boolean) => {
        if (!token) return;
        
        setUpdatingStatus(prev => ({ ...prev, [categoryId]: true }));
        try {
            const response = await fetch(`${API_BASE_URL}${CATEGORIES_ENDPOINT}/${categoryId}/activation`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ isActive: !currentStatus }),
            });

            if (response.ok) {
                setCategories(prev => prev.map(c => 
                    c.categoryId === categoryId ? { ...c, isActive: !currentStatus } : c
                ));
                showToast(`Category ${!currentStatus ? 'Activated' : 'Deactivated'}`, "success");
            } else {
                const errorData = await response.json();
                showToast(errorData.message || "Failed to update status", "error");
            }
        } catch (error) {
            showToast("Network error", "error");
        } finally {
            setUpdatingStatus(prev => ({ ...prev, [categoryId]: false }));
        }
    };
    //#endregion

    useFocusEffect(
        useCallback(() => {
            if (!isPM) {
                navigateWithWipe("/");
                return;
            }
            fetchCategories().then(() => revealWipe());
        }, [isPM])
    );

    if (!isPM) return null;

    //#region RENDER CARD
    const renderCategoryCard = ({ item }: { item: PMCategory }) => (
        <View style={styles.card}>
            <View style={styles.cardInfo}>
                <Text style={styles.categoryTitle}>{item.categoryName}</Text>
                <Text style={styles.categoryId}>ID: {item.categoryId}</Text>
            </View>
            
            <View style={styles.actionContainer}>
                <View style={[styles.statusBadge, { backgroundColor: item.isActive ? Colors.light.greenButtonBackground : Colors.light.deleteButtonBackground }]}>
                    <Text style={styles.statusBadgeText}>{item.isActive ? "Active" : "Inactive"}</Text>
                </View>

                <WrappedGeneralButton
                    title={item.isActive ? "Deactivate" : "Activate"}
                    disabled={updatingStatus[item.categoryId]}
                    wrapperStyles={[styles.actionButton, item.isActive ? styles.deactivateBtn : styles.activateBtn]}
                    textStyles={styles.actionButtonText}
                    onPress={() => toggleActivation(item.categoryId, item.isActive || false)}
                />
            </View>
        </View>
    );
    //#endregion

    return (
        <View style={styles.mainContainer}>
            <Navbar />
            <View style={styles.contentContainer}>
                <View style={styles.header}>
                    <Text style={styles.pageTitle}>Category Management</Text>
                    <WrappedGeneralButton
                        title="Refresh"
                        disabled={isLoading}
                        wrapperStyles={styles.refreshButton}
                        textStyles={styles.actionButtonText}
                        onPress={fetchCategories}
                    />
                </View>

                {isLoading ? (
                    <ActivityIndicator size="large" color={Colors.light.greenButtonBackground} style={{ marginTop: 50 }} />
                ) : categories.length === 0 ? (
                    <Text style={styles.emptyText}>No categories found.</Text>
                ) : (
                    <FlatList
                        data={categories}
                        keyExtractor={(item) => item.categoryId}
                        renderItem={renderCategoryCard}
                        contentContainerStyle={{ paddingBottom: 30 }}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: Colors.light.salesManagerBackground },
    contentContainer: { flex: 1, width: "100%", maxWidth: 800, alignSelf: "center", padding: 20 },
    
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    pageTitle: { fontFamily: Fonts.bold, fontSize: 28, color: Colors.light.greenButtonBackground },
    refreshButton: { backgroundColor: Colors.light.greenButtonBackground, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
    
    emptyText: { textAlign: 'center', fontFamily: Fonts.semibold, fontSize: 16, color: Colors.light.greenButtonBackground, marginTop: 40 },

    /* CARD STYLES */
    card: { 
        backgroundColor: Colors.light.softContainerBackground, 
        borderRadius: 8, 
        padding: 20, 
        marginBottom: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    cardInfo: { flex: 1 },
    categoryTitle: { fontFamily: Fonts.bold, fontSize: 20, color: Colors.light.greenButtonBackground, marginBottom: 4 },
    categoryId: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.light.basePriceDiscountedTextColor },
    
    actionContainer: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    statusBadge: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, minWidth: 80, alignItems: 'center' },
    statusBadgeText: { fontFamily: Fonts.semibold, color: '#fff', fontSize: 12 },
    
    actionButton: { minWidth: 110, paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, alignItems: 'center' },
    activateBtn: { backgroundColor: Colors.light.greenButtonBackground },
    deactivateBtn: { backgroundColor: Colors.light.deleteButtonBackground },
    actionButtonText: { fontFamily: Fonts.bold, color: '#fff', fontSize: 14 },
});