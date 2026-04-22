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
    const [cartQuantity, setCartQuantity] = useState<Record<string, number>>({});

    const [updatingItems, setUpdatingItems] = useState<Record<string, boolean>>({});
    const [isCaravansLoaded, setisCaravansLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Filter
    const [selectedModels, setSelectedModels] = useState<string[]>([]);
    const [selectedPrices, setSelectedPrices] = useState<string[]>([]);
    const [selectedFuelTypes, setSelectedFuelTypes] = useState<string[]>([]);
    const [selectedWeights, setSelectedWeights] = useState<string[]>([]);
    const [selectedHasKitchens, setSelectedHasKitchens] = useState<string[]>([]);

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
        const targetQuantity: number = currentQuantity + delta;


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
        if (delta === -2)       targetQuantity = 0;
        else if (delta === -1)  targetQuantity = targetQuantity - 1;
        else if (delta === 1)   targetQuantity = targetQuantity + 1;
        
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

    function onApplyFilter() 
    {
        const filterPayload = {
            searchQuery: searchQuery,
            sortBy: sortOption,
            models: selectedModels,
            prices: selectedPrices,
            fuelTypes: selectedFuelTypes,
            weights: selectedWeights,
            hasKitchen: selectedHasKitchens,
        };

        console.log("Sending the following filters to backend:");
        console.log(JSON.stringify(filterPayload, null, 2));

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
                                        // Pass updater callback
                                        disabled={!!updatingItems[item.productId]}
                                        onUpdateQuantity={(newAmount) => updateQuantity({productId: item.productId, delta: newAmount})}
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