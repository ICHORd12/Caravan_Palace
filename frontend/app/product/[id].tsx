//#region IMPORTS


import { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Pressable, TextInput, Platform, Image, TouchableOpacity, FlatList } from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";


import { useAuth } from "@/context/AuthContext";
import { useTransition } from "@/context/TransitionContext";
import { useToast } from "@/context/ToastContext"

import { Caravan, ReviewEligibility, Review, GetProductIdDetailsResponse } from "@/models/BACKEND_MODELS";
import {API_BASE_URL, PRODUCTS_BASE_ENDPOINT, GET_BACKEND_CART, UPDATE_QUANTITY_END_POINT, REVIEWS_ENDPOINT} from "@/constants/API"
import {Colors, Fonts} from '@/constants/theme'

import WrappedGeneralButton from "@/components/Buttons/GeneralButtonWithWrapper/GeneralButtonWithWrapper";
import Navbar from "@/components/Navbar/Navbar";
import { WishlistButton } from "@/components/ProductCard/ProductCard";
//#endregion


// COMPONENTS

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

            <View>

            </View>
            
        </View>
    )
}
//#endregion


//#region Product Details Component


interface ProductDetailsProps {
    product: Caravan;
    currentQuantity: number;
    isLoading?: boolean;
    isWishlisted: boolean;
    onUpdateQuantity: (payload: UpdateQuantityPayload) => void;
    onWishListToggle: () => void;
}

function ProductDetails({product, currentQuantity, isLoading, isWishlisted, onUpdateQuantity, onWishListToggle}: ProductDetailsProps)
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

    const hasDiscount: boolean = (product.discountRate > 0);
    const hasStock: boolean = (product.quantityInStocks > 0);

    return(
        <View style={productDetailsStyles.mainContainer}>

            <View style={productDetailsStyles.imageContainer}>
                {product.images && product.images.length > 0 ? (
                    <>
                        <Image 
                            source={{ uri: product.images[currentImageIndex].url }} 
                            style={productDetailsStyles.productImage} 
                            resizeMode="cover" 
                        />
                        
                        {/* Only show arrows if there are multiple images */}
                        {product.images.length > 1 && (
                            <>
                                <Pressable 
                                    onPress={prevImage} 
                                    style={{ position: 'absolute', left: 16, top: '50%', marginTop: -24, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 24, padding: 8 }}
                                >
                                    <Ionicons name="chevron-back" size={28} color="white" />
                                </Pressable>
                                
                                <Pressable 
                                    onPress={nextImage} 
                                    style={{ position: 'absolute', right: 16, top: '50%', marginTop: -24, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 24, padding: 8 }}
                                >
                                    <Ionicons name="chevron-forward" size={28} color="white" />
                                </Pressable>
                            </>
                        )}
                    </>
                ) : (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Text>No Image Available</Text>
                    </View>
                )}
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
                    <WishlistButton 
                        isWishlisted={isWishlisted}
                        size={40}
                        onToggle={onWishListToggle}
                    />
                </View>

            </View>
        </View>
    )
}
//#endregion


//#region Write Review Component

interface WriteReviewProps {
    isEligible: boolean;
    userReview: Review | null;
    onUserReviewChange: ({rating, commentText}: {rating: number, commentText: string}) => Promise<boolean>;
}

function WriteReview({isEligible, userReview, onUserReviewChange}: WriteReviewProps)
{   
    if (!isEligible && userReview === null) return null;

    const {showToast} = useToast();
    const [commentText, setCommentText] = useState("");
    const [rating, setRating] = useState(5);
    const [userName, setUserName] = useState("");
    const [isApproved, setIsApproved] = useState(false);
    const [createdAt, setCreatedAt] = useState("");
    const [updatedAt, setUpdatedAt] = useState("");

    const [isEditing, setIsEditing] = useState(false);
    const [isLoadingSubmitReview, setIsLoadingSubmitReview] = useState(false);
    const [didSomethingWentWrong, setDidSomethingWentWrong] = useState(false);

    function handleEditCancel(target: boolean)
    {
        if (target === false)
        {
            const prevCommentText = userReview ? userReview.commentText : "";
            const prevUserRating = userReview ? userReview.rating : 0;
            const prevUserName = userReview ? userReview.userName : "";
            const prevIsApproved = userReview ? userReview.isApproved : false;
            const prevCreatedDate = userReview ? userReview.createdAt : "";
            const prevUpdatedDate = userReview ? userReview.updatedAt : "";

            setCommentText(prevCommentText);
            setRating(prevUserRating);
            setUserName(prevUserName);
            setIsApproved(prevIsApproved);
            setCreatedAt(prevCreatedDate);
            setUpdatedAt(prevUpdatedDate);
        }
        setIsEditing(target);
    }

    async function handleSubmit({rating, commentText}: {rating: number, commentText: string})
    {
        setIsEditing(false);
        setIsLoadingSubmitReview(true);

        const response = await onUserReviewChange({rating, commentText});
        
        if (response === true)
        {
            showToast("Your Review Successfully submitted", 'success');
            setDidSomethingWentWrong(false);
        }
        else
        {
            showToast("Something Went Wrong", 'info');
            setDidSomethingWentWrong(true);
        } 

        setIsLoadingSubmitReview(false);
    }

    function calculateChange(): boolean
    {
        if (userReview === null)
        {
            if (commentText || rating) return true;
            else                       return false;
        }
        else
        {
            const userCommentText = userReview.commentText;
            const userRating = userReview.rating;
            if (commentText === userCommentText && rating === userRating) return false;
            else return true;
        }
    }

    useEffect(() => {
        if (!userReview) return;

        const prevCommentText = userReview.commentText;
        const prevUserRating = userReview.rating;
        const prevUserName = userReview.userName;
        const prevIsApproved = userReview.isApproved;
        const prevCreatedDate = userReview.createdAt;
        const prevUpdatedDate = userReview.updatedAt;

        setCommentText(prevCommentText);
        setRating(prevUserRating);
        setUserName(prevUserName);
        setIsApproved(prevIsApproved);
        setCreatedAt(prevCreatedDate);
        setUpdatedAt(prevUpdatedDate);

    },[userReview])

    const isUserReviewExists: boolean = (userReview !== null);
    const isChanged: boolean = calculateChange();
    const isDisabled: boolean =  (isUserReviewExists && !isEditing) ||  (isLoadingSubmitReview)

    return (
            <View style={writeReviewStyles.mainContainer}>

                <View style={writeReviewStyles.didSomethingWentWrongContainer}>
                    {didSomethingWentWrong && (
                        <Text style={writeReviewStyles.didSomethingWentWrongText}>Review Could Not Be Submitted!</Text>
                    )}
                </View>

                {isUserReviewExists && (
                    <View style={writeReviewStyles.editCommentButtonContainer}>
                        <WrappedGeneralButton 
                            wrapperStyles={writeReviewStyles.editCommentButtonWrapper}
                            textStyles={writeReviewStyles.editCommentButtonText}
                            title={isEditing ? "Cancel" : "Edit"}
                            disabled={isLoadingSubmitReview}
                            onPress={() => handleEditCancel(!isEditing)}                
                        />
                    </View>
                )}        

                    <View style={writeReviewStyles.nameContainer}> 
                        <Text style={writeReviewStyles.nameText}>{isApproved ? `${userName} (Review Approved)` : `${userName} (Review Pending)`}</Text>
                        <Text style={writeReviewStyles.dateText}>Created At: {createdAt}</Text>
                        <Text style={writeReviewStyles.dateText}>Updated At: {updatedAt}</Text>
                    </View>

                    <View style={[writeReviewStyles.ratingContainer, isDisabled && {opacity: 0.5}]}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity 
                                key={star}
                                disabled={isDisabled}
                                onPress={() => setRating(star)}
                                style={{ paddingHorizontal: 4 }} 
                            >
                                <Text style={{
                                    fontSize: 32, 
                                    color: star <= rating ? '#FFD700' : '#E0E0E0' 
                                }}>
                                    {star <= rating ? '★' : '☆'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={[writeReviewStyles.commentContainer, isDisabled && {opacity: 0.5}]}>
                        <TextInput 
                            style={[writeReviewStyles.commentTextInput]}
                            value={commentText}
                            onChangeText={setCommentText}
                            editable={!isDisabled}
                            multiline={true}
                            textAlignVertical="top"
                            maxLength={1000}
                        />
                    </View>

                    <View style={[writeReviewStyles.submitButtonContainer, isDisabled && {opacity: 0.5}]}>
                        <WrappedGeneralButton 
                            wrapperStyles={writeReviewStyles.submitButtonWrapper}
                            textStyles={writeReviewStyles.submitButtonText}
                            title="Submit"
                            disabled={isDisabled && !isChanged}
                            onPress={() => {
                                handleSubmit({rating: rating, commentText: commentText})
                            }}
                        />
                    </View>
            </View>
    )
}


//#endregion


//#region Flat List Top Aggregation Component

interface FlatListTopAggregationProps {
    productDetailsProps: ProductDetailsProps;
    writeReviewProps: WriteReviewProps;
}

function FlatListTopAggregation({productDetailsProps, writeReviewProps}: FlatListTopAggregationProps)
{
    return (
        <View>
            <ProductDetails 
                product={productDetailsProps.product}
                currentQuantity={productDetailsProps.currentQuantity}
                isLoading={productDetailsProps.isLoading}
                isWishlisted={productDetailsProps.isWishlisted}
                onUpdateQuantity={productDetailsProps.onUpdateQuantity}
                onWishListToggle={productDetailsProps.onWishListToggle}
            />

            <View style={flatListTopAggregationStyles.reviewsTitleContainer}>
                <Text style={flatListTopAggregationStyles.reviewsTitleText}>REVIEWS</Text>
            </View>
            

            <WriteReview 
                isEligible={writeReviewProps.isEligible}
                userReview={writeReviewProps.userReview}
                onUserReviewChange={writeReviewProps.onUserReviewChange}                    
            />

            
            
        </View>
    )
}
//#endregion


//#region Flat List Card Component

interface FlatListCardProps {
    review: Review | null;
}

function FlatListCard({review}: FlatListCardProps)
{
    if (!review) return null;

    return (
        <View style={flatListCardStyles.mainContainer}>
            <View style={flatListCardStyles.contentContainer}>

                <View style={flatListCardStyles.topBarContainer}>
                    {/* Star Component */}
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View>
                            {/* Background Empty Stars */}
                            <View style={{ flexDirection: 'row' }}>
                                {[1, 2, 3, 4, 5].map((_, index) => (
                                    <Text key={`empty-${index}`} style={{ color: '#E0E0E0', fontSize: 18 }}>★</Text>
                                ))}
                            </View>
                            {/* Foreground Filled Stars overlaid with exact percentage width */}
                            <View style={{ position: 'absolute', top: 0, left: 0, overflow: 'hidden', width: `${(Math.max(0, Math.min(5, review.rating)) / 5) * 100}%`, flexDirection: 'row' }}>
                                {[1, 2, 3, 4, 5].map((_, index) => (
                                    <Text key={`filled-${index}`} style={{ color: '#FFD700', fontSize: 18 }}>★</Text>
                                ))}
                            </View>
                        </View>
                        {/* Rating text representation */}
                        <Text style={{ marginLeft: 8, fontSize: 14 }}>{review.rating.toFixed(1)}</Text>
                    </View>

                    <Text style={flatListCardStyles.userNameText}>{review.userName}</Text>
                </View>
                <View style={flatListCardStyles.commentContainer}>
                    <Text style={flatListCardStyles.commentText}>{review.commentText}</Text>
                </View>
                <View style={flatListCardStyles.footerContainer}>
                    <View style={flatListCardStyles.dateContainer}>
                        <Text style={flatListCardStyles.dateText}>Created: {review.createdAt}</Text>
                        <Text style={flatListCardStyles.dateText}>Updated: {review.updatedAt}</Text>
                    </View>
                </View>

            </View>
        </View>
    )
}


//#endregion






// MAIN COMPONENT

export default function Product()
{   
    //#region INITIAL DEFINITIONS


    const {revealWipe} = useTransition();
    const {showToast} = useToast();
    const {isAuthenticated, token, isLoading} = useAuth();
    
    const { id } = useLocalSearchParams();

    const [isPageLoading, setIPageLoading] = useState(true);
    const [isLoadingUpdateQuantity, setIsLoadingUpdateQuantity] = useState(false);

    const [product, setProduct] = useState<Caravan | null>(null)
    const [productQuantity, setProductQuantity] = useState(0);
    const [isWishlist, setIsWishlist] = useState(false);

    const [reviews, setReviews] = useState<Review[]>([]);
    const [userReview, setUserReview] = useState<Review | null>(null);
    const [reviewEligibility, setReviewEligibility] = useState<ReviewEligibility | null>(null);
    //#endregion


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
        setIPageLoading(true);
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
            setIPageLoading(false);
        }
    }

    async function getProductDetailsAuth()
    {
        setIPageLoading(true);

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
            setIPageLoading(false);
        }   
    }

    async function getProductDetails()
    {
        if (isAuthenticated) getProductDetailsAuth();
        else                 getProductDetailsNotAuth();
    }
    //#endregion


    //#region FETCH WISHLIST


    async function fetchUserWishlist(controller: AbortController, currentProductId: string) 
    {
        if (!isAuthenticated || !token) {
            setIsWishlist(false);
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
                
                // Check if THIS specific product is in the user's wishlist array
                const isInWishlist = data.wishlist.some(
                    (item: any) => item.productId === currentProductId
                );
                
                setIsWishlist(isInWishlist);
            }
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error("Failed to fetch wishlist status:", error);
            }
        }
    }

    //#endregion

    //#region ON UPDATE QUANTITY


    function onUpdateQuantityNotAuth(payload: UpdateQuantityPayload)
    {
        setIsLoadingUpdateQuantity(true);

        const currentQuantity = productQuantity ?? 0;
        let targetQuantity: number = currentQuantity;
        if (payload.type === 'delta')   targetQuantity += payload.amount;
        else                            targetQuantity = payload.newQuantity;

        const key = `cart_${id}`;
        if (targetQuantity <= 0) window.localStorage.removeItem(key);
        else window.localStorage.setItem(key, targetQuantity.toString());
        
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


    //#region ON SUBMIT REVIEW


    async function onSubmitReview({rating, commentText}: {rating: number, commentText: string}): Promise<boolean>
    {
        try {
            const response = await fetch(`${API_BASE_URL}${REVIEWS_ENDPOINT}/${id}/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ rating: rating, commentText: commentText})
            });
            
            const responseData = await response.json();
            if (response.ok)
            {
                const responseReview = responseData.review;
                setUserReview(responseReview);
                return true;
            }
            else 
            {
                showToast("Something Went Wrong While Submitting", 'info');
                return false;
            }
        } catch(err) {
            showToast("Something Went Wrong While Submitting", 'error');
            return false;
        } 
    }

    //#endregion


    //#region ON TOGGLE WISHLIST


    async function handleToggleWishlist(currentProductId: string) 
    {
        // Capture the current state before we optimistically change it
        const previousState = isWishlist;
        const method = previousState ? 'DELETE' : 'POST';
        const endpoint = `${API_BASE_URL}/api/v3/wishlist/${currentProductId}`;

        // Optimistic UI Update: instantly toggle the local state
        setIsWishlist(!previousState);

        try {
            const response = await fetch(endpoint, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('API request failed');
            }

            showToast(method === 'DELETE' ? 'Removed from wishlist' : 'Added to wishlist', 'success');

        } catch (error) {
            // Revert the UI update to the previous state if the API call fails
            setIsWishlist(previousState);
            console.error("Failed to update wishlist:", error);
            showToast('Failed to update wishlist', 'error'); // Optional: notify user of failure
        }
    }
    //#endregion

    //#region EFFECTS


    useFocusEffect(
    useCallback(() => {
        if (isLoading) return; 

        const controller = new AbortController();

        getProductDetails();
        getQuantityInformation();
        
        // Assuming `productId` is available in your component's scope from route params
        if (id) {
            fetchUserWishlist(controller, id as string);
        }

        return () => controller.abort();
    }, [isLoading, isAuthenticated, token, id]) // Ensure dependencies are accurate
);

    useEffect(() => {
        if (!isPageLoading) revealWipe();

    }, [isPageLoading]);
    //#endregion


    return (
        <View style={styles.mainContainer}>
        {isPageLoading ? (
            <ActivityIndicator size="large" color="#21758f" />
        ) : (
            <>
                <Navbar />
                <FlatList
                    contentContainerStyle={styles.contentContainer} 
                    data={reviews || []}
                    keyExtractor={(item, index) => item.userId ? item.userId.toString() : index.toString()}
                    
                    ListHeaderComponent={
                        <FlatListTopAggregation
                            productDetailsProps={{
                                product: product!,
                                currentQuantity: productQuantity,
                                isLoading: isLoadingUpdateQuantity,
                                isWishlisted: isWishlist,
                                onUpdateQuantity: onUpdateQuantity,
                                onWishListToggle: () => handleToggleWishlist(id as string)
                            }}
                            writeReviewProps={{
                                isEligible: reviewEligibility ? reviewEligibility.canReview : false,
                                userReview: userReview,
                                onUserReviewChange: onSubmitReview
                            }}
                        />
                    }

                    renderItem={({ item }) => (
                        <FlatListCard review={item} />
                    )}

                    showsVerticalScrollIndicator={true} 
                />
            </>
        )}
    </View>
    )
}


//#region STYLES


const updateQuantityButtonStyles = StyleSheet.create({
    mainContainer: {
        height: 60, 
        flex: 1,
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
        backgroundColor: Colors.light.productDetailsBackground,
        marginBottom: 20
    },
    imageContainer: {
        flex: 1,
        backgroundColor: Colors.light.imageFillerColor,
        borderRadius: 8,
        overflow: 'hidden',
    },
    productImage: {
        width: '100%',
        height: '100%',
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
        flexDirection: 'row',
        alignItems: 'center'
    }
});

const writeReviewStyles = StyleSheet.create({
    mainContainer: {
        padding: 10,
        backgroundColor: Colors.light.writeReviewBackground
    },
    didSomethingWentWrongContainer: {
        height: 20,
        marginLeft: 10,
    },
    didSomethingWentWrongText: {
        fontFamily: Fonts.semibold,
        fontSize: 16,
        color: Colors.light.errorText,
    },
    editCommentButtonContainer: {
        justifyContent: 'center',
        alignItems: 'flex-start',
        height: 40,
        marginBottom: 10,
    },
    editCommentButtonWrapper: {
        height: 30,
        width: 100,
        borderRadius: 8,
        marginLeft: 10,
        backgroundColor: Colors.light.editButtonBackground
    },
    editCommentButtonText: {
        fontFamily: Fonts.semibold,
        fontSize: 16,
        color: Colors.light.editButtonTextColor,
    },
    nameContainer: {
        marginLeft: 10,
        alignItems: 'flex-end'
    },
    nameText: {
        fontFamily: Fonts.semibold,
        fontSize: 16,
        color: Colors.light.editButtonTextColor,
    },
    dateText: {
        fontFamily: Fonts.regular,
        fontSize: 16,
        color: Colors.light.editButtonTextColor,
    },
    ratingContainer: {
        flexDirection: 'row',
        marginLeft: 10,
    },
    ratingLabel: {

    },
    commentContainer: {
        padding: 10,
    },
    commentTextInput: {
        padding: 10,
        minHeight: 100,
        maxHeight: 400,
        fontFamily: Fonts.regular,
        fontSize: 16,
        color: Colors.light.editButtonTextColor,
    },
    submitButtonContainer: {
        height: 40,
        backgroundColor: Colors.light.submitButtonContainerBackground,
        alignItems: 'flex-end',
        justifyContent: 'center',
        marginLeft: 10,
    },
    submitButtonWrapper: {
        marginRight: 10,
        height: 30,
        width: 100,
        borderRadius: 8,
        backgroundColor: Colors.light.greenButtonBackground
    },
    submitButtonText: {
        fontFamily: Fonts.regular,
        fontSize: 16,
        color: Colors.light.greenButtonTextColor,
    }
});

const reviewsSummaryStyles = StyleSheet.create({

});

const flatListTopAggregationStyles = StyleSheet.create({
    reviewsTitleContainer: {
        padding: 10,
        borderRadius: 8,
        backgroundColor: Colors.light.productDetailsBackground,
        marginVertical: 10,
    },
    reviewsTitleText: {
        fontFamily: Fonts.bold,
        fontSize: 22,
        color: Colors.light.mainTextColor,
    }
});

const flatListCardStyles = StyleSheet.create({
    mainContainer: {
        borderRadius: 8,
        backgroundColor: Colors.light.productDetailsBackground,
        padding: 10,
        overflow: 'hidden'
    },
    contentContainer: {

    },
    topBarContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10
    },
    userNameText: {
        fontFamily: Fonts.semibold,
        fontSize: 16,
        color: Colors.light.mainTextColor,
    },
    commentContainer: {
        marginBottom: 10,
    },
    commentText: {
        fontFamily: Fonts.regular,
        fontSize: 16,
        color: Colors.light.commentTextColor,
    },
    footerContainer: {
        alignItems: 'flex-end'
    },
    dateContainer: {
        alignItems: 'flex-end'
    },
    dateText: {
        fontFamily: Fonts.regular,
        fontSize: 12,
        color: Colors.light.commentTextColor,
    }
});

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: Colors.light.mainBackground,
    },
    contentContainer: {
        alignSelf: 'center',
        width: '100%',
        maxWidth: 1400,
        borderRadius: 10,
        overflow: 'hidden'
    },
    productDetailsContainer: {

    },
    writeCommentContainer: {

    },
    commentSummaryContainer: {

    }
});

//#endregion