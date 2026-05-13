//#region IMPORTS
import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import Navbar from "@/components/Navbar/Navbar";
import CustomMultiSelect from "@/components/DropDowns/CustomMultiSelect/CustomMultiSelect";
import SortDropdown from "@/components/DropDowns/SortDropdown/SortDropdown";
import WrappedGeneralButton from "@/components/Buttons/GeneralButtonWithWrapper/GeneralButtonWithWrapper";

import { API_BASE_URL, PRODUCTS_END_POINT } from "@/constants/API";
import { Colors, Fonts } from "@/constants/theme";
import { modelData, priceData, fuelData, weightData, kitchenData, sortOptions } from "@/constants/MOCKDATA";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useTransition } from "@/context/TransitionContext";
import { useUser } from "@/context/UserContext";
//#endregion


//#region API NAMES
const updateProductDiscountApi = (productId: string) => `/api/v3/products/${productId}/discount`;
//#endregion


//#region TYPES
interface SalesManagerProductImage {
    imageId: string;
    url: string;
    isPrimary: boolean;
    createdAt: string;
}

interface SalesManagerProduct {
    productId: string;
    categoryId: string;
    name: string;
    model: string;
    serialNumber: string;
    description: string;
    quantityInStocks: number;
    basePrice: number | string;
    currentPrice: number | string;
    warrantyStatus: string;
    distributorInfo: string | null;
    berthCount: number;
    fuelType: string;
    weightKg: number;
    hasKitchen: boolean;
    discountRate: number;
    averageRating: number;
    reviewCount: number;
    createdAt: string;
    updatedAt: string;
    images: SalesManagerProductImage[];
}

interface FetchProductsResponse {
    message: string;
    products: SalesManagerProduct[];
}

interface UpdateDiscountResponse {
    message: string;
    product: {
        productId: string;
        name: string;
        basePrice: string | number;
        currentPrice: string | number;
        discountRate: number;
    };
    previousDiscountRate: number;
}

interface SalesManagerProductCardProps {
    product: SalesManagerProduct;
    discountInput: string;
    isUpdating: boolean;
    onDiscountInputChange: (productId: string, value: string) => void;
    onUpdateDiscount: (productId: string) => void;
}
//#endregion


//#region HELPER FUNCTIONS
function formatDate(dateString: string): string
{
    if (!dateString) return "Unknown Date";

    return dateString.split("T")[0];
}

function toNumber(value: number | string): number
{
    return Number(value || 0);
}

function formatCurrency(value: number | string): string
{
    return `$${toNumber(value).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

function formatBoolean(value: boolean): string
{
    return value ? "Yes" : "No";
}

function formatDiscountInput(text: string): string
{
    const numericText = text.replace(/[^0-9.]/g, "");
    const [integerPart, decimalPart] = numericText.split(".");
    const limitedIntegerPart = integerPart.slice(0, 3);

    if (decimalPart === undefined) return limitedIntegerPart;

    return `${limitedIntegerPart}.${decimalPart.slice(0, 2)}`;
}

function isValidDiscount(discountInput: string): boolean
{
    if (discountInput.trim().length === 0) return false;

    const discount = Number(discountInput);
    return Number.isFinite(discount) && discount >= 0 && discount <= 100;
}

function getSearchText(product: SalesManagerProduct): string
{
    return [
        product.productId,
        product.categoryId,
        product.name,
        product.model,
        product.serialNumber,
        product.description,
        product.warrantyStatus,
        product.distributorInfo || "",
        product.fuelType,
    ].join(" ").toLowerCase();
}

function doesProductMatchPriceRange(product: SalesManagerProduct, selectedPrices: string[]): boolean
{
    if (selectedPrices.length === 0) return true;

    const price = toNumber(product.currentPrice);

    return selectedPrices.some(range => {
        if (range === "under_50k") return price < 50000;
        if (range === "50k_to_100k") return price >= 50000 && price <= 100000;
        if (range === "100k_to_150k") return price > 100000 && price <= 150000;
        if (range === "150k_to_200k") return price > 150000 && price <= 200000;
        if (range === "200k_to_250k") return price > 200000 && price <= 250000;
        if (range === "250k_to_300k") return price > 250000 && price <= 300000;
        if (range === "300k_to_350k") return price > 300000 && price <= 350000;
        if (range === "350k_to_400k") return price > 350000 && price <= 400000;
        if (range === "400k_to_450k") return price > 400000 && price <= 450000;
        if (range === "450k_to_500k") return price > 450000 && price <= 500000;
        if (range === "over_500k") return price > 500000;

        return false;
    });
}

function doesProductMatchWeightRange(product: SalesManagerProduct, selectedWeights: string[]): boolean
{
    if (selectedWeights.length === 0) return true;

    return selectedWeights.some(weightCategory => {
        if (weightCategory === "lightweight") return product.weightKg < 1500;
        if (weightCategory === "standard") return product.weightKg >= 1500 && product.weightKg < 2000;
        if (weightCategory === "heavyweight") return product.weightKg >= 2000;

        return false;
    });
}

async function readResponseJson<T>(response: Response): Promise<T | null>
{
    try {
        return await response.json();
    } catch {
        return null;
    }
}
//#endregion


//#region PRODUCT CARD COMPONENT
function SalesManagerProductCard({ product, discountInput, isUpdating, onDiscountInputChange, onUpdateDiscount }: SalesManagerProductCardProps)
{
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    function nextImage()
    {
        if (!product.images || product.images.length <= 1) return;

        setCurrentImageIndex((prevIndex) =>
            prevIndex === product.images.length - 1 ? 0 : prevIndex + 1
        );
    }

    function prevImage()
    {
        if (!product.images || product.images.length <= 1) return;

        setCurrentImageIndex((prevIndex) =>
            prevIndex === 0 ? product.images.length - 1 : prevIndex - 1
        );
    }

    return (
        <View style={styles.productCard}>
            <View style={styles.productCardHeader}>
                <View style={styles.productTitleContainer}>
                    <Text style={styles.productTitle}>{product.name}</Text>
                    <Text style={styles.productSubtitle}>{product.model} | {product.serialNumber}</Text>
                </View>

                <View style={styles.discountBadge}>
                    <Text style={styles.discountBadgeText}>{product.discountRate}% Discount</Text>
                </View>
            </View>

            <View style={styles.productBodyContainer}>
                <View style={styles.imageContainer}>
                    {product.images && product.images.length > 0 ? (
                        <>
                            <Image
                                source={{ uri: product.images[currentImageIndex].url }}
                                style={styles.productImage}
                                resizeMode="cover"
                            />

                            {product.images.length > 1 && (
                                <>
                                    <Pressable style={[styles.imageArrowButton, styles.imageArrowButtonLeft]} onPress={prevImage}>
                                        <Ionicons name="chevron-back" size={24} color="white" />
                                    </Pressable>

                                    <Pressable style={[styles.imageArrowButton, styles.imageArrowButtonRight]} onPress={nextImage}>
                                        <Ionicons name="chevron-forward" size={24} color="white" />
                                    </Pressable>
                                </>
                            )}
                        </>
                    ) : (
                        <View style={styles.emptyImageContainer}>
                            <Ionicons name="image-outline" size={32} color="#ccc" />
                        </View>
                    )}
                </View>

                <View style={styles.detailGrid}>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Product ID</Text>
                        <Text style={styles.detailValue}>{product.productId}</Text>
                    </View>

                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Category ID</Text>
                        <Text style={styles.detailValue}>{product.categoryId}</Text>
                    </View>

                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Quantity In Stocks</Text>
                        <Text style={styles.detailValue}>{product.quantityInStocks}</Text>
                    </View>

                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Base Price</Text>
                        <Text style={styles.detailValue}>{formatCurrency(product.basePrice)}</Text>
                    </View>

                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Current Price</Text>
                        <Text style={styles.detailValue}>{formatCurrency(product.currentPrice)}</Text>
                    </View>

                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Warranty Status</Text>
                        <Text style={styles.detailValue}>{product.warrantyStatus}</Text>
                    </View>

                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Distributor Info</Text>
                        <Text style={styles.detailValue}>{product.distributorInfo || "N/A"}</Text>
                    </View>

                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Berth Count</Text>
                        <Text style={styles.detailValue}>{product.berthCount}</Text>
                    </View>

                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Fuel Type</Text>
                        <Text style={styles.detailValue}>{product.fuelType}</Text>
                    </View>

                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Weight KG</Text>
                        <Text style={styles.detailValue}>{product.weightKg}</Text>
                    </View>

                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Has Kitchen</Text>
                        <Text style={styles.detailValue}>{formatBoolean(product.hasKitchen)}</Text>
                    </View>

                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Rating</Text>
                        <Text style={styles.detailValue}>{product.averageRating} / 5 ({product.reviewCount})</Text>
                    </View>

                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Created At</Text>
                        <Text style={styles.detailValue}>{formatDate(product.createdAt)}</Text>
                    </View>

                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Updated At</Text>
                        <Text style={styles.detailValue}>{formatDate(product.updatedAt)}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.descriptionContainer}>
                <Text style={styles.detailLabel}>Description</Text>
                <Text style={styles.descriptionText}>{product.description}</Text>
            </View>

            <View style={styles.imagesContainer}>
                <Text style={styles.sectionTitle}>Images</Text>
                {product.images && product.images.length > 0 ? (
                    product.images.map(image => (
                        <View key={image.imageId} style={styles.imageDetailContainer}>
                            <Text style={styles.imageDetailText}>Image ID: {image.imageId}</Text>
                            <Text style={styles.imageDetailText}>URL: {image.url}</Text>
                            <Text style={styles.imageDetailText}>Primary: {formatBoolean(image.isPrimary)}</Text>
                            <Text style={styles.imageDetailText}>Created At: {formatDate(image.createdAt)}</Text>
                        </View>
                    ))
                ) : (
                    <Text style={styles.emptyImagesText}>No images found for this product.</Text>
                )}
            </View>

            <View style={styles.discountUpdateContainer}>
                <View style={styles.discountInputContainer}>
                    <Text style={styles.filterLabel}>New Discount Rate</Text>
                    <TextInput
                        style={[styles.filterInput, !isValidDiscount(discountInput) && discountInput.length > 0 && styles.invalidFilterInput]}
                        value={discountInput}
                        onChangeText={(value) => onDiscountInputChange(product.productId, value)}
                        placeholder="0-100"
                        placeholderTextColor="#a09a80"
                        keyboardType="decimal-pad"
                        maxLength={6}
                    />
                </View>

                <WrappedGeneralButton
                    title="Update Discount"
                    disabled={isUpdating || !isValidDiscount(discountInput)}
                    wrapperStyles={styles.discountButtonWrapper}
                    textStyles={styles.discountButtonText}
                    onPress={() => onUpdateDiscount(product.productId)}
                />
            </View>
        </View>
    );
}
//#endregion


export default function SalesManagerProducts()
{
    const { isLoading, token, user: authUser } = useAuth();
    const { user, isLoadingUser } = useUser();
    const { showToast } = useToast();
    const { navigateWithWipe, revealWipe } = useTransition();

    const [products, setProducts] = useState<SalesManagerProduct[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const [hasHandledAccess, setHasHandledAccess] = useState(false);
    const [updatingProducts, setUpdatingProducts] = useState<Record<string, boolean>>({});
    const [discountInputs, setDiscountInputs] = useState<Record<string, string>>({});

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedModels, setSelectedModels] = useState<string[]>([]);
    const [selectedPrices, setSelectedPrices] = useState<string[]>([]);
    const [selectedFuelTypes, setSelectedFuelTypes] = useState<string[]>([]);
    const [selectedWeights, setSelectedWeights] = useState<string[]>([]);
    const [selectedHasKitchens, setSelectedHasKitchens] = useState<string[]>([]);
    const [appliedFilters, setAppliedFilters] = useState({
        models: [] as string[],
        prices: [] as string[],
        fuelTypes: [] as string[],
        weights: [] as string[],
        hasKitchens: [] as string[],
    });
    const [sortOption, setSortOption] = useState("date_desc");

    const activeUser = user ?? authUser;
    const userRole = activeUser?.role ?? "guest";
    const isSalesManager = userRole === "sales_manager";

    //#region API FUNCTIONS
    async function fetchProducts(): Promise<void>
    {
        setIsLoadingProducts(true);

        try {
            const response = await fetch(`${API_BASE_URL}${PRODUCTS_END_POINT}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const responseData = await readResponseJson<FetchProductsResponse>(response);

            if (response.ok) {
                const fetchedProducts = responseData?.products || [];
                setProducts(fetchedProducts);

                const initialDiscountInputs: Record<string, string> = {};
                fetchedProducts.forEach(product => {
                    initialDiscountInputs[product.productId] = product.discountRate.toString();
                });
                setDiscountInputs(initialDiscountInputs);
            }
            else {
                showToast(responseData?.message || "Products could not be fetched", "error");
            }
        } catch (error) {
            showToast("Something went wrong while fetching products", "error");
            console.error("LOG::ERROR::fetchProducts", error);
        } finally {
            setIsLoadingProducts(false);
        }
    }

    async function updateProductDiscount(productId: string): Promise<void>
    {
        if (!token) return;

        const discountInput = discountInputs[productId] || "";
        if (!isValidDiscount(discountInput)) {
            showToast("Discount rate must be between 0 and 100", "error");
            return;
        }

        setUpdatingProducts(prev => ({ ...prev, [productId]: true }));

        try {
            const response = await fetch(`${API_BASE_URL}${updateProductDiscountApi(productId)}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ discountRate: Number(discountInput) }),
            });

            const responseData = await readResponseJson<UpdateDiscountResponse>(response);

            if (response.ok && responseData?.product) {
                setProducts(prevProducts =>
                    prevProducts.map(product =>
                        product.productId === productId
                            ? {
                                ...product,
                                currentPrice: responseData.product.currentPrice,
                                discountRate: responseData.product.discountRate,
                            }
                            : product
                    )
                );

                setDiscountInputs(prev => ({
                    ...prev,
                    [productId]: responseData.product.discountRate.toString(),
                }));

                showToast(responseData.message || "Product discount updated", "success");
            }
            else {
                showToast(responseData?.message || "Product discount could not be updated", "error");
            }
        } catch (error) {
            showToast("Something went wrong while updating product discount", "error");
            console.error("LOG::ERROR::updateProductDiscount", error);
        } finally {
            setUpdatingProducts(prev => ({ ...prev, [productId]: false }));
        }
    }
    //#endregion

    //#region BUTTON FUNCTIONS
    function clearFiltersButtonFunction(): void
    {
        setSearchQuery("");
        setSelectedModels([]);
        setSelectedPrices([]);
        setSelectedFuelTypes([]);
        setSelectedWeights([]);
        setSelectedHasKitchens([]);
        setAppliedFilters({
            models: [],
            prices: [],
            fuelTypes: [],
            weights: [],
            hasKitchens: [],
        });
        setSortOption("date_desc");
    }

    function refreshProductsButtonFunction(): void
    {
        fetchProducts();
    }

    function discountInputChange(productId: string, value: string): void
    {
        setDiscountInputs(prev => ({
            ...prev,
            [productId]: formatDiscountInput(value),
        }));
    }

    function applyFiltersButtonFunction(): void
    {
        setAppliedFilters({
            models: selectedModels,
            prices: selectedPrices,
            fuelTypes: selectedFuelTypes,
            weights: selectedWeights,
            hasKitchens: selectedHasKitchens,
        });
    }
    //#endregion

    //#region FILTER AND SORT
    const filteredProducts = useMemo(() => {
        const normalizedSearchQuery = searchQuery.trim().toLowerCase();

        return products
            .filter(product => {
                const productSearchText = getSearchText(product);
                const model = product.model.toLowerCase();
                const fuelType = product.fuelType.toLowerCase();
                const hasKitchenValue = product.hasKitchen ? "yes" : "no";
                const matchesModel = appliedFilters.models.length === 0 ||
                    appliedFilters.models.some(selectedModel =>
                        selectedModel.toLowerCase() === model ||
                        model.includes(selectedModel.toLowerCase()) ||
                        selectedModel.toLowerCase().includes(model)
                    );
                const matchesFuelType = appliedFilters.fuelTypes.length === 0 ||
                    appliedFilters.fuelTypes.some(selectedFuel => selectedFuel.toLowerCase() === fuelType);
                const matchesKitchen = appliedFilters.hasKitchens.length === 0 ||
                    appliedFilters.hasKitchens.includes(hasKitchenValue);

                return (
                    (!normalizedSearchQuery || productSearchText.includes(normalizedSearchQuery)) &&
                    matchesModel &&
                    doesProductMatchPriceRange(product, appliedFilters.prices) &&
                    matchesFuelType &&
                    doesProductMatchWeightRange(product, appliedFilters.weights) &&
                    matchesKitchen
                );
            })
            .sort((firstProduct, secondProduct) => {
                if (sortOption === "date_asc") return new Date(firstProduct.createdAt).getTime() - new Date(secondProduct.createdAt).getTime();
                if (sortOption === "date_desc") return new Date(secondProduct.createdAt).getTime() - new Date(firstProduct.createdAt).getTime();
                if (sortOption === "price_asc") return toNumber(firstProduct.currentPrice) - toNumber(secondProduct.currentPrice);
                if (sortOption === "price_desc") return toNumber(secondProduct.currentPrice) - toNumber(firstProduct.currentPrice);
                if (sortOption === "rating_desc") return Number(secondProduct.averageRating || 0) - Number(firstProduct.averageRating || 0);
                if (sortOption === "rating_asc") return Number(firstProduct.averageRating || 0) - Number(secondProduct.averageRating || 0);

                return 0;
            });
    }, [products, searchQuery, appliedFilters, sortOption]);
    //#endregion

    //#region LIFE CYCLE
    useFocusEffect(
        useCallback(() => {
            setHasHandledAccess(false);

            if (isLoading || isLoadingUser) return;

            if (!isSalesManager) {
                setHasHandledAccess(true);
                showToast(`Invalid Route For ${userRole}`, "error");
                navigateWithWipe("/");
                return;
            }

            setHasHandledAccess(true);
            fetchProducts();
        }, [isLoading, isLoadingUser, isSalesManager, userRole])
    );

    useFocusEffect(
        useCallback(() => {
            if (hasHandledAccess && isSalesManager && !isLoadingProducts) {
                revealWipe();
            }
        }, [hasHandledAccess, isSalesManager, isLoadingProducts, revealWipe])
    );
    //#endregion

    if (isLoading || isLoadingUser || !hasHandledAccess || !isSalesManager) {
        return null;
    }

    return (
        <View style={styles.mainContainer}>
            <Navbar />

            <View style={styles.contentContainer}>
                <Text style={styles.pageTitle}>Sales Manager Products</Text>

                <View style={styles.filterContainer}>
                    <View style={[styles.filterInputContainer, styles.searchInputContainer]}>
                        <Text style={styles.filterLabel}>Search</Text>
                        <TextInput
                            style={styles.filterInput}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Name, ID, serial, description..."
                            placeholderTextColor="#a09a80"
                        />
                    </View>

                    <View style={[styles.filterInputContainer, styles.filterDropdownContainer, { zIndex: 60, elevation: 60 }]}>
                        <Text style={styles.filterLabel}>Model Filter</Text>
                        <CustomMultiSelect
                            options={modelData}
                            selectedOptions={selectedModels}
                            onChange={setSelectedModels}
                            placeholder="Any"
                        />
                    </View>

                    <View style={[styles.filterInputContainer, styles.filterDropdownContainer, { zIndex: 50, elevation: 50 }]}>
                        <Text style={styles.filterLabel}>Price Filter</Text>
                        <CustomMultiSelect
                            options={priceData}
                            selectedOptions={selectedPrices}
                            onChange={setSelectedPrices}
                            placeholder="Any"
                        />
                    </View>

                    <View style={[styles.filterInputContainer, styles.filterDropdownContainer, { zIndex: 40, elevation: 40 }]}>
                        <Text style={styles.filterLabel}>Fuel Type Filter</Text>
                        <CustomMultiSelect
                            options={fuelData}
                            selectedOptions={selectedFuelTypes}
                            onChange={setSelectedFuelTypes}
                            placeholder="Any"
                        />
                    </View>

                    <View style={[styles.filterInputContainer, styles.filterDropdownContainer, { zIndex: 30, elevation: 30 }]}>
                        <Text style={styles.filterLabel}>Weight Filter</Text>
                        <CustomMultiSelect
                            options={weightData}
                            selectedOptions={selectedWeights}
                            onChange={setSelectedWeights}
                            placeholder="Any"
                        />
                    </View>

                    <View style={[styles.filterInputContainer, styles.filterDropdownContainer, { zIndex: 20, elevation: 20 }]}>
                        <Text style={styles.filterLabel}>Has Kitchen Filter</Text>
                        <CustomMultiSelect
                            options={kitchenData}
                            selectedOptions={selectedHasKitchens}
                            onChange={setSelectedHasKitchens}
                            placeholder="Any"
                        />
                    </View>

                    <View style={styles.sortContainer}>
                        <Text style={styles.filterLabel}>Sort</Text>
                        <SortDropdown
                            options={sortOptions}
                            selectedValue={sortOption}
                            onChange={setSortOption}
                            containerStyle={styles.sortDropdownContainer}
                            triggerStyle={styles.sortDropdownTrigger}
                        />
                    </View>

                    <View style={styles.filterButtonContainer}>
                        <WrappedGeneralButton
                            title="Apply"
                            wrapperStyles={styles.filterButtonWrapper}
                            textStyles={styles.filterButtonText}
                            onPress={applyFiltersButtonFunction}
                        />

                        <WrappedGeneralButton
                            title="Clear"
                            wrapperStyles={styles.filterButtonWrapper}
                            textStyles={styles.filterButtonText}
                            onPress={clearFiltersButtonFunction}
                        />

                        <WrappedGeneralButton
                            title="Refresh"
                            wrapperStyles={styles.filterButtonWrapper}
                            textStyles={styles.filterButtonText}
                            disabled={isLoadingProducts}
                            onPress={refreshProductsButtonFunction}
                        />
                    </View>
                </View>

                {isLoadingProducts ? (
                    <ActivityIndicator size="large" color={Colors.light.greenButtonBackground} style={styles.loadingIndicator} />
                ) : filteredProducts.length === 0 ? (
                    <Text style={styles.emptyProductsText}>No products match your filters.</Text>
                ) : (
                    <FlatList
                        data={filteredProducts}
                        keyExtractor={(item) => item.productId}
                        renderItem={({ item }) => (
                            <SalesManagerProductCard
                                product={item}
                                discountInput={discountInputs[item.productId] || ""}
                                isUpdating={!!updatingProducts[item.productId]}
                                onDiscountInputChange={discountInputChange}
                                onUpdateDiscount={updateProductDiscount}
                            />
                        )}
                        contentContainerStyle={styles.listContainer}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>
        </View>
    );
}


//#region STYLES
const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: Colors.light.salesManagerBackground,
    },
    contentContainer: {
        flex: 1,
        width: "100%",
        maxWidth: 1100,
        alignSelf: "center",
        padding: 20,
    },
    pageTitle: {
        marginBottom: 20,
        fontFamily: Fonts.bold,
        fontSize: 28,
        color: Colors.light.greenButtonBackground,
    },

    /* FILTERS */
    filterContainer: {
        zIndex: 10,
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        backgroundColor: Colors.light.softContainerBackground,
        borderRadius: 8,
        padding: 14,
        marginBottom: 18,
    },
    filterInputContainer: {
        flex: 1,
        minWidth: 180,
    },
    filterDropdownContainer: {
        position: "relative",
    },
    searchInputContainer: {
        flexBasis: 360,
        minWidth: 320,
    },
    filterLabel: {
        marginBottom: 6,
        fontFamily: Fonts.semibold,
        fontSize: 13,
        color: Colors.light.greenButtonBackground,
    },
    filterInput: {
        height: 42,
        borderWidth: 1,
        borderColor: "#c8bd96",
        borderRadius: 8,
        paddingHorizontal: 12,
        backgroundColor: "#ffffff",
        fontFamily: Fonts.regular,
        fontSize: 14,
        color: Colors.light.mainTextColor,
    },
    invalidFilterInput: {
        borderColor: Colors.light.errorText,
    },
    sortContainer: {
        flex: 1,
        minWidth: 220,
        zIndex: 1,
        elevation: 1,
    },
    sortDropdownContainer: {
        width: "100%",
    },
    sortDropdownTrigger: {
        height: 42,
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#c8bd96",
    },
    filterButtonContainer: {
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 10,
    },
    filterButtonWrapper: {
        minWidth: 120,
        alignItems: "center",
        backgroundColor: Colors.light.greenButtonBackground,
        borderRadius: 8,
        paddingVertical: 11,
        paddingHorizontal: 14,
    },
    filterButtonText: {
        fontFamily: Fonts.semibold,
        fontSize: 14,
        color: Colors.light.greenButtonTextColor,
    },

    /* LIST */
    loadingIndicator: {
        marginTop: 50,
    },
    emptyProductsText: {
        marginTop: 40,
        textAlign: "center",
        fontFamily: Fonts.semibold,
        fontSize: 16,
        color: Colors.light.greenButtonBackground,
    },
    listContainer: {
        paddingBottom: 30,
    },

    /* PRODUCT CARD */
    productCard: {
        backgroundColor: Colors.light.softContainerBackground,
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
    },
    productCardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 14,
    },
    productTitleContainer: {
        flex: 1,
    },
    productTitle: {
        fontFamily: Fonts.bold,
        fontSize: 20,
        color: Colors.light.greenButtonBackground,
    },
    productSubtitle: {
        marginTop: 4,
        fontFamily: Fonts.regular,
        fontSize: 13,
        color: Colors.light.basePriceDiscountedTextColor,
    },
    discountBadge: {
        alignSelf: "flex-start",
        backgroundColor: Colors.light.discountBackground,
        borderRadius: 8,
        paddingVertical: 6,
        paddingHorizontal: 12,
    },
    discountBadgeText: {
        fontFamily: Fonts.semibold,
        fontSize: 13,
        color: Colors.light.discountTextColor,
    },
    productBodyContainer: {
        flexDirection: "row",
        gap: 14,
        alignItems: "flex-start",
    },
    imageContainer: {
        width: 220,
        aspectRatio: 1.35,
        borderRadius: 8,
        overflow: "hidden",
        backgroundColor: Colors.light.imageFillerColor,
    },
    productImage: {
        width: "100%",
        height: "100%",
    },
    imageArrowButton: {
        position: "absolute",
        top: "50%",
        marginTop: -16,
        backgroundColor: "rgba(0,0,0,0.4)",
        borderRadius: 20,
        padding: 4,
    },
    imageArrowButtonLeft: {
        left: 8,
    },
    imageArrowButtonRight: {
        right: 8,
    },
    emptyImageContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    emptyImageText: {
        fontFamily: Fonts.semibold,
        fontSize: 14,
        color: Colors.light.greenButtonTextColor,
    },
    detailGrid: {
        flex: 1,
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    detailItem: {
        flex: 1,
        minWidth: 190,
        backgroundColor: "#ffffff",
        borderRadius: 8,
        padding: 12,
    },
    detailLabel: {
        marginBottom: 4,
        fontFamily: Fonts.semibold,
        fontSize: 12,
        color: Colors.light.basePriceDiscountedTextColor,
    },
    detailValue: {
        fontFamily: Fonts.bold,
        fontSize: 14,
        color: Colors.light.mainTextColor,
        flexWrap: "wrap",
    },
    descriptionContainer: {
        backgroundColor: "#ffffff",
        borderRadius: 8,
        padding: 12,
        marginTop: 12,
    },
    descriptionText: {
        fontFamily: Fonts.regular,
        fontSize: 14,
        color: Colors.light.mainTextColor,
    },

    /* IMAGES */
    imagesContainer: {
        marginTop: 14,
    },
    sectionTitle: {
        marginBottom: 10,
        fontFamily: Fonts.bold,
        fontSize: 16,
        color: Colors.light.greenButtonBackground,
    },
    imageDetailContainer: {
        backgroundColor: "#ffffff",
        borderRadius: 8,
        padding: 12,
        marginBottom: 10,
    },
    imageDetailText: {
        marginBottom: 4,
        fontFamily: Fonts.regular,
        fontSize: 13,
        color: Colors.light.mainTextColor,
    },
    emptyImagesText: {
        fontFamily: Fonts.regular,
        fontSize: 14,
        color: Colors.light.basePriceDiscountedTextColor,
    },

    /* DISCOUNT UPDATE */
    discountUpdateContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        alignItems: "flex-end",
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: "#d6cba6",
    },
    discountInputContainer: {
        minWidth: 180,
    },
    discountButtonWrapper: {
        minWidth: 160,
        alignItems: "center",
        backgroundColor: Colors.light.greenButtonBackground,
        borderRadius: 8,
        paddingVertical: 11,
        paddingHorizontal: 14,
    },
    discountButtonText: {
        fontFamily: Fonts.semibold,
        fontSize: 14,
        color: Colors.light.greenButtonTextColor,
    },
});
//#endregion
