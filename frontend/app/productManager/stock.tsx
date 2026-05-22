import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TextInput } from "react-native";
import { useFocusEffect } from "expo-router";

import Navbar from "@/components/Navbar/Navbar";
import WrappedGeneralButton from "@/components/Buttons/GeneralButtonWithWrapper/GeneralButtonWithWrapper";

import { API_BASE_URL, PRODUCTS_END_POINT } from "@/constants/API";
import { Colors, Fonts } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useTransition } from "@/context/TransitionContext";

// --- TYPES ---
interface PMStockProduct {
    productId: string;
    name: string;
    model: string;
    serialNumber: string;
    quantityInStocks: number;
}

export default function ProductManagerStock() {
    const { token, user } = useAuth();
    const { showToast } = useToast();
    const { navigateWithWipe, revealWipe } = useTransition();

    const [products, setProducts] = useState<PMStockProduct[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // We store the new stock inputs in a dictionary keyed by productId
    const [stockInputs, setStockInputs] = useState<Record<string, string>>({});
    const [searchQuery, setSearchQuery] = useState("");

    const isPM = user?.role === "product_manager";

    //#region API FUNCTIONS
    const fetchProducts = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}${PRODUCTS_END_POINT}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await response.json();
            
            if (response.ok) {
                const fetchedProducts = data.products || [];
                setProducts(fetchedProducts);

                // Pre-fill the input boxes with their current stock numbers
                const initialInputs: Record<string, string> = {};
                fetchedProducts.forEach((p: PMStockProduct) => {
                    initialInputs[p.productId] = p.quantityInStocks.toString();
                });
                setStockInputs(initialInputs);
            } else {
                showToast(data.message || "Failed to fetch products", "error");
            }
        } catch (error) {
            showToast("Network error", "error");
        } finally {
            setIsLoading(false);
        }
    };

    // --- PENDING BACKEND ENDPOINT ---
   const handleUpdateStock = async (productId: string) => {
        if (!token) return;
        
        const newStockValue = stockInputs[productId];
        
        if (!newStockValue || isNaN(Number(newStockValue)) || Number(newStockValue) < 0) {
            showToast("Please enter a valid positive number", "error");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/v3/products/${productId}/stock`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ quantityInStocks: Number(newStockValue) })
            });

            const data = await response.json();
            
            if (response.ok) {
                // Update local state instantly so the UI reflects the change
                setProducts(prev => prev.map(p => 
                    p.productId === productId ? { ...p, quantityInStocks: Number(newStockValue) } : p
                ));
                showToast("Stock updated successfully.", "success");
            } else {
                showToast(data.message || "Failed to update stock", "error");
            }
        } catch (error) {
            showToast("Network error updating stock", "error");
        }
    };
    //#endregion

    //#region FILTERING
    const filteredProducts = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return products.filter(product => {
            if (!query) return true;
            return (
                product.name.toLowerCase().includes(query) ||
                product.serialNumber.toLowerCase().includes(query) ||
                product.model.toLowerCase().includes(query)
            );
        });
    }, [products, searchQuery]);
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

    //#region RENDER CARD
    const renderStockCard = ({ item }: { item: PMStockProduct }) => (
        <View style={styles.card}>
            <View style={styles.cardInfo}>
                <Text style={styles.productTitle}>{item.name}</Text>
                <Text style={styles.productSubtitle}>{item.model} | {item.serialNumber}</Text>
                <Text style={styles.productId}>ID: {item.productId}</Text>
            </View>
            
            <View style={styles.stockControlContainer}>
                <View style={styles.currentStockContainer}>
                    <Text style={styles.stockLabel}>Current Stock</Text>
                    <Text style={[styles.stockValue, item.quantityInStocks === 0 && styles.outOfStock]}>
                        {item.quantityInStocks}
                    </Text>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.stockLabel}>New Stock</Text>
                    <TextInput
                        style={styles.stockInput}
                        keyboardType="numeric"
                        value={stockInputs[item.productId] || ""}
                        onChangeText={(val) => setStockInputs(prev => ({ ...prev, [item.productId]: val.replace(/[^0-9]/g, '') }))}
                        maxLength={5}
                    />
                </View>

                <WrappedGeneralButton
                    title="Update"
                    wrapperStyles={styles.updateButton}
                    textStyles={styles.updateButtonText}
                    onPress={() => handleUpdateStock(item.productId)}
                    // Disable button if the input matches current stock, preventing unnecessary API calls
                    disabled={stockInputs[item.productId] === item.quantityInStocks.toString()} 
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
                    <Text style={styles.pageTitle}>Inventory & Stock Adjustment</Text>
                    <WrappedGeneralButton
                        title="Refresh"
                        disabled={isLoading}
                        wrapperStyles={styles.refreshButton}
                        textStyles={styles.updateButtonText}
                        onPress={fetchProducts}
                    />
                </View>

                <View style={styles.searchContainer}>
                    <Text style={styles.searchLabel}>Search Product</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by name, model, or serial..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {isLoading ? (
                    <ActivityIndicator size="large" color={Colors.light.greenButtonBackground} style={{ marginTop: 50 }} />
                ) : filteredProducts.length === 0 ? (
                    <Text style={styles.emptyText}>No products found.</Text>
                ) : (
                    <FlatList
                        data={filteredProducts}
                        keyExtractor={(item) => item.productId}
                        renderItem={renderStockCard}
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
    contentContainer: { flex: 1, width: "100%", maxWidth: 1000, alignSelf: "center", padding: 20 },
    
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    pageTitle: { fontFamily: Fonts.bold, fontSize: 28, color: Colors.light.greenButtonBackground },
    refreshButton: { backgroundColor: Colors.light.greenButtonBackground, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
    
    searchContainer: { backgroundColor: Colors.light.softContainerBackground, padding: 15, borderRadius: 8, marginBottom: 20 },
    searchLabel: { fontFamily: Fonts.semibold, fontSize: 13, color: Colors.light.greenButtonBackground, marginBottom: 6 },
    searchInput: { height: 42, borderWidth: 1, borderColor: "#c8bd96", borderRadius: 8, paddingHorizontal: 12, backgroundColor: "#fff", fontFamily: Fonts.regular },

    emptyText: { textAlign: 'center', fontFamily: Fonts.semibold, fontSize: 16, color: Colors.light.greenButtonBackground, marginTop: 40 },

    /* CARD STYLES */
    card: { 
        backgroundColor: Colors.light.softContainerBackground, 
        borderRadius: 8, 
        padding: 20, 
        marginBottom: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 20
    },
    cardInfo: { flex: 1, minWidth: 250 },
    productTitle: { fontFamily: Fonts.bold, fontSize: 20, color: Colors.light.greenButtonBackground, marginBottom: 4 },
    productSubtitle: { fontFamily: Fonts.semibold, fontSize: 14, color: Colors.light.mainTextColor, marginBottom: 4 },
    productId: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.light.basePriceDiscountedTextColor },
    
    stockControlContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: 20 },
    
    currentStockContainer: { alignItems: 'center', minWidth: 80 },
    stockLabel: { fontFamily: Fonts.semibold, fontSize: 12, color: Colors.light.basePriceDiscountedTextColor, marginBottom: 8 },
    stockValue: { fontFamily: Fonts.bold, fontSize: 24, color: Colors.light.greenButtonBackground },
    outOfStock: { color: Colors.light.deleteButtonBackground },

    inputContainer: { minWidth: 100 },
    stockInput: { height: 42, borderWidth: 1, borderColor: "#c8bd96", borderRadius: 8, paddingHorizontal: 12, backgroundColor: "#fff", fontFamily: Fonts.bold, fontSize: 16, textAlign: 'center', color: Colors.light.mainTextColor },
    
    updateButton: { backgroundColor: '#a94c0f', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, minWidth: 100, alignItems: 'center' },
    updateButtonText: { fontFamily: Fonts.bold, color: '#fff', fontSize: 14 },
});