//#region IMPORTS
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, LayoutChangeEvent, Platform, StyleSheet, Text, View } from 'react-native';

import {
    Montserrat_400Regular,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    useFonts
} from '@expo-google-fonts/montserrat';

import WrappedGeneralButton from '@/components/Buttons/GeneralButtonWithWrapper/GeneralButtonWithWrapper';
import CustomMultiSelect from '@/components/DropDowns/CustomMultiSelect/CustomMultiSelect';
import SortDropdown from '@/components/DropDowns/SortDropdown/SortDropdown';
import Navbar from '@/components/Navbar/Navbar';
import ProductCard from '@/components/ProductCard/ProductCard';
import SearchBar from '@/components/SearchBar/SearchBar';

import { API_BASE_URL, PRODUCTS_END_POINT, GET_BACKEND_CART, DELETE_ITEM_END_POINT, UPDATE_QUANTITY_END_POINT } from '@/constants/API';
import { Caravan, FetchProductsAllResponse, GetBackendCartResponse } from '@/models/BACKEND_MODELS';
import { DEBUG } from '@/constants/CONSTANTS';
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext';
import { useTransition } from '@/context/TransitionContext';
import getLocalCartMap from '@/functions/getLocalCartMap';
import calculateCardDimensions from '@/functions/calculateCardDimensions';
//#endregion

//#region MOCK FILTER DATA
import { modelData, priceData, fuelData, weightData, kitchenData, sortOptions } from '@/constants/MOCKDATA'
//#endregion


//#region LOCAL CONSTANTS
const MIN_CARD_WIDTH = 280;
const GAP_WIDTH = 15;
const MARGIN = 20;
//#endregion


//#region INPUT INTERFACES
interface fetchProductsInput {
    payload: Object; 
    API_BASE_URL: string; 
    PRODUCTS_END_POINT: string;
    signal: AbortSignal 
}

interface getQuantityInformationInput {
    API_BASE_URL: string; 
    GET_BACKEND_CART: string;
    signal: AbortSignal 
}

export interface UpdateQuantityInput {
    productId: string;
    delta: number;
}

//#endregion


export default function Caravans() {
    if (DEBUG) console.log("LOG:: caravans Component Rendered")
    
    const { token, isAuthenticated } = useAuth();
    const { showToast } = useToast();
    const { revealWipe } = useTransition();

    const [containerWidth, setContainerWidth] = useState(0);
    const [caravans, setCaravans] = useState<Caravan[]>([]);
    const [allCaravans, setAllCaravans] = useState<Caravan[]>([]);
    const [cartQuantity, setCartQuantity] = useState<Record<string, number>>({});
    const [wishlistMap, setWishlistMap] = useState<Record<string, boolean>>({});

    const [updatingItems, setUpdatingItems] = useState<Record<string, boolean>>({});
    const [isCaravansLoaded, setisCaravansLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Filter
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

    // Search
    const [searchQuery, setSearchQuery] = useState("");
    const [sortOption, setSortOption] = useState("date_desc");

    let [fontsLoaded] = useFonts({
        Montserrat_700Bold,
        Montserrat_400Regular,
        Montserrat_600SemiBold,
    });

    
    function clearFilters() 
    {
        setSelectedModels([]);
        setSelectedPrices([]);
        setSelectedFuelTypes([]);
        setSelectedWeights([]);
        setSelectedHasKitchens([]);

        if (DEBUG) console.log("LOG::Executed: clearFilters");
    }

    function calculateContainerWidth(event: LayoutChangeEvent) 
    {
        const width = event.nativeEvent.layout.width;
        setContainerWidth(width);

        if (DEBUG) console.log("LOG::Executed: calculateContainerWidth");
    }


    //#region QUANTITY INFORMATION


    function getQuantityInformationNotAuth(localCartMap: Record<string, number>)
    {
        setCartQuantity(localCartMap);
    }

    async function getQuantityInformationAuth({ API_BASE_URL, GET_BACKEND_CART, signal }: getQuantityInformationInput)
    {
        const _token = token

        try {
            const response = await fetch(`${API_BASE_URL}${GET_BACKEND_CART}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${_token}`
                },
                signal: signal
            });

            if (response.ok) 
            {
                const data: GetBackendCartResponse = await response.json();

                const newCartState: Record<string, number> = {};
                data.items.forEach(item => {
                    newCartState[item.productId] = item.quantity;
                });
                
                setCartQuantity(newCartState);
            }
            else
            {
                setCartQuantity({});
            }
        } catch (error: any) {
            if (error.name !== 'AbortError') 
            {
                console.error("Failed to merge cart:", error);
            }
        }
    }

    async function getQuantityInformation({ API_BASE_URL, GET_BACKEND_CART, signal }: getQuantityInformationInput) {
        if (DEBUG) console.log("LOG::executed: getQuantityInformation");

        const localCartMap = getLocalCartMap();

        if (isAuthenticated) 
        {
            getQuantityInformationAuth({API_BASE_URL: API_BASE_URL, GET_BACKEND_CART: GET_BACKEND_CART, signal: signal});
        } 
        else 
        {
            // Not authenticated: just populate state directly from local storage
            getQuantityInformationNotAuth(localCartMap)
        }
    }

    //#endregion


    //#region UPDATE QUANTITY
    async function updateQuantityNotAuth({productId, delta}: UpdateQuantityInput)
    {
        setUpdatingItems(prev => ({ ...prev, [productId]: true })); 

        const targetItem = caravans.find(item => item.productId === productId);
        const quantityInStocks: number = targetItem ? targetItem.quantityInStocks : 0;
        const currentQuantity: number = cartQuantity[productId] || 0;
        let targetQuantity: number = currentQuantity;
        if (delta === -2) targetQuantity = 0;
        else targetQuantity = currentQuantity + delta;


        if (targetQuantity > quantityInStocks) 
        {
            showToast('There is not enough stock!', 'error');
        }
        else
        {
            if (Platform.OS === 'web') 
            {
                if (targetQuantity <= 0) window.localStorage.removeItem(`cart_${productId}`);
                else window.localStorage.setItem(`cart_${productId}`, targetQuantity.toString());
            }

            if (targetQuantity <= 0) 
            {
                setCartQuantity(prev => {
                    const newCart = { ...prev };
                    delete newCart[productId];
                    return newCart;
                });
            } 
            else 
            {
                setCartQuantity(prev => {
                    const newCart = { ...prev };
                    newCart[productId] = targetQuantity;
                    return newCart;
                });
            }
        }
        
        setUpdatingItems(prev => ({ ...prev, [productId]: false })); 
        return;
    }
    
    async function updateQuantityAuth({productId, delta}: UpdateQuantityInput)
    {
        setUpdatingItems(prev => ({ ...prev, [productId]: true })); 

        const currentQuantity: number = cartQuantity?.[productId] || 0;

        if (currentQuantity === undefined)
        {
            showToast('Cart Item Does Not Exist', 'error');
            return;
        }

        console.log("current: ", currentQuantity);
        console.log("Delta: ", delta);

        let targetQuantity: number = currentQuantity;
        if (delta === -2) targetQuantity = 0;
        else targetQuantity = currentQuantity + delta;
        
        console.log(targetQuantity);

        try {
            const response = await fetch(`${API_BASE_URL}${UPDATE_QUANTITY_END_POINT}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ productId: productId, quantity: targetQuantity})
            });

            const responseData = await response.json();
            if (response.ok)
            {
                if (targetQuantity <= 0) 
                {
                    setCartQuantity(prev => {
                        const newCart = { ...prev };
                        delete newCart[productId];
                        return newCart;
                    });
                } 
                else 
                {
                    setCartQuantity(prev => {
                        const newCart = { ...prev };
                        newCart[productId] = targetQuantity;
                        return newCart;
                    });
                }
            }
            else
            {
                showToast(`${responseData.message}`, 'error');
            }
        } catch(error) {
            showToast(`${error}`, 'error');
        } finally {
            setUpdatingItems(prev => ({ ...prev, [productId]: false })); 
        }

    }
    
    async function updateQuantity({productId, delta}: UpdateQuantityInput)
    {
        if (!isAuthenticated)   updateQuantityNotAuth({productId: productId, delta: delta});
        else                    updateQuantityAuth({productId: productId, delta: delta});
    }
    
    //#endregion


    //#region FETCH PRODUCTS


    async function fetchProducts({payload, API_BASE_URL, PRODUCTS_END_POINT, signal}: fetchProductsInput)
    {
        setisCaravansLoaded(false);

        try {
            const response = await fetch(`${API_BASE_URL}${PRODUCTS_END_POINT}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: signal, 
            });
            
            if (response.ok) 
            {
                const data: FetchProductsAllResponse = await response.json();
                setAllCaravans(data.products || []);
                setCaravans(data.products || []);
            } 
            else 
            {
                if (response.status === 404) showToast('ERROR 404');
                else showToast('ERROR: Else');
            }

        } catch(err: any) {
            if (err.name === 'AbortError') 
            {
                if (DEBUG) console.log("Fetch aborted: User left the screen.");
                return; 
            }
            showToast('Something went wrong while fetching products', 'error');
        } finally {
            if (!signal?.aborted) 
            {
                setisCaravansLoaded(true);
            }

            if (DEBUG) console.log("LOG::Executed: fetchProducts");
        }
    } 

    //#endregion


    //#region APPLY FILTERS AND SORT
    function applyFiltersAndSort() {
        let result = [...allCaravans];

        // Search
        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            result = result.filter(c => 
                (c.name && c.name.toLowerCase().includes(query)) || 
                (c.description && c.description.toLowerCase().includes(query)) ||
                (c.model && c.model.toLowerCase().includes(query))
            );
        }

        // Models filter
        if (appliedFilters.models.length > 0) {
            result = result.filter(c => {
                if (!c.model) return false;
                const cModelLower = c.model.toLowerCase();
                return appliedFilters.models.some(m => m.toLowerCase() === cModelLower || cModelLower.includes(m.toLowerCase()) || m.toLowerCase().includes(cModelLower));
            });
        }

        // Prices filter
        if (appliedFilters.prices.length > 0) {
            result = result.filter(c => {
                const price = Number(c.currentPrice);
                return appliedFilters.prices.some(range => {
                    if (range === 'under_50k') return price < 50000;
                    if (range === '50k_to_100k') return price >= 50000 && price <= 100000;
                    if (range === '100k_to_150k') return price > 100000 && price <= 150000;
                    if (range === '150k_to_200k') return price > 150000 && price <= 200000;
                    if (range === '200k_to_250k') return price > 200000 && price <= 250000;
                    if (range === '250k_to_300k') return price > 250000 && price <= 300000;
                    if (range === '300k_to_350k') return price > 300000 && price <= 350000;
                    if (range === '350k_to_400k') return price > 350000 && price <= 400000;
                    if (range === '400k_to_450k') return price > 400000 && price <= 450000;
                    if (range === '450k_to_500k') return price > 450000 && price <= 500000;
                    if (range === 'over_500k') return price > 500000;
                    return false;
                });
            });
        }

        // Fuel Type
        if (appliedFilters.fuelTypes.length > 0) {
            result = result.filter(c => {
                if (!c.fuelType) return false;
                return appliedFilters.fuelTypes.some(ft => ft.toLowerCase() === c.fuelType.toLowerCase());
            });
        }

        // Weight filter
        if (appliedFilters.weights.length > 0) {
            result = result.filter(c => {
                const w = c.weightKg;
                return appliedFilters.weights.some(weightCategory => {
                    if (weightCategory === 'lightweight') return w < 1500;
                    if (weightCategory === 'standard') return w >= 1500 && w < 2000;
                    if (weightCategory === 'heavyweight') return w >= 2000;
                    return false;
                });
            });
        }

        // Has Kitchen filter
        if (appliedFilters.hasKitchens.length > 0) {
            result = result.filter(c => {
                const hasKitchenVal = c.hasKitchen ? 'yes' : 'no';
                return appliedFilters.hasKitchens.includes(hasKitchenVal);
            });
        }

        // Sort
        result.sort((a, b) => {
            if (sortOption === 'price_asc') {
                return Number(a.currentPrice) - Number(b.currentPrice);
            } else if (sortOption === 'price_desc') {
                return Number(b.currentPrice) - Number(a.currentPrice);
            } else if (sortOption === 'date_asc') {
                return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
            } else if (sortOption === 'date_desc') {
                return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
            }
            return 0;
        });

        setCaravans(result);
    }
    //#endregion


    //#region WISHLIST 
    async function handleToggleWishlist(productId: string) 
    {
        // Determine the current state and what the new state should be
        const currentlyWishlisted = !!wishlistMap[productId];
        const method = currentlyWishlisted ? 'DELETE' : 'POST';
        const endpoint = `${API_BASE_URL}/api/v3/wishlist/${productId}`;

        // Optimistic UI Update: instantly update the local state so the icon changes
        setWishlistMap(prev => ({
            ...prev,
            [productId]: !currentlyWishlisted
        }));

        try {
            const response = await fetch(endpoint, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) 
            {
                throw new Error('API request failed');
            }

            showToast(method === 'DELETE' ? 'Removed from wishlist' : 'Added to wishlist', 'success');

        } catch (error) {
            // Revert the UI update if the API call fails
            setWishlistMap(prev => ({
                ...prev,
                [productId]: currentlyWishlisted
            }));
            console.error("Failed to update wishlist:", error);
        }
    };

    async function fetchUserWishlist(controller: AbortController)  
    {
        if (!isAuthenticated || !token) {
            setWishlistMap({});
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/api/v3/wishlist/`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
                signal: controller.signal
            });
            
            if (response.ok) {
                const data = await response.json();
                
                // Create a mapping of productId -> true
                const newWishlistMap: Record<string, boolean> = {};
                
                // Note: Ensure `item.productId` matches the actual key returned by your wishlist API
                data.wishlist.forEach((item: any) => {
                    newWishlistMap[item.productId] = true; 
                });
                
                setWishlistMap(newWishlistMap);
                
            }
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error("Failed to fetch wishlist mapping:", error);
            }
        }
    };
    //#endregion


    useEffect(() => {
        applyFiltersAndSort();
    }, [
        searchQuery, sortOption, appliedFilters, allCaravans
    ]);

    function onApplyFilter() 
    {
        setAppliedFilters({
            models: selectedModels,
            prices: selectedPrices,
            fuelTypes: selectedFuelTypes,
            weights: selectedWeights,
            hasKitchens: selectedHasKitchens
        });
        if (DEBUG) console.log("LOG::Executed: onApplyFilter");
    }

    
    useFocusEffect(
        useCallback(() => {
            const controller = new AbortController();

            fetchProducts({
                payload: {},
                API_BASE_URL,
                PRODUCTS_END_POINT,
                signal: controller.signal
            });

            getQuantityInformation({
                API_BASE_URL,
                GET_BACKEND_CART,
                signal: controller.signal
            });

            fetchUserWishlist(controller);

            return () => controller.abort();

        }, [isAuthenticated, token])
    );

    useEffect(() => {
        if (fontsLoaded && isCaravansLoaded) {
            revealWipe();
            if (DEBUG) console.log("LOG:: revealWipe triggered!");
        }

        if (DEBUG) console.log("LOG::Executed: useEffect");

    }, [fontsLoaded, isCaravansLoaded, revealWipe]);


    if (!fontsLoaded || !isCaravansLoaded) {
        return <View></View>; 
    }
    
    const { dynamicCardWidth, rowCount } = calculateCardDimensions({containerWidth, MARGIN, GAP_WIDTH, MIN_CARD_WIDTH});
    
    return (
        <View style={styles.mainContainer}>
            <Navbar/>

            <View style={styles.contentContainer}>
                <View style={styles.filterContainer}>

                    <WrappedGeneralButton
                        textStyles={styles.generalButtonText}
                        wrapperStyles={styles.generalButton}
                        title="Clear Filters"
                        onPress={clearFilters}
                    />

                    {/* Model Filter */}
                    <View style={[styles.generalFilter, { zIndex: 5 }]}>
                        <Text style={styles.filterTitle}>Model Filter</Text>
                        <CustomMultiSelect
                            options={modelData}
                            selectedOptions={selectedModels}
                            onChange={setSelectedModels}
                            placeholder="Any"
                        />
                    </View>

                    {/* Price Filter */}
                    <View style={[styles.generalFilter, { zIndex: 4 }]}>
                        <Text style={styles.filterTitle}>Price Filter</Text>
                        <CustomMultiSelect
                            options={priceData}
                            selectedOptions={selectedPrices}
                            onChange={setSelectedPrices}
                            placeholder="Any"
                        />
                    </View>

                    {/* Fuel Type Filter */}
                    <View style={[styles.generalFilter, { zIndex: 3 }]}>
                        <Text style={styles.filterTitle}>Fuel Type Filter</Text>
                        <CustomMultiSelect
                            options={fuelData}
                            selectedOptions={selectedFuelTypes}
                            onChange={setSelectedFuelTypes}
                            placeholder="Any"
                        />
                    </View>

                    {/* Weight Filter */}
                    <View style={[styles.generalFilter, { zIndex: 2 }]}>
                        <Text style={styles.filterTitle}>Weight Filter</Text>
                        <CustomMultiSelect
                            options={weightData}
                            selectedOptions={selectedWeights}
                            onChange={setSelectedWeights}
                            placeholder="Any"
                        />
                    </View>

                    {/* Kitchen Filter */}
                    <View style={[styles.generalFilter, { zIndex: 1 }]}>
                        <Text style={styles.filterTitle}>Has Kitchen Filter</Text>
                        <CustomMultiSelect
                            options={kitchenData}
                            selectedOptions={selectedHasKitchens}
                            onChange={setSelectedHasKitchens}
                            placeholder="Any"
                        />
                    </View>

                    <View style={styles.applyFilterButtonContainer}>
                        <WrappedGeneralButton 
                            wrapperStyles={styles.generalButton} 
                            textStyles={styles.generalButtonText} 
                            title='APPLY' 
                            onPress={onApplyFilter}
                        />
                    </View>

                </View>

                <View style={styles.cardsContainer}>

                    {/* Search and Sort */}
                    <View style={styles.topBar}>
                        <SearchBar
                            containerStyle={{ flex: 3 }}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Search by model, keyword..."
                        />
                        <SortDropdown
                            options={sortOptions}
                            selectedValue={sortOption}
                            onChange={setSortOption}
                        />
                    </View>

                    <View 
                        style={styles.listContainer} 
                        onLayout={calculateContainerWidth}
                    >
                        {containerWidth > 0 && (
                            <FlatList 
                                key={`grid-${rowCount}`} 
                                data={caravans}
                                numColumns={rowCount}
                                keyExtractor={(item) => item.productId?.toString() || Math.random().toString()}
                                columnWrapperStyle={rowCount > 1 ? { gap: GAP_WIDTH, marginBottom: GAP_WIDTH } : undefined}
                                contentContainerStyle={{ padding: MARGIN, paddingBottom: MARGIN * 2 }}
                                renderItem={({ item }) => (
                                    <ProductCard 
                                        dimensionStyle={{ width: dynamicCardWidth, height: 400 }} 
                                        caravan={item} 
                                        // Pass specific quantity (fallback to 0 if undefined)
                                        quantity={cartQuantity?.[item.productId] || 0}
                                        isWishListed={!!wishlistMap[item.productId]} 
                                        // Pass updater callback
                                        disabled={!!updatingItems[item.productId]}
                                        onUpdateQuantity={(newAmount) => updateQuantity({productId: item.productId, delta: newAmount})}
                                        onWishListToggle={() => handleToggleWishlist(item.productId)}
                                    />
                                )}
                                ListEmptyComponent={
                                    !isLoading ? <Text style={styles.noResultsText}>No caravans match your filters.</Text> : null
                                }
                            />
                        )}
                    </View>

                </View>

            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#d6cba6',
    },
    contentContainer: {
        flex: 1,
        flexDirection: 'row',
        margin: '1%'
    },
    filterContainer: {
        flex: 1,
        backgroundColor: '#fefae0',
        borderRadius: 10,
        maxWidth: 300,
        padding: 10,
    },
    generalFilter: {
        marginBottom: 10,
    },
    filterTitle: {
        marginBottom: 5,
        fontFamily: 'Montserrat_600SemiBold',
        color: '#283618',
    },
    generalButton: {
        alignSelf: 'center',
        backgroundColor: '#283618',
        borderRadius: 8,
        width: '80%',
        padding: 8,
        marginBottom: 20,
        // @ts-ignore
        ...(Platform.OS === 'web' && { cursor: 'pointer' }),
    },
    generalButtonText: {
        fontFamily: 'Montserrat_600SemiBold',
        color: '#fefae0'
    },
    applyFilterButtonContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },

    /* CARDS CONTAINER */
    cardsContainer: {
        flex: 1,
        zIndex: 1,
    },

    /* SEARCH AND SORT BAR */
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
        marginLeft: 20,
        marginBottom: 20,
        zIndex: 10,
    },
    
    /* CARDS */
    listContainer: {
        flex: 1,
    },
    noResultsText: {
        margin: 20,
        fontFamily: 'Montserrat_600SemiBold',
        fontSize: 16,
        color: '#283618',
        textAlign: 'center',
    }
});