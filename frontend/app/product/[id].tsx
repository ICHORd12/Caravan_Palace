import { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Pressable, TextInput, Platform } from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";


import { useAuth } from "@/context/AuthContext";
import { useTransition } from "@/context/TransitionContext";
import { useToast } from "@/context/ToastContext"

import { Caravan, ReviewEligibility, UserReview, Review, GetProductIdDetailsResponse } from "@/models/BACKEND_MODELS";
import {API_BASE_URL, PRODUCTS_BASE_ENDPOINT, GET_BACKEND_CART, UPDATE_QUANTITY_END_POINT} from "@/constants/API"
import {Colors, Fonts} from '@/constants/theme'

import WrappedGeneralButton from "@/components/Buttons/GeneralButtonWithWrapper/GeneralButtonWithWrapper";
import Navbar from "@/components/Navbar/Navbar";



//#region FeatureWithBackground Component


interface FeatureWithBackgroundProps {
    label: string;
    value: string | number;
}

function FeatureWithBackground({label, value}: FeatureWithBackgroundProps)
{
    return (
        <View style={productDetailsStyles.featureContainer}>
            <Text style={productDetailsStyles.featureLabel}>{label}</Text>
            <Text style={productDetailsStyles.featureValue}>{value}</Text>
        </View>
    )
}
//#endregion



//#region UpdateQuantityButton Component


type UpdateQuantityPayload = 
    | { type: 'delta'; amount: number }
    | { type: 'absolute'; newQuantity: number };

interface UpdateQuantityButtonProps {
    currentQuantity: number;
    quantityInStocks: number;
    isLoading?: boolean;
    onUpdateQuantity: (payload: UpdateQuantityPayload) => void; 
}

function UpdateQuantityButton({currentQuantity, quantityInStocks, isLoading = false, onUpdateQuantity}: UpdateQuantityButtonProps) 
{
    const [localStringQty, setLocalStringQty] = useState(currentQuantity.toString());

    const handleTextChange = (text: string) => {
        setLocalStringQty(text.replace(/[^0-9]/g, '')); 
    };

    const handleCommit = () => {
        let parsed = parseInt(localStringQty, 10);
        
        if (isNaN(parsed) || parsed < 0) parsed = currentQuantity;
        if (parsed > quantityInStocks) parsed = quantityInStocks;

        if (parsed === currentQuantity) 
        {
            setLocalStringQty(currentQuantity.toString());
            return;
        }

        setLocalStringQty(parsed.toString()); 
        onUpdateQuantity({type: 'absolute', newQuantity: parsed}); 
    };

    useEffect(() => {
        if (!isLoading) setLocalStringQty(currentQuantity.toString());

    }, [currentQuantity, isLoading]);

    const isMaxedOut = currentQuantity >= quantityInStocks;
    const isOutOfStock = quantityInStocks <= 0;

    return (
        <View style={updateQuantityButtonStyles.mainContainer}>
            {currentQuantity === 0 ? (
                <WrappedGeneralButton
                    wrapperStyles={updateQuantityButtonStyles.addButtonWrapper}
                    textStyles={updateQuantityButtonStyles.addButtonText}
                    title="Add to Cart"
                    disabled={isLoading || isOutOfStock}
                    onPress={() => {
                        onUpdateQuantity({type: 'delta', amount: 1})
                    }}
                />
            ) : (
                <View style={updateQuantityButtonStyles.quantityControlsContainer}>
                    <Pressable 
                        disabled={isLoading} 
                        style={[updateQuantityButtonStyles.quantityButton, (isLoading) && {opacity: 0.5}]} 
                        onPress={() => {
                            onUpdateQuantity({type: 'delta', amount: -1});
                        }}
                    >
                        <Ionicons 
                            name={currentQuantity === 1 ? "trash-outline" : "remove"} 
                            size={18} 
                            color="#fefae0" 
                        />
                    </Pressable>

                    <TextInput 
                        style={updateQuantityButtonStyles.quantityTextInput} 
                        value={localStringQty} 
                        onChangeText={handleTextChange}
                        onBlur={handleCommit}
                        onSubmitEditing={handleCommit}
                        keyboardType="numeric"
                        editable={!isLoading}
                    />

                    <Pressable 
                        disabled={isLoading || isMaxedOut} 
                        style={[updateQuantityButtonStyles.quantityButton, (isLoading || isMaxedOut) && {opacity: 0.5}]} 
                        onPress={() => {
                            onUpdateQuantity({type: 'delta', amount: 1});
                        }}
                    >
                        <Ionicons 
                            name="add" 
                            size={18} 
                            color="#fefae0" 
                        />

                    </Pressable>

                </View>
            )}
        </View>
    )
}
//#endregion


//#region Product Details Component


interface ProductDetailsProps {
    product: Caravan;
    currentQuantity: number;
    isLoading?: boolean;
    onUpdateQuantity: (payload: UpdateQuantityPayload) => void;
}

function ProductDetails({product, currentQuantity, isLoading, onUpdateQuantity}: ProductDetailsProps)
{   

    const hasDiscount: boolean = (product.discountRate > 0);
    const hasStock: boolean = (product.quantityInStocks > 0);

    return(
        <View style={productDetailsStyles.mainContainer}>
            <View style={productDetailsStyles.imageContainer}>

            </View>

            <View style={productDetailsStyles.detailsContainer}>

                <View style={productDetailsStyles.upperButtonContainer}>

                    <View style={productDetailsStyles.titleContainer}>
                        <Text style={productDetailsStyles.titleCaravanName}>{product.name}</Text>
                        <Text style={productDetailsStyles.subTitleCaravanModel}>{product.model}</Text>
                    </View>

                    
                        {hasStock && (
                            <View style={productDetailsStyles.quantityInStocksContainer}> 
                                <Text style={productDetailsStyles.quantityInStocksText}>In Stock: {product.quantityInStocks}</Text>
                            </View>
                        )}
                    
                    

                    <View style={productDetailsStyles.featuresContainer}>
                        <FeatureWithBackground label="Fuel Type" value={product.fuelType}/>
                        <FeatureWithBackground label="Weight" value={product.weightKg}/>
                        <FeatureWithBackground label="Berths" value={product.berthCount}/>
                        <FeatureWithBackground label="Kitchen" value={product.hasKitchen ? "Yes" : "No"}/>
                        <FeatureWithBackground label="Warranty" value={product.warrantyStatus}/>
                    </View>

                    <View style={productDetailsStyles.descriptionContainer}> 
                        <Text style={productDetailsStyles.descriptionLabel}>Description</Text>
                        <Text style={productDetailsStyles.descriptionValue}>{product.description}</Text>
                    </View>

                    <View style={productDetailsStyles.priceContainer}>
                        
                        <Text style={[productDetailsStyles.basePrice, hasDiscount && productDetailsStyles.basePriceDiscounted]}>{product.basePrice}$</Text>

                        {hasDiscount && (
                            <Text style={productDetailsStyles.currentPrice}>{product.currentPrice}$</Text>
                        )}

                        {hasDiscount && (
                            <View style={productDetailsStyles.discountContainer}>
                                <Text style={productDetailsStyles.discount}>{product.discountRate}% !</Text>
                            </View>
                        )}
                    
                    </View>

                </View>

                
                

                <View style={productDetailsStyles.updateQuantityButtonContainer}>


                    <UpdateQuantityButton
                        currentQuantity={currentQuantity}
                        quantityInStocks={product.quantityInStocks}
                        isLoading={isLoading}
                        onUpdateQuantity={onUpdateQuantity}
                    />
                </View>

            </View>
        </View>
    )
}
//#endregion


//#region Write Comment Component

interface WriteCommentProps {
    isEligible: boolean;
    userReview?: UserReview;
    isLoading? : boolean;
    onUserReviewChange: (newReview: UserReview) => void;
}

function WriteComment({isEligible, userReview, isLoading = false, onUserReviewChange}: WriteCommentProps)
{
    return (
        <>
        
        {isEligible ? (
            <View style={writeCommentStyles.mainContainer}>

                <View style={writeCommentStyles.ratingContainer}>
                    <Text style={writeCommentStyles.ratingLabel}>Give a rating: </Text>

                </View>

                <View style={writeCommentStyles.commentContainer}>

                </View>

                <View style={writeCommentStyles.submitButtonContainer}>
                    <WrappedGeneralButton 
                        wrapperStyles={writeCommentStyles.submitButtonWrapper}
                        textStyles={writeCommentStyles.submitButtonText}
                        title="Submit"
                        disabled={isLoading}
                        onPress={() => onUserReviewChange}
                    />
                </View>

            </View>
        ): (
            null
        )} 
        </>
    )
}
//#endregion


//#region Comment Summary Component


function CommentSummary()
{
    return (
        <View>

        </View>
    )
}
//#endregion


//#region Flat List Top Aggregation Component


function FlatListTopAggregation()
{
    return (
        <View>
            <View style={styles.productDetailsContainer}>
            </View>

            <View style={styles.writeCommentContainer}>
            </View>

            <View style={styles.commentSummaryContainer}>
            </View>
        </View>
    )
}
//#endregion




export default function Product()
{
    const {revealWipe} = useTransition();
    const {showToast} = useToast();
    const {isAuthenticated, token} = useAuth();
    
    const { id } = useLocalSearchParams();

    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingUpdateQuantity, setIsLoadingUpdateQuantity] = useState(false);
    const [product, setProduct] = useState<Caravan | null>(null)
    const [productQuantity, setProductQuantity] = useState(0);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [userReview, setUserReview] = useState<UserReview | null>(null);
    const [reviewEligibility, setReviewEligibility] = useState<ReviewEligibility | null>(null);

    //#region FETCH PRODUCT QUANTITY

    function getQuantityInformationNotAuth()
    {
        const key = `cart_${id}`;
        const savedValue = window.localStorage.getItem(key);
        const quantity = savedValue ? parseInt(savedValue, 10) : 0;
        
        setProductQuantity(quantity);
    }
    
    async function getQuantityInformationAuth()
    {
        const _token = token

        try {
            const response = await fetch(`${API_BASE_URL}${GET_BACKEND_CART}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${_token}`
                },
            });

            const responseData = await response.json();
            if (response.ok) 
            {
                const items = responseData.items;
                for(let i = 0; i < items.length; i++)
                {
                    const item = items[i];
                    if(id === item.productId)
                    {
                        setProductQuantity(item.quantity);
                        break;
                    }
                }
            }
            else
            {
                showToast(`Failed: ${responseData.message}`, 'info')
            }
        } catch (error: any) {
            showToast("Something Went Wrong While Fetching Quantity Information", 'error');
        }
    }
    
    async function getQuantityInformation() 
    {

        if (isAuthenticated)    getQuantityInformationAuth();
        else                    getQuantityInformationNotAuth();
    }


    //#endregion


    //#region FETCH PRODUCT DETAILS


    async function getProductDetailsNotAuth()
    {
        setIsLoading(true);
        console.log(id);
        try {
            const response = await fetch(`${API_BASE_URL}${PRODUCTS_BASE_ENDPOINT}/${id}/details`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            const responseData: GetProductIdDetailsResponse = await response.json();

            if (response.ok)
            {
                setProduct(responseData.product);
                setReviewEligibility(responseData.reviewEligibility);
                setUserReview(responseData.userReview);
                setReviews(responseData.reviews);
            }
            else                showToast(`${responseData.message}`, 'info');

            console.log("ReviewEligibility: ", reviewEligibility);
            console.log("UserReview: ", userReview);
            console.log("Reviews: ", reviews);

        } catch (err) {
            showToast("Something Went Wrong", 'error');
        } finally {
            setIsLoading(false);
        }
    }

    async function getProductDetailsAuth()
    {
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}${PRODUCTS_BASE_ENDPOINT}/${id}/details`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const responseData: GetProductIdDetailsResponse = await response.json();

            if (response.ok)
            {
                setProduct(responseData.product);
                setReviewEligibility(responseData.reviewEligibility);
                setUserReview(responseData.userReview);
                setReviews(responseData.reviews);
            }
            else                showToast(`${responseData.message}`, 'info');

        } catch (err) {
            showToast("Something Went Wrong", 'error');
        } finally {
            setIsLoading(false);
        }   
    }

    async function getProductDetails()
    {
        if (isAuthenticated) getProductDetailsAuth();
        else                 getProductDetailsNotAuth();
    }
    //#endregion


    //#region BUTTON HANDLERS

    function onUpdateQuantityNotAuth(payload: UpdateQuantityPayload)
    {
        setIsLoadingUpdateQuantity(true);

        const currentQuantity = productQuantity ?? 0;
        let targetQuantity: number = currentQuantity;
        if (payload.type === 'delta')   targetQuantity += payload.amount;
        else                            targetQuantity = payload.newQuantity;

        const key = `cart_${id}`;
        window.localStorage.setItem(key, targetQuantity.toString());

        setProductQuantity(targetQuantity);

        setIsLoadingUpdateQuantity(false);
    }

    async function onUpdateQuantityAuth(payload: UpdateQuantityPayload)
    {   
        setIsLoadingUpdateQuantity(true);

        const currentQuantity = productQuantity;
        let targetQuantity: number = currentQuantity;
        if (payload.type === 'delta')   targetQuantity += payload.amount;
        else                            targetQuantity = payload.newQuantity;

        try {
            const response = await fetch(`${API_BASE_URL}${UPDATE_QUANTITY_END_POINT}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ productId: id, quantity: targetQuantity})
            });
            
            const responseData = await response.json();

            if (response.ok) setProductQuantity(targetQuantity);
            else             showToast(`Error: ${responseData.message}`, 'info');

        } catch (err) {
            showToast("Something Went Wrong", 'error')
        } finally {
            setIsLoadingUpdateQuantity(false);
        }
        
    }


    async function onUpdateQuantity(payload: UpdateQuantityPayload)
    {
        if (isAuthenticated)    onUpdateQuantityAuth(payload);
        else                    onUpdateQuantityNotAuth(payload);
    }

    //#endregion


    //#region EFFECTS


    useFocusEffect(
        useCallback(() => {
            getProductDetails();
            getQuantityInformation();
        }, [])
    )

    useEffect(() => {
        if (!isLoading) revealWipe();

    }, [isLoading]);
    //#endregion


    return (
        <View style={styles.mainContainer}>
            {isLoading ? (
                <ActivityIndicator size="large" color="#21758f" />
            ) : (
                <View>

                    <Navbar/>

                    <ProductDetails 
                        product={product!}
                        currentQuantity={productQuantity}
                        isLoading={isLoadingUpdateQuantity}
                        onUpdateQuantity={onUpdateQuantity}
                    />
               
                </View>
            )}
            
        </View>
    )
}

const updateQuantityButtonStyles = StyleSheet.create({
    mainContainer: {
        height: 60, 
        paddingHorizontal: '3%',
        justifyContent: 'center',
    },
    addButtonWrapper: {
        height: 55,
        borderRadius: 8,
        backgroundColor: Colors.light.greenButtonBackground,
    },
    addButtonText: {
        color: Colors.light.greenButtonTextColor,
        fontFamily: Fonts.semibold,
        fontSize: 14,
    },
    quantityControlsContainer: {
        width: '100%',
        height: 55,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.light.quantityControlBackground,
        borderRadius: 8,
        paddingHorizontal: 4,
    },
    quantityButton: {
        backgroundColor: Colors.light.greenButtonBackground,
        width: 50, 
        height: 50,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        ...(Platform.OS === 'web' && { cursor: 'pointer' }),
    },
    quantityTextInput: {
        flex: 1, 
        height: '80%',
        fontFamily: 'Montserrat_700Bold',
        fontSize: 16,
        color: Colors.light.greenButtonBackground,
        textAlign: 'center',
    },
});

const productDetailsStyles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        flexDirection: 'row',
        padding: 10,
        backgroundColor: '#e3a2a2'
    },
    imageContainer: {
        flex: 1,
        backgroundColor: Colors.light.imageFillerColor
    },
    detailsContainer: {
        flex: 1,
    },
    upperButtonContainer: {
        paddingLeft: '3%',
    },
    titleContainer: {
        marginBottom: 20,
    },
    titleCaravanName: {
        fontFamily: Fonts.bold,
        fontSize: 24,
        color: Colors.light.mainTextColor,
    },
    subTitleCaravanModel: {
        fontFamily: Fonts.regular,
        fontSize: 16,
        color: Colors.light.mainTextColor,
    },
    quantityInStocksContainer: {
        marginBottom: 20,
    },
    quantityInStocksText: {
        fontFamily: Fonts.regular,
        fontSize: 16,
        color: Colors.light.mainTextColor,
    },
    featuresContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 25,
    },
    featureContainer: {
        backgroundColor: Colors.light.softContainerBackground,
        padding: 8,
        borderRadius: 6,
    },
    featureLabel: {
        fontFamily: Fonts.semibold,
        fontSize: 16,
        color: Colors.light.mainTextColor,
    },
    featureValue: {
        fontFamily: Fonts.regular,
        fontSize: 14,
        color: Colors.light.mainTextColor,
    },
    descriptionContainer: {
        marginBottom: 25,
    },
    descriptionLabel: {
        fontFamily: Fonts.semibold,
        fontSize: 16,
        color: Colors.light.mainTextColor,
    },
    descriptionValue: {
        fontFamily: Fonts.regular,
        fontSize: 14,
        color: Colors.light.mainTextColor,
    },
    priceContainer: {
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
    },
    basePrice: {
        fontFamily: Fonts.semibold,
        fontSize: 30,
        color: Colors.light.basePriceTextColor, 
    },
    basePriceDiscounted: {
        fontFamily: Fonts.semibold,
        fontSize: 22,
        color: Colors.light.basePriceDiscountedTextColor,
        textDecorationLine: 'line-through',
    },
    currentPrice: {
        fontFamily: Fonts.bold,
        fontSize: 30,
        color: Colors.light.currentPriceTextColor,
    },
    discountContainer: {
        padding: 8,
        borderRadius: 10,
        backgroundColor: Colors.light.discountBackground,
    },
    discount: {
        fontFamily: Fonts.bold,
        fontSize: 26,
        color: Colors.light.discountTextColor,
    },
    updateQuantityButtonContainer: {

    }
});

const writeCommentStyles = StyleSheet.create({
    mainContainer: {

    },
    ratingContainer: {

    },
    ratingLabel: {

    },
    commentContainer: {

    },
    submitButtonContainer: {

    },
    submitButtonWrapper: {

    },
    submitButtonText: {

    }
});

const commentSummaryStyles = StyleSheet.create({

});

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: Colors.light.mainBackground,
    },
    productDetailsContainer: {

    },
    writeCommentContainer: {

    },
    commentSummaryContainer: {

    }
});