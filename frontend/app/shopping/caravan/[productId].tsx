import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import {
    Montserrat_400Regular,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    useFonts
} from '@expo-google-fonts/montserrat';

import { useAuth } from '@/context/AuthContext'
import { useTransition } from '@/context/TransitionContext'
import { useToast } from '@/context/ToastContext'

import {API_BASE_URL, FETCH_PRODUCTS_DETAILS_END_POINT} from "@/constants/API"
import { Caravan, FetchProductDetailsResponse } from '@/models/BACKEND_MODELS'
import Navbar from "@/components/Navbar/Navbar";
import WrappedGeneralButton from "@/components/Buttons/GeneralButtonWithWrapper/GeneralButtonWithWrapper";


interface FetchProductInput {
    payload: string;
    API_BASE_URL: string;
    FETCH_PRODUCTS_DETAILS_END_POINT: string;
}

export default function product()
{   
    const { token, isAuthenticated } = useAuth();
    const { showToast } = useToast();
    const { revealWipe } = useTransition();

    const [isLoading, setIsLoading] = useState(true);
    
    const [caravan, setCaravan] = useState<Caravan | null>(null);

    const { productId } = useLocalSearchParams();

    let [fontsLoaded] = useFonts({
        Montserrat_700Bold,
        Montserrat_400Regular,
        Montserrat_600SemiBold,
    });

    async function fetchProduct({payload, API_BASE_URL, FETCH_PRODUCTS_DETAILS_END_POINT}: FetchProductInput)
    {
        setIsLoading(true);

        try {

            const response = await fetch(`${API_BASE_URL}${FETCH_PRODUCTS_DETAILS_END_POINT}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ productIds: [payload]})
            });

            const data: FetchProductDetailsResponse = await response.json();
            setCaravan(data.products?.[0] ?? null);

        } catch(err) {
            
        } finally {
            setIsLoading(false);
        }
    }

    useFocusEffect(
        useCallback(() => {
            if (fontsLoaded && !isLoading) {
                revealWipe();
            }
        }, [fontsLoaded, isLoading, revealWipe])
    );

    /*
    export type Caravan = {
        productId: string,
        categoryId: string,
        name: string,
        model: string,
        serialNumber: string,
        description: string,
        quantityInStocks: number,
        basePrice: string,
        currentPrice: string,
        discountRate: number,
        warrantyStatus: string,
        distributorInfo: string,
        berthCount: number,
        fuelType: string,
        weightKg: number,
        hasKitchen: boolean,
        createdAt: string,
        updatedAt: string
    }
        */

    useEffect(() => {
        fetchProduct({payload: productId as string, API_BASE_URL: API_BASE_URL, FETCH_PRODUCTS_DETAILS_END_POINT: FETCH_PRODUCTS_DETAILS_END_POINT})
    }, [])

    return (
        <View style={styles.mainContainer}>
            <Navbar></Navbar>

            <View style={styles.contentContainer}> 

                <View style={styles.productContainer}>
                    <View style={styles.imageContainer}>

                    </View>

                    <View style={styles.productDetailsContainer}>

                        <View style={styles.productDetails}>
                            <Text style={styles.productDetailsText}>{caravan?.name}</Text>
                            <Text style={styles.productDetailsText}>{caravan?.model}</Text>
                            <Text style={styles.productDetailsText}>{caravan?.serialNumber}</Text>
                            <Text style={styles.productDetailsText}>{caravan?.quantityInStocks}</Text>
                            <Text style={styles.productDetailsText}>{caravan?.berthCount}</Text>
                            <Text style={styles.productDetailsText}>{caravan?.fuelType}</Text>
                            <Text style={styles.productDetailsText}>{caravan?.weightKg}</Text>
                            <Text style={styles.productDetailsText}>{caravan?.hasKitchen}</Text>
                            <Text style={styles.productDetailsText}>{caravan?.warrantyStatus}</Text>
                            <Text style={styles.productDetailsText}>{caravan?.description}</Text>
                            <Text style={styles.productDetailsCaravanBasePrice}>{caravan?.basePrice}</Text>
                            <Text style={styles.productDetailsCaravanCurrentPrice}>{caravan?.currentPrice}</Text>
                            <Text style={styles.productDetailsCaravanDiscountRate}>{caravan?.discountRate}</Text>
                        </View>

                        <View style={styles.productButtonsContainer}>
                            <View style={styles.productAddCardButton}>
                                <WrappedGeneralButton 
                                    textStyles={styles.productAddCardButtonText}
                                    wrapperStyles={styles.productAddCardButtonWrapper} 
                                    title="Press" 
                                    onPress={() => {}}
                                />
                            </View>
                            <View style={styles.productAddWishButton}>

                            </View>
                        </View>

                    </View>

                </View>

                <View style={styles.commentContainer}>
                    
                </View>
                
            </View>
        </View>
    )
}


const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#d6cba6',
    },
    contentContainer: {
        flex: 1,
        backgroundColor: '#ff0000',
        marginVertical: '1%',
        marginHorizontal: '10%'
    },
    productContainer: {
        flexDirection: 'row',
        flex: 3,
        backgroundColor: '#347145',
    },
    imageContainer: {
        flex: 1,
        backgroundColor: '#792626',
    },
    productDetailsContainer: {
        flex: 1,
        backgroundColor: '#002c1b',
    },
    productDetails: {
        flex: 1,
        backgroundColor: '#6c996a',
        padding: '5%'
    },
    productDetailsText: {
        fontFamily: 'Montserrat_400Regular',
        color: '#283618',
        fontSize: 20,
        marginBottom: 4,
    },
    productDetailsCaravanBasePrice: {
        fontFamily: 'Montserrat_400Regular',
        color: '#283618',
        fontSize: 20,
        marginBottom: 4,
    },
    productDetailsCaravanCurrentPrice: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 20,
        color: '#bc6c25',
        marginBottom: 12,
    },
    productDetailsCaravanDiscountRate: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 20,
        color: '#bc6c25',
        marginBottom: 12,
    },
    productButtonsContainer: {
        width: '100%',
        flexDirection: 'row',
        backgroundColor: '#881d1d',
    },
    productAddCardButton: {
        flex: 1,
        backgroundColor: '#4ba8c4',
    },
    productAddCardButtonText: {
        fontFamily: 'Montserrat_400Regular',
        color: '#283618',
        fontSize: 20,
        marginBottom: 4,
    },
    productAddCardButtonWrapper: {
        flex: 1,
        margin: '3%',
        backgroundColor: '#ff0000'
    },
    productAddWishButton: {
        height: 100,
        width: 50,
        backgroundColor: '#802069',
    },
    commentContainer: {
        flex: 2,
        backgroundColor: '#631b99',
    }
}) 