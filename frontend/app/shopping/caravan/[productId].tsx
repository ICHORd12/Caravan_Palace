//#region IMPORTS
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import {
    Montserrat_400Regular,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    useFonts
} from '@expo-google-fonts/montserrat';
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from '@/context/AuthContext'
import { useTransition } from '@/context/TransitionContext'
import { useToast } from '@/context/ToastContext'

import { commentSortOptions, commentMockData } from "@/constants/MOCKDATA";
import {API_BASE_URL, FETCH_PRODUCTS_DETAILS_END_POINT} from "@/constants/API"
import { Caravan, FetchProductDetailsResponse } from '@/models/BACKEND_MODELS'

import Navbar from "@/components/Navbar/Navbar";
import WrappedGeneralButton from "@/components/Buttons/GeneralButtonWithWrapper/GeneralButtonWithWrapper";
import DetailRow from "@/components/DetailRow/DetailRow";
import Comment from "@/components/CommentComponents/Comment/Comment";
//#endregion

//#region INPUT INTERFACES

interface FetchProductInput {
    payload: string;
    API_BASE_URL: string;
    FETCH_PRODUCTS_DETAILS_END_POINT: string;
}

//#endregion

export default function Product()
{   
    const { token, isAuthenticated } = useAuth();
    const { showToast } = useToast();
    const { revealWipe } = useTransition();

    const [isLoading, setIsLoading] = useState(true);
    
    const [caravan, setCaravan] = useState<Caravan | null>(null);
    const [isWished, setIsWished] = useState(false);
    const [sortOption, setSortOption] = useState(commentSortOptions[0].value);
    const [userRating, setUserRating] = useState(0);
    const [commentText, setCommentText] = useState("");

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
            console.error("Something went wrong?")
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


    useEffect(() => {
        fetchProduct({payload: productId as string, API_BASE_URL: API_BASE_URL, FETCH_PRODUCTS_DETAILS_END_POINT: FETCH_PRODUCTS_DETAILS_END_POINT})
    }, [])

    //#region AFTER
    
    const discountRate = Number(caravan?.discountRate ?? 0);
    const hasDiscount = discountRate > 0;

    //#endregion


    return (
        <View style={styles.mainContainer}>
            <Navbar></Navbar>

            <View style={styles.contentContainer}> 

                <View style={styles.productContainer}>
                    <View style={styles.imageContainer}>

                    </View>

                    <View style={styles.productDetailsContainer}>

                        <View style={styles.productDetails}>
                            <DetailRow label="Caravan Name:" value={caravan?.name ?? ""}/>


                            <DetailRow label="Caravan Model:" value={caravan?.model ?? ""}/>
                            

                            <DetailRow label="Serial Number:" value={caravan?.serialNumber ?? ""}/>
                            

                            <DetailRow label="Quantity In Stocks:" value={caravan?.quantityInStocks ?? ""}/>
                            

                            <DetailRow label="Berth Count:" value={caravan?.berthCount ?? ""}/>

                            <DetailRow label="Fuel Type:" value={caravan?.fuelType ?? ""}/>
                            

                            <DetailRow label="Weight In KG:" value={caravan?.weightKg ?? ""}/>
                            

                            <DetailRow label="Has Kitchen:" value={caravan?.hasKitchen ? "Yes" : "No"}/>

                            <DetailRow label="Warranty Status:" value={caravan?.warrantyStatus ?? ""}/>

                            <View style={styles.productDetailsDescriptionContainer}>
                                <Text style={styles.productDetailsText}>{caravan?.description}</Text>
                            </View>
                            
                            <View style={styles.productDetailsPriceContainer}>

                                {hasDiscount ? (
                                    <>
                                        <View style={styles.basePriceCrossContainer}>
                                            <Text style={styles.productDetailsCaravanBasePrice}>{caravan?.basePrice}</Text>
                                            <View style={styles.diagonalLine}/>
                                        </View>

                                        <Text style={styles.productDetailsCaravanCurrentPrice}>{caravan?.currentPrice}</Text>

                                        <View style={styles.productDetailsDiscountRateContainer}>
                                            <Text style={styles.productDetailsCaravanDiscountRate}>%{caravan?.discountRate}</Text>
                                        </View>
                                    </>
                                ) : (
                                    <>
                                        <Text style={styles.productDetailsCaravanBasePrice}>{caravan?.basePrice}</Text>
                                    </>
                                )}                                
                            </View>
                            
                        </View>

                        <View style={styles.productButtonsContainer}>

                            <View style={styles.productAddCardButton}>
                                <WrappedGeneralButton 
                                    wrapperStyles={styles.productAddCardButtonWrapper} 
                                    textStyles={styles.productAddCardButtonText}
                                    title="Add To Card" 
                                    onPress={() => {}}
                                />
                            </View>

                            {isAuthenticated && (
                            
                                <Pressable
                                    style={styles.productWishButtonContainer}
                                    onPress={(event: any) => {
                                        event?.stopPropagation?.();
                                    }}
                                >
                                    <Ionicons
                                        name={isWished ? "bookmark" : "bookmark-outline"}
                                        size={30}
                                        color={isWished ? "#bc6c25" : "#283618"}
                                    />
                                </Pressable>
                            
                            )}

                        </View>

                    </View>

                </View>

                <View style={styles.commentContainer}>
                    <Comment
                        canComment
                        avgPoint={5}
                        dropDownSortOptions={commentSortOptions}
                        dropDownselectedValue={sortOption}
                        dropDownOnChange={setSortOption}
                        userRating={userRating}
                        commentText={commentText}
                        onWriteCommentRating={setUserRating}
                        onCommentText={setCommentText}
                        dataArray={commentMockData}
                    />
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
        alignSelf: 'center',
        borderRadius: 10,
        width: '100%',
        maxWidth: 1000,
        marginVertical: 10,
        overflow: 'hidden'
    },
    productContainer: {
        flexDirection: 'row',
        padding: 10,
        marginBottom: 10,
        backgroundColor: 'rgba(159, 159, 159, 0.4)',
    },
    imageContainer: {
        flex: 1,
        backgroundColor: '#792626',
    },
    productDetailsContainer: {
        flex: 1,
    },
    productDetails: {
        flex: 1,
        padding: 10,
    },
    productDetailsDescriptionContainer: {
        marginTop: 10,
    },
    productDetailsText: {
        fontFamily: 'Montserrat_400Regular',
        color: '#283618',
        fontSize: 20,
        marginBottom: 4,
    },
    
    /*  PRICE */
    productDetailsPriceContainer: {
        flexDirection: 'row',
        marginTop: 10,
        gap: 20
    },
    basePriceCrossContainer: {
        position: "relative",
        alignSelf: "flex-start",
    },
    productDetailsCaravanBasePrice: {
        fontFamily: 'Montserrat_400Regular',
        color: '#283618',
        fontSize: 20,
    },
    diagonalLine: {
        position: "absolute",
        left: 0,
        right: 0,
        top: "50%",
        height: 2,
        backgroundColor: "#283618",
        transform: [{ rotate: "-12deg" }],
    },
    productDetailsCaravanCurrentPrice: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 20,
        color: '#bc6c25',
    },
    productDetailsDiscountRateContainer: {
        borderRadius: 5,
        paddingHorizontal: 5,
        backgroundColor: '#053802'
    },
    productDetailsCaravanDiscountRate: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 20,
        color: '#acacac',
    },

    /* BUTTONS */
    productButtonsContainer: {
        width: '100%',
        marginTop: 5,
        flexDirection: 'row',
        alignItems: 'center'
    },
    productAddCardButton: {
        flex: 1,
        justifyContent: 'center'
    },
    productAddCardButtonText: {
        fontFamily: 'Montserrat_400Regular',
        color: '#b6b6b6',
        fontSize: 20,
    },
    productAddCardButtonWrapper: {
        padding: 5, 
        marginHorizontal: 15,
        borderRadius: 8,
        backgroundColor: '#0a483f'
    },
    productWishButtonContainer: {
        marginRight: 5
    },

    /* COMMENT */
    commentContainer: {
        flex: 2,
        backgroundColor: 'rgba(159, 159, 159, 0.4)',
    }
}) 