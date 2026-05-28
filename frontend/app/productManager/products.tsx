import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, ActivityIndicator, TouchableOpacity, ScrollView, Switch } from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import Navbar from "@/components/Navbar/Navbar";
import ManagerFilterPanel from '@/components/ManagerUI/ManagerFilterPanel';
import WrappedGeneralButton from "@/components/Buttons/GeneralButtonWithWrapper/GeneralButtonWithWrapper";
import SortDropdown from "@/components/DropDowns/SortDropdown/SortDropdown"; 

import { API_BASE_URL, PRODUCTS_END_POINT, PRODUCT_ACTIVATION_ENDPOINT, CREATE_PRODUCT_ENDPOINT, CATEGORIES_ENDPOINT } from "@/constants/API";
import { Colors, Fonts } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useTransition } from "@/context/TransitionContext";

interface PMProduct {
    productId: string;
    categoryId?: string;
    name: string;
    model: string;
    serialNumber: string;
    description?: string;
    quantityInStocks: number;
    warrantyStatus?: string;
    distributorInfo?: string | null;
    berthCount?: number;
    fuelType?: string;
    weightKg?: number;
    hasKitchen?: boolean;
    createdAt?: string;
    updatedAt?: string;
    isActive?: boolean;
}

const PM_PRODUCT_SORT_OPTIONS = [
    { label: "Status: Active First", value: "active" },
    { label: "Status: Inactive First", value: "inactive" },
    { label: "Stock: Highest First", value: "stock-desc" },
    { label: "Stock: Lowest First", value: "stock-asc" }
];

export default function ProductManagerProducts() {
    const { token, user } = useAuth();
    const { showToast } = useToast();
    const { navigateWithWipe, revealWipe } = useTransition();

    const [products, setProducts] = useState<PMProduct[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({});
    const [productSearchFilter, setProductSearchFilter] = useState("");
    const [productSort, setProductSort] = useState("active");

  
    const [categoriesDropdown, setCategoriesDropdown] = useState<{label: string, value: string}[]>([]);

    const [formData, setFormData] = useState({
        name: "", categoryId: "", model: "", serialNumber: "",
        description: "", quantityInStocks: "0", warrantyStatus: "",
        distributorInfo: "", berthCount: "0", fuelType: "", weightKg: "0", hasKitchen: false
    });

    const isPM = user?.role === "product_manager";

   
    const textInputConfig = [
        { field: 'name', label: 'NAME', placeholder: 'e.g., Eco Camper Van' },
        { field: 'model', label: 'MODEL', placeholder: 'e.g., ECO-2026' },
        { field: 'serialNumber', label: 'SERIAL NUMBER', placeholder: 'e.g., SN-000002' },
        { field: 'warrantyStatus', label: 'WARRANTY STATUS', placeholder: 'e.g., 2 Years' },
        { field: 'distributorInfo', label: 'DISTRIBUTOR INFO', placeholder: 'e.g., Direct Sales' },
        { field: 'fuelType', label: 'FUEL TYPE', placeholder: 'e.g., Diesel' }
    ];

    const numericInputConfig = [
        { field: 'quantityInStocks', label: 'QUANTITY IN STOCKS', placeholder: 'e.g., 5' },
        { field: 'berthCount', label: 'BERTH COUNT', placeholder: 'e.g., 4' },
        { field: 'weightKg', label: 'WEIGHT KG', placeholder: 'e.g., 1800' }
    ];

    const fetchProducts = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}${PRODUCTS_END_POINT}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                const mappedProducts = (data.products || []).map((p: any) => ({
                    ...p, 
                    isActive: p.isActive !== undefined ? p.isActive : (p.is_active !== undefined ? p.is_active : true)
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


    const fetchCategories = async () => {
        if (!token) return;
        try {
            const response = await fetch(`${API_BASE_URL}${CATEGORIES_ENDPOINT}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
              
                const mappedCategories = (data.categories || [])
                    .filter((c: any) => c.isActive !== false && c.is_active !== false) 
                    .map((c: any) => ({
                        label: c.categoryName,
                        value: c.categoryId
                    }));
                
                setCategoriesDropdown(mappedCategories);

             
                if (mappedCategories.length > 0) {
                    setFormData(prev => ({ ...prev, categoryId: mappedCategories[0].value }));
                }
            }
        } catch (error) {
            console.error("Failed to fetch categories");
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
        if (!token) return;
        
        if (!formData.name || !formData.categoryId || !formData.model) {
            showToast("Name, Category, and Model are required.", "error");
            return;
        }

        setIsLoading(true);
        try {
            const payload = {
                categoryId: formData.categoryId,
                name: formData.name,
                model: formData.model,
                serialNumber: formData.serialNumber,
                description: formData.description,
                quantityInStocks: Number(formData.quantityInStocks) || 0,
                warrantyStatus: formData.warrantyStatus,
                distributorInfo: formData.distributorInfo || null,
                berthCount: Number(formData.berthCount) || 0,
                fuelType: formData.fuelType,
                weightKg: Number(formData.weightKg) || 0,
                hasKitchen: formData.hasKitchen,
                images: [] 
            };

            const response = await fetch(`${API_BASE_URL}${CREATE_PRODUCT_ENDPOINT}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                showToast("Product created successfully (Pending Price)", "success");
                setIsCreating(false);
                fetchProducts(); 
            } else {
                showToast(data.message || "Failed to create product", "error");
            }
        } catch (error) {
            showToast("Network error while creating product", "error");
        } finally {
            setIsLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (!isPM) {
                navigateWithWipe("/");
                return;
            }
           
            Promise.all([fetchProducts(), fetchCategories()]).then(() => revealWipe());
        }, [isPM])
    );
    const filteredProducts = useMemo(() => {
        const searchValue = productSearchFilter.trim().toLowerCase();
        return [...products]
            .filter((product) => {
                if (!searchValue) return true;
                const searchText = [
                    product.name,
                    product.model,
                    product.serialNumber,
                    product.productId,
                    product.categoryId || "",
                    product.fuelType || "",
                ].join(" ").toLowerCase();

                return searchText.includes(searchValue);
            })
            .sort((firstProduct, secondProduct) => {
                if (productSort === "active") {
                    if (!!firstProduct.isActive && !secondProduct.isActive) return -1;
                    if (!!secondProduct.isActive && !firstProduct.isActive) return 1;
                }

                if (productSort === "inactive") {
                    if (!firstProduct.isActive && !!secondProduct.isActive) return -1;
                    if (!secondProduct.isActive && !!firstProduct.isActive) return 1;
                }

                if (productSort === "stock-desc") {
                    return secondProduct.quantityInStocks - firstProduct.quantityInStocks;
                }

                if (productSort === "stock-asc") {
                    return firstProduct.quantityInStocks - secondProduct.quantityInStocks;
                }

                return firstProduct.name.localeCompare(secondProduct.name);
            });
    }, [products, productSearchFilter, productSort]);

    if (!isPM) return null;

    function clearFiltersButtonFunction(): void {
        setProductSearchFilter("");
        setProductSort("active");
    }

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

            <View style={styles.detailGrid}>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Product ID</Text>
                    <Text style={styles.detailValue}>{item.productId}</Text>
                </View>

                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Category ID</Text>
                    <Text style={styles.detailValue}>{item.categoryId || "N/A"}</Text>
                </View>

                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Warranty</Text>
                    <Text style={styles.detailValue}>{item.warrantyStatus || "N/A"}</Text>
                </View>

                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Fuel Type</Text>
                    <Text style={styles.detailValue}>{item.fuelType || "N/A"}</Text>
                </View>

                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Berth Count</Text>
                    <Text style={styles.detailValue}>{item.berthCount ?? "N/A"}</Text>
                </View>

                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Has Kitchen</Text>
                    <Text style={styles.detailValue}>{item.hasKitchen === undefined ? "N/A" : item.hasKitchen ? "Yes" : "No"}</Text>
                </View>
            </View>

            {item.description ? (
                <View style={styles.descriptionContainer}>
                    <Text style={styles.detailLabel}>Description</Text>
                    <Text style={styles.descriptionText}>{item.description}</Text>
                </View>
            ) : null}
            
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
                
                {/* --- NEW: THE DROPDOWN UI --- */}
                {/* We use zIndex: 10 to ensure the dropdown menu opens ON TOP of the other fields below it */}
                <View style={[styles.inputGroup, { zIndex: 10 }]}>
                    <Text style={styles.label}>CATEGORY</Text>
                    {categoriesDropdown.length > 0 ? (
                        <SortDropdown
                            options={categoriesDropdown}
                            selectedValue={formData.categoryId}
                            onChange={(val) => setFormData(prev => ({...prev, categoryId: val}))}
                            containerStyle={{ width: '100%' }}
                            triggerStyle={styles.input}
                        />
                    ) : (
                        <Text style={[styles.input, { color: Colors.light.deleteButtonBackground }]}>
                            No active categories found! Create one first.
                        </Text>
                    )}
                </View>

                {textInputConfig.map(({ field, label, placeholder }) => (
                    <View key={field} style={styles.inputGroup}>
                        <Text style={styles.label}>{label}</Text>
                        <TextInput 
                            style={styles.input} 
                            placeholder={placeholder}
                            placeholderTextColor="#a09a80"
                            value={(formData as any)[field]}
                            onChangeText={(val) => setFormData(prev => ({...prev, [field]: val}))}
                        />
                    </View>
                ))}

                {numericInputConfig.map(({ field, label, placeholder }) => (
                    <View key={field} style={styles.inputGroup}>
                        <Text style={styles.label}>{label}</Text>
                        <TextInput 
                            style={styles.input} 
                            placeholder={placeholder}
                            placeholderTextColor="#a09a80"
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
                    placeholder="e.g., This lightweight, off-grid camper features solar panels and..."
                    placeholderTextColor="#a09a80"
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
                title="Save Product"
                wrapperStyles={styles.saveButton}
                textStyles={styles.actionButtonText}
                onPress={handleCreateProduct}
            />
            <View style={{height: 40}} /> 
        </ScrollView>
    );

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

                        <ManagerFilterPanel>
                            <View style={styles.filterInputContainer}>
                                <Text style={styles.filterLabel}>Search Product</Text>
                                <TextInput
                                    style={styles.filterInput}
                                    value={productSearchFilter}
                                    onChangeText={setProductSearchFilter}
                                    placeholder="Name, model, serial, product ID..."
                                    placeholderTextColor="#a09a80"
                                />
                            </View>

                            <View style={styles.filterInputContainer}>
                                <Text style={styles.filterLabel}>Sort</Text>
                                <SortDropdown
                                    options={PM_PRODUCT_SORT_OPTIONS}
                                    selectedValue={productSort}
                                    onChange={(newValue) => setProductSort(newValue)}
                                    containerStyle={{ width: "100%" }}
                                    triggerStyle={styles.filterInput}
                                />
                            </View>

                            <View style={styles.filterButtonContainer}>
                                <WrappedGeneralButton
                                    title="Clear Filters"
                                    wrapperStyles={styles.filterButton}
                                    textStyles={styles.actionButtonText}
                                    onPress={clearFiltersButtonFunction}
                                />
                            </View>
                        </ManagerFilterPanel>

                        {isLoading ? (
                            <ActivityIndicator size="large" color={Colors.light.greenButtonBackground} style={{ marginTop: 50 }} />
                        ) : (
                            <FlatList
                                data={filteredProducts}
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

    filterContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        backgroundColor: Colors.light.softContainerBackground,
        borderRadius: 8,
        padding: 14,
        marginBottom: 16,
        zIndex: 10,
    },
    filterInputContainer: { flex: 1, minWidth: 220, zIndex: 20 },
    filterLabel: {
        marginBottom: 6,
        fontFamily: Fonts.semibold,
        fontSize: 13,
        color: Colors.light.greenButtonBackground,
    },
    filterInput: {
        height: 42,
        borderWidth: 1,
        borderColor: '#c8bd96',
        borderRadius: 8,
        paddingHorizontal: 12,
        backgroundColor: '#fff',
        fontFamily: Fonts.regular,
        justifyContent: 'center',
    },
    filterButtonContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
    filterButton: {
        minWidth: 130,
        backgroundColor: Colors.light.greenButtonBackground,
        borderRadius: 8,
        paddingVertical: 11,
        paddingHorizontal: 14,
        alignItems: 'center',
    },
    
    card: { backgroundColor: Colors.light.softContainerBackground, borderRadius: 8, padding: 16, marginBottom: 16 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    cardTitle: { fontFamily: Fonts.bold, fontSize: 18, color: Colors.light.greenButtonBackground },
    cardSubtitle: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.light.mainTextColor, marginTop: 4 },
    statusBadge: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, height: 30 },
    statusBadgeText: { fontFamily: Fonts.semibold, color: '#fff', fontSize: 12 },

    detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
    detailItem: { flex: 1, minWidth: 210, backgroundColor: '#fff', borderRadius: 8, padding: 12 },
    detailLabel: { marginBottom: 4, fontFamily: Fonts.semibold, fontSize: 12, color: Colors.light.basePriceDiscountedTextColor },
    detailValue: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.light.mainTextColor },
    descriptionContainer: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 12 },
    descriptionText: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.light.mainTextColor, lineHeight: 20 },
    
    actionButton: { padding: 12, borderRadius: 8, alignItems: 'center' },
    activateBtn: { backgroundColor: Colors.light.greenButtonBackground },
    deactivateBtn: { backgroundColor: Colors.light.deleteButtonBackground },
    actionButtonText: { fontFamily: Fonts.bold, color: '#fff', fontSize: 14 },

    formContainer: { flex: 1, backgroundColor: Colors.light.softContainerBackground, padding: 30, borderRadius: 12 },
    backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    backButtonText: { fontFamily: Fonts.semibold, color: Colors.light.greenButtonBackground, marginLeft: 8 },
    formNote: { fontFamily: Fonts.regular, color: '#a94c0f', marginBottom: 20 },
    formGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
    inputGroup: { flex: 1, minWidth: 250, marginBottom: 16 },
    fullWidthInput: { width: '100%', marginBottom: 16 },
    label: { fontFamily: Fonts.semibold, fontSize: 12, color: Colors.light.basePriceDiscountedTextColor, marginBottom: 8 },
    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#c8bd96', borderRadius: 8, padding: 12, fontFamily: Fonts.regular, height: 45, justifyContent: 'center' },
    textArea: { height: 100, textAlignVertical: 'top' },
    switchGroup: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 30 },
    saveButton: { backgroundColor: Colors.light.greenButtonBackground, padding: 15, borderRadius: 8, alignItems: 'center' }
});