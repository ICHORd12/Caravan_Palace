import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, ActivityIndicator, TouchableOpacity, ScrollView, Switch } from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import Navbar from "@/components/Navbar/Navbar";
import WrappedGeneralButton from "@/components/Buttons/GeneralButtonWithWrapper/GeneralButtonWithWrapper";
import { API_BASE_URL, PRODUCTS_END_POINT, PRODUCT_ACTIVATION_ENDPOINT, CREATE_PRODUCT_ENDPOINT } from "@/constants/API";
import { Colors, Fonts } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useTransition } from "@/context/TransitionContext";

// --- TYPES ---
interface PMProduct {
    productId: string;
    name: string;
    model: string;
    serialNumber: string;
    quantityInStocks: number;
    isActive?: boolean; // We assume the backend will return this for PMs eventually
}

export default function ProductManagerProducts() {
    const { token, user } = useAuth();
    const { showToast } = useToast();
    const { navigateWithWipe, revealWipe } = useTransition();

    // State
    const [products, setProducts] = useState<PMProduct[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false); // Toggles between List and Form
    const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({});

    // --- FORM STATE (Excluding Price as per Jira) ---
    const [formData, setFormData] = useState({
        name: "", categoryId: "", model: "", serialNumber: "",
        description: "", quantityInStocks: "0", warrantyStatus: "",
        distributorInfo: "", berthCount: "0", fuelType: "", weightKg: "0", hasKitchen: false
    });

    const isPM = user?.role === "product_manager";

    //#region API FUNCTIONS
    const fetchProducts = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            // NOTE: Backend needs to update this to return inactive products too
            const response = await fetch(`${API_BASE_URL}${PRODUCTS_END_POINT}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                // Defaulting isActive to true since the current endpoint only returns active ones
                const mappedProducts = (data.products || []).map((p: any) => ({
                    ...p, isActive: p.isActive !== undefined ? p.isActive : true 
                }));
                setProducts(mappedProducts);
            } else {
                showToast(data.message || "Failed to fetch products", "error");
            }
        } catch (error) {
            showToast("Failed to fetch products", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const toggleActivation = async (productId: string, currentStatus: boolean) => {
        if (!token) return;
        setUpdatingStatus(prev => ({ ...prev, [productId]: true }));
        try {
            const response = await fetch(`${API_BASE_URL}${PRODUCT_ACTIVATION_ENDPOINT(productId)}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ isActive: !currentStatus }),
            });

            if (response.ok) {
                setProducts(prev => prev.map(p => 
                    p.productId === productId ? { ...p, isActive: !currentStatus } : p
                ));
                showToast(`Product ${!currentStatus ? 'Activated' : 'Deactivated'}`, "success");
            } else {
                const errorData = await response.json();
                showToast(errorData.message || "Failed to update status", "error");
            }
        } catch (error) {
            showToast("Network error", "error");
        } finally {
            setUpdatingStatus(prev => ({ ...prev, [productId]: false }));
        }
    };

    const handleCreateProduct = async () => {
        // TO DO: Wire to backend once the POST endpoint is created
        showToast("Backend POST endpoint missing. Form data ready!", "info");
        console.log("Submitting:", formData);
        // setIsCreating(false);
    };
    //#endregion

    useFocusEffect(
        useCallback(() => {
            if (!isPM) {
                navigateWithWipe("/");
                return;
            }
            fetchProducts().then(() => revealWipe());
        }, [isPM])
    );

    if (!isPM) return null;

    //#region RENDERERS
    const renderProductCard = ({ item }: { item: PMProduct }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <Text style={styles.cardSubtitle}>{item.model} | {item.serialNumber}</Text>
                    <Text style={styles.cardSubtitle}>Stock: {item.quantityInStocks}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: item.isActive ? Colors.light.greenButtonBackground : Colors.light.deleteButtonBackground }]}>
                    <Text style={styles.statusBadgeText}>{item.isActive ? "Active" : "Inactive"}</Text>
                </View>
            </View>
            
            <WrappedGeneralButton
                title={item.isActive ? "Deactivate Product" : "Activate Product"}
                disabled={updatingStatus[item.productId]}
                wrapperStyles={[styles.actionButton, item.isActive ? styles.deactivateBtn : styles.activateBtn]}
                textStyles={styles.actionButtonText}
                onPress={() => toggleActivation(item.productId, item.isActive || false)}
            />
        </View>
    );

    const renderCreationForm = () => (
        <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            <TouchableOpacity style={styles.backButton} onPress={() => setIsCreating(false)}>
                <Ionicons name="arrow-back" size={24} color={Colors.light.greenButtonBackground} />
                <Text style={styles.backButtonText}>Back to List</Text>
            </TouchableOpacity>

            <Text style={styles.pageTitle}>Create New Product</Text>
            <Text style={styles.formNote}>Note: Pricing is handled separately by the Sales Manager.</Text>

            <View style={styles.formGrid}>
                {/* Basic Text Inputs */}
                {['name', 'categoryId', 'model', 'serialNumber', 'warrantyStatus', 'distributorInfo', 'fuelType'].map((field) => (
                    <View key={field} style={styles.inputGroup}>
                        <Text style={styles.label}>{field.toUpperCase()}</Text>
                        <TextInput 
                            style={styles.input} 
                            placeholder={`Enter ${field}`}
                            value={(formData as any)[field]}
                            onChangeText={(val) => setFormData(prev => ({...prev, [field]: val}))}
                        />
                    </View>
                ))}

                {/* Numeric Inputs */}
                {['quantityInStocks', 'berthCount', 'weightKg'].map((field) => (
                    <View key={field} style={styles.inputGroup}>
                        <Text style={styles.label}>{field.toUpperCase()}</Text>
                        <TextInput 
                            style={styles.input} 
                            keyboardType="numeric"
                            value={(formData as any)[field]}
                            onChangeText={(val) => setFormData(prev => ({...prev, [field]: val}))}
                        />
                    </View>
                ))}
            </View>

            <View style={styles.fullWidthInput}>
                <Text style={styles.label}>DESCRIPTION</Text>
                <TextInput 
                    style={[styles.input, styles.textArea]} 
                    multiline 
                    value={formData.description}
                    onChangeText={(val) => setFormData(prev => ({...prev, description: val}))}
                />
            </View>

            <View style={styles.switchGroup}>
                <Text style={styles.label}>HAS KITCHEN?</Text>
                <Switch 
                    value={formData.hasKitchen} 
                    onValueChange={(val) => setFormData(prev => ({...prev, hasKitchen: val}))} 
                    trackColor={{ true: Colors.light.greenButtonBackground }}
                />
            </View>

            <WrappedGeneralButton
                title="Save Product (Pending Backend)"
                wrapperStyles={styles.saveButton}
                textStyles={styles.actionButtonText}
                onPress={handleCreateProduct}
            />
            <View style={{height: 40}} /> 
        </ScrollView>
    );
    //#endregion

    return (
        <View style={styles.mainContainer}>
            <Navbar />
            <View style={styles.contentContainer}>
                {isCreating ? (
                    renderCreationForm()
                ) : (
                    <>
                        <View style={styles.listHeader}>
                            <Text style={styles.pageTitle}>Product Management</Text>
                            <WrappedGeneralButton
                                title="+ Add Product"
                                wrapperStyles={styles.addButton}
                                textStyles={styles.actionButtonText}
                                onPress={() => setIsCreating(true)}
                            />
                        </View>

                        {isLoading ? (
                            <ActivityIndicator size="large" color={Colors.light.greenButtonBackground} style={{ marginTop: 50 }} />
                        ) : (
                            <FlatList
                                data={products}
                                keyExtractor={(item) => item.productId}
                                renderItem={renderProductCard}
                                contentContainerStyle={{ paddingBottom: 30 }}
                                showsVerticalScrollIndicator={false}
                            />
                        )}
                    </>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: Colors.light.salesManagerBackground },
    contentContainer: { flex: 1, width: "100%", maxWidth: 1000, alignSelf: "center", padding: 20 },
    pageTitle: { fontFamily: Fonts.bold, fontSize: 28, color: Colors.light.greenButtonBackground },
    
    listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    addButton: { backgroundColor: '#a94c0f', padding: 12, borderRadius: 8 },
    
    // Cards
    card: { backgroundColor: Colors.light.softContainerBackground, borderRadius: 8, padding: 16, marginBottom: 16 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    cardTitle: { fontFamily: Fonts.bold, fontSize: 18, color: Colors.light.greenButtonBackground },
    cardSubtitle: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.light.mainTextColor, marginTop: 4 },
    statusBadge: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, height: 30 },
    statusBadgeText: { fontFamily: Fonts.semibold, color: '#fff', fontSize: 12 },
    
    // Buttons
    actionButton: { padding: 12, borderRadius: 8, alignItems: 'center' },
    activateBtn: { backgroundColor: Colors.light.greenButtonBackground },
    deactivateBtn: { backgroundColor: Colors.light.deleteButtonBackground },
    actionButtonText: { fontFamily: Fonts.bold, color: '#fff', fontSize: 14 },

    // Form
    formContainer: { flex: 1, backgroundColor: Colors.light.softContainerBackground, padding: 30, borderRadius: 12 },
    backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    backButtonText: { fontFamily: Fonts.semibold, color: Colors.light.greenButtonBackground, marginLeft: 8 },
    formNote: { fontFamily: Fonts.regular, color: '#a94c0f', marginBottom: 20 },
    formGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
    inputGroup: { flex: 1, minWidth: 250, marginBottom: 16 },
    fullWidthInput: { width: '100%', marginBottom: 16 },
    label: { fontFamily: Fonts.semibold, fontSize: 12, color: Colors.light.basePriceDiscountedTextColor, marginBottom: 8 },
    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#c8bd96', borderRadius: 8, padding: 12, fontFamily: Fonts.regular },
    textArea: { height: 100, textAlignVertical: 'top' },
    switchGroup: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 30 },
    saveButton: { backgroundColor: Colors.light.greenButtonBackground, padding: 15, borderRadius: 8, alignItems: 'center' }
});