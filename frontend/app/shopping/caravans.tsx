//#region IMPORTS
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
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

import { API_BASE_URL, PRODUCTS_END_POINT } from '@/constants/API';
import { Caravan } from '@/constants/BACKEND_MODELS';
import { DEBUG } from '@/constants/CONSTANTS';
import { useToast } from '@/context/ToastContext';
import { useTransition } from '@/context/TransitionContext';
//#endregion


//#region MOCK FILTER DATA
const modelData = [
    {label: 'Model 1', value: 'model1'},
    {label: 'Model 2', value: 'model2'}
];
const priceData = [
    {label: 'Under $20,000', value: 'under_20k'},
    {label: '$20,000 - $40,000', value: '20k_to_40k'}
];
const fuelData = [
    {label: 'Gasoline', value: 'gasoline'},
    {label: 'Diesel', value: 'diesel'}
];
const weightData = [
    {label: 'Lightweight', value: 'lightweight'},
    {label: 'Standard', value: 'standard'}
];
const kitchenData = [
    {label: 'Yes', value: 'yes'},
    {label: 'No', value: 'no'}
];

const sortOptions = [
    { label: 'Newest to Oldest', value: 'date_desc' },
    { label: 'Oldest to Newest', value: 'date_asc' },
    { label: 'Price: High to Low', value: 'price_desc' },
    { label: 'Price: Low to High', value: 'price_asc' },
];
//#endregion


//#region CONSTANTS
const MIN_CARD_WIDTH = 280;
const GAP_WIDTH = 15;
const MARGIN = 20;
//#endregion


//#region INPUT INTERFACES
interface fetchProductsInput {
    payload: Object; 
    API_BASE_URL: string; 
    PRODUCTS_END_POINT: string;
}

interface calculateCardDimensionsInput {
    containerWidth: number, 
    MARGIN: number, 
    GAP_WIDTH: number, 
    MIN_CARD_WIDTH: number
}
//#endregion


export default function caravans() {
    const { showToast } = useToast();
    const { revealWipe } = useTransition();

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

    // Main Data
    const [caravans, setCaravans] = useState<Caravan[]>([]);
    const [containerWidth, setContainerWidth] = useState(0);

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

        if (DEBUG) console.log("Executed: clearFilters");
    }

    const fetchProducts = useCallback(async ({ payload, API_BASE_URL, PRODUCTS_END_POINT }: fetchProductsInput) => {
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}${PRODUCTS_END_POINT}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
                // Note: If you have a payload for filtering, you'd apply it here via query params or body depending on your API
            });

            if (response.ok) 
            {
                const data = await response.json();
                console.log("Backend returned:", data); 
                setCaravans(data.products || []);
            } 
            else 
            {
                if (response.status === 404) 
                {
                    showToast('ERROR 404');
                } 
                else 
                {
                    showToast('ERROR: Else');
                }
            }
        } catch (error) {
            console.error('Fetch error:', error);
            Alert.alert('Network Error', 'Could not connect to the server.');
        } finally {
            setIsLoading(false);
            if (DEBUG) console.log("Executed: fetchProducts");
        }
    }, [showToast]);

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

        fetchProducts({ payload: filterPayload, API_BASE_URL, PRODUCTS_END_POINT });

        if (DEBUG) console.log("Executed: onApplyFilter");
    }

    function calculateContainerWidth(event: LayoutChangeEvent) 
    {
        const width = event.nativeEvent.layout.width;
        setContainerWidth(width);

        if (DEBUG) console.log("Executed: calculateContainerWidth");
    }

    function calculateCardDimensions({containerWidth, MARGIN, GAP_WIDTH, MIN_CARD_WIDTH}: calculateCardDimensionsInput) 
    {
        let _dynamicCardWidth = MIN_CARD_WIDTH;
        let _rowCount = 1;
        if (containerWidth > 0) 
        {
            const rawItemsPerRow = (containerWidth - (MARGIN * 2) + GAP_WIDTH) / (MIN_CARD_WIDTH + GAP_WIDTH);
            _rowCount = Math.floor(rawItemsPerRow);
            _rowCount = Math.max(1, _rowCount || 1);

            _dynamicCardWidth = Math.floor((containerWidth - (MARGIN * 2) - (_rowCount - 1) * GAP_WIDTH) / _rowCount);
        }

        if (DEBUG) console.log("Executed: calculateCardDimensions");
        
        return { 
            dynamicCardWidth: _dynamicCardWidth, 
            rowCount: _rowCount 
        };
    }

    useFocusEffect(
        useCallback(() => {
            if (fontsLoaded) {
                revealWipe();
                fetchProducts({payload: {}, API_BASE_URL, PRODUCTS_END_POINT});
            }
        }, [fontsLoaded, fetchProducts, revealWipe])
    );
    
    const { dynamicCardWidth, rowCount } = calculateCardDimensions({containerWidth, MARGIN, GAP_WIDTH, MIN_CARD_WIDTH});
    
    return (
        <View style={styles.mainContainer}>
            <Navbar />

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