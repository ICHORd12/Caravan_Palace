//#region IMPORTS
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, FlatList, LayoutChangeEvent, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import {
    Montserrat_400Regular,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    useFonts
} from '@expo-google-fonts/montserrat';

import Navbar from '@/components/Navbar/Navbar';
import ShopCard from '@/components/ShopCard/ShopCard';

import {
    API_BASE_URL,
    FETCH_PRODUCTS_DETAILS_END_POINT,
    GET_BACKEND_CART,
    UPDATE_QUANTITY_END_POINT,
    VALIDATE_CART_END_POINT,
    CART_PAYMENT_END_POINT
} from '@/constants/API';

import { Caravan, CartItem, GetBackendCartResponse } from '@/models/BACKEND_MODELS';
import { CartItemFE } from '@/models/FRONTEND_MODELS';
import { useToast } from '@/context/ToastContext';
import { useTransition } from '@/context/TransitionContext';
import { FetchProductDetailsResponse} from '@/models/BACKEND_MODELS';
import { useAuth } from '@/context/AuthContext'


import getLocalCartMap from '@/functions/getLocalCartMap';
import mapCaravansToCartItemFEs from '@/functions/mapCaravansToCartItemFEs';
import mapCartItemsToCartItemFEs from '@/functions/mapCartItemsToCartItemFEs';
import getLocalCartProductIds from '@/functions/getLocalCartProductIds';
import WrappedGeneralButton from '@/components/Buttons/GeneralButtonWithWrapper/GeneralButtonWithWrapper';
import PaymentView from '@/components/PaymentView/PaymentView';
import GeneralButton from '@/components/Buttons/GeneralButton/GeneralButton';
//#endregion


//#region INPUT DEFINITIONS FOR TYPE HELP


export interface UpdateQuantityInput {
    productId: string;
    delta: number;
}

interface PayInput {
    deliveryAddress: string;
    card: {
        cardNumber: string;
        cardHolderName: string;
        expiryYear: number;
        expiryMonth: number;
        cvv: string;
    }
}

//#endregion


export default function ShoppingCart() {
    const PAYMENT: boolean = true;
    const CART: boolean = false;

    const router = useRouter();
    const { showToast } = useToast();
    const { navigateWithWipe, revealWipe } = useTransition();
    const {token, isAuthenticated} = useAuth();
    

    const wipeProgress = useRef(new Animated.Value(0)).current;

    // State
    const [currentView, setCurrentView] = useState(CART);
    const [containerWidth, setContainerWidth] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    const [cartItemFEs, setCartItemFEs] = useState<CartItemFE[]>([]);
    const [updatingItems, setUpdatingItems] = useState<Record<string, boolean>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isPressedCartButton, setIsPressedCartButton] = useState(false);
    const [isPressesPayButton, setIsPressesPayButton] = useState(false);


    const [inputErrors, setErrors] = useState<Record<string, string>>({});

    const [cardHolderName, setCardHolderName] = useState("");
    const [cardNumber, setCardNumber] = useState("");
    const [cardExpiryYear, setCardExpiryYear] = useState(0);
    const [cardExpiryMonth, setCardExpiryMonth] = useState(0);
    const [cardCvv, setCardCvv] = useState("");

    const [addressCountry, setAddressCountry] = useState("");
    const [addressCity, setAddressCity] = useState("");
    const [addressStreet, setAddressStreet] = useState("");
    const [addressZip, setAddressZip] = useState("");
    const [addressCheckbox, setAddressCheckbox] = useState(false);

    let [fontsLoaded] = useFonts({
        Montserrat_700Bold,
        Montserrat_400Regular,
        Montserrat_600SemiBold,
    });

    //#region WIPE ANIMATION FUNCTIONS

    
    function onContainerLayout(event: LayoutChangeEvent) 
    {
        const { width } = event.nativeEvent.layout;
        setContainerWidth(width);

    }

    function runRevealAnimation(showPayment: boolean, onComplete?: () => void) 
    {
        if (containerWidth === 0 || isAnimating) return;

        setIsAnimating(true);
        
        Animated.timing(wipeProgress, {
            toValue: showPayment ? 1 : 0,
            duration: 500,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: false,
        }).start(() => {
            setIsAnimating(false);
            if (onComplete) onComplete();
        });

        setCurrentView(showPayment);
    }
    //#endregion

    
    //#region PAYMENT FUNCTIONS


    function onCardHolderNameChange (cardHolder: string):   void {setCardHolderName(cardHolder)};
    function onCardNumberChange     (cardNumber: string):   void {setCardNumber(cardNumber)};
    function onCardExpiryYearChange (expiryYear: number):   void {setCardExpiryYear(expiryYear)};
    function onCardExpiryMonthChange(expiryMonth: number):  void {setCardExpiryMonth(expiryMonth)};
    function onCardCvvChange        (CVV: string):          void {setCardCvv(CVV)};
    function onAdressCountryChange  (country: string):      void {setAddressCountry(country)};
    function onAdressCityChange     (city: string):         void {setAddressCity(city)};
    function onAdressStreetChange   (street: string):       void {setAddressStreet(street)};
    function onAdressZipChange      (zip: string):          void {setAddressZip(zip)};
    function onAdressCheckboxChange (checkbox: boolean):    void {setAddressCheckbox(checkbox)};

    async function validateCart(): Promise<boolean>
    {
        let result: boolean = true;
        try {
            const response = await fetch(`${API_BASE_URL}${VALIDATE_CART_END_POINT}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            const responseData = await response.json();
            if (!response.ok)
            {   
                result = false;
                showToast(responseData.message, 'error');
            }

        } catch(error) {
            result = false;
            showToast('Error Occured', 'error');
            console.error("LOG::ERROR::", error);
        } finally {
            return result;
        }
    }

    function validatePaymentInputs(): boolean
    {
        let isValid = true;
        let newErrors: Record<string, string> = {};

        // Validate Name
        if (cardHolderName.trim().length === 0) {
            newErrors.cardHolderName = "Name is required";
            isValid = false;
        }

        // Validate Card Number 
        if (cardNumber.length < 19) {
            newErrors.cardNumber = "Card number must be 16 digits";
            isValid = false;
        }

        // Validate Year  
        if (cardExpiryYear  < 2026) {
            newErrors.cardExpiryYear = "Year must be valid";
            isValid = false;
        }

        if (cardExpiryMonth  > 12 || cardExpiryMonth < 1) {
            newErrors.cardExpiryMonth = "Month must be valid";
            isValid = false;
        }

        // Validate CVV
        if (cardCvv.length < 3) {
            newErrors.cardCvv = "CVV must be 3 digits";
            isValid = false;
        }

        // Validate Address 
        if (addressCountry.trim().length === 0) {
            newErrors.addressCountry = "Country is required";
            isValid = false;
        }
        if (addressCity.trim().length === 0) {
            newErrors.addressCity = "City is required";
            isValid = false;
        }
        if (addressStreet.trim().length === 0) {
            newErrors.addressStreet = "Street is required";
            isValid = false;
        }
        if (addressZip.trim().length === 0) {
            newErrors.addressZip = "Zip is required";
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    function convertCardNumber(): string 
    {
        return cardNumber.replace(/-/g, "");
    }

    function linearizeAddressInputs(): string
    {
        const addressParts = [
            addressStreet.trim(),
            addressCity.trim(),
            addressZip.trim(),
            addressCountry.trim()
        ];

        return addressParts
            .filter((part) => part.length > 0)
            .join(", ");
    }

    function createPayBody(): PayInput
    {
        const address: string = linearizeAddressInputs();
        return {
            deliveryAddress: address,
            card: {
                cardHolderName: cardHolderName,
                cardNumber: convertCardNumber(),
                expiryYear: cardExpiryYear,
                expiryMonth: cardExpiryMonth,
                cvv: cardCvv
            }
        }
    }
    
    async function pay(): Promise<{result: boolean, message: string}> 
    {
        try {
            const payloadBody: PayInput = createPayBody();

            const response = await fetch(`${API_BASE_URL}${CART_PAYMENT_END_POINT}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payloadBody)
            });

            const responseData = await response.json();

            if (!response.ok)
            {
                return { result: false, message: responseData.message || 'Payment failed' };
            }
            else
            {
                return { result: true, message: responseData.message || 'Payment successful' };
            }

        } catch (error) {
            showToast('Error Occurred', 'error');
            console.error("LOG::ERROR::", error);
            
            return { 
                result: false, 
                message: error instanceof Error ? error.message : 'An unexpected error occurred' 
            };
        }
        
    }
    //#endregion


    //#region FETCH CART


    async function fetchCartNotAuth(): Promise<CartItemFE[]>
    {
        let cartItemFEs: CartItemFE[] = [];
        const productIds: string[] = getLocalCartProductIds();
        try {
            const response = await fetch(`${API_BASE_URL}${FETCH_PRODUCTS_DETAILS_END_POINT}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ productIds: productIds })
            });

            const responseData: FetchProductDetailsResponse = await response.json();
            if (response.ok)
            {
                const caravans: Caravan[] = responseData.products;
                const localCart: Record<string, number> = getLocalCartMap();
                cartItemFEs = mapCaravansToCartItemFEs(caravans, localCart);
            }
            else
            {
                showToast(`${responseData.message}`, 'error');
            }
        } catch(error) {
            showToast(`${error}`, 'error');
        } finally {
            return cartItemFEs;
        }
    }

    async function fetchCartAuth(): Promise<CartItemFE[]>
    {
        let cartItemFEs: CartItemFE[] = [];
        try {
            const response = await fetch(`${API_BASE_URL}${GET_BACKEND_CART}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const responseData = await response.json();
            if (response.ok)
            {
                cartItemFEs = mapCartItemsToCartItemFEs(responseData.items);
            }
            else
            {
                showToast(`${responseData.message}`, 'error');
            }
        } catch(error) {
            showToast(`${error}`, 'error');
        } finally {
            return cartItemFEs;
        }
    }

    async function fetchCart()
    {
        setIsLoading(true);

        if (!isAuthenticated)
        {
            const cartItemFEsPromise: Promise<CartItemFE[]> = fetchCartNotAuth();
            const cartItemFEs: CartItemFE[] = await cartItemFEsPromise;
            setCartItemFEs(cartItemFEs);
        }
        else
        {
            const cartItemFEsPromise: Promise<CartItemFE[]> = fetchCartAuth();
            const cartItemFEs: CartItemFE[] = await cartItemFEsPromise;
            setCartItemFEs(cartItemFEs);
        }

        setIsLoading(false);
    }

    //#endregion


    //#region UPDATE QUANTITY


    async function updateQuantityNotAuth({productId, delta}: UpdateQuantityInput)
    {
        setUpdatingItems(prev => ({ ...prev, [productId]: true })); 

        const targetItem = cartItemFEs.find(item => item.productId === productId);
        const quantityInStocks: number = targetItem ? targetItem.product.quantityInStocks : 0;
        const currentQuantity: number = targetItem ? targetItem.quantity : 0;
        const targetQuantity: number = currentQuantity + delta;

        if (targetQuantity > quantityInStocks) 
        {
            showToast('There is not enough stock!', 'error');
            
        }
        else
        {
            if (Platform.OS === 'web') 
            {
                if (targetQuantity === 0) window.localStorage.removeItem(`cart_${productId}`);
                else window.localStorage.setItem(`cart_${productId}`, targetQuantity.toString());
            }

            if (targetQuantity === 0) 
            {
                setCartItemFEs(prev => prev.filter(item => item.productId !== productId));
            } 
            else 
            {
                setCartItemFEs(prev => 
                    prev.map(item => 
                        item.productId === productId ? { ...item, quantity: targetQuantity } : item
                    )
                );
            }
        }
        
        setUpdatingItems(prev => ({ ...prev, [productId]: false })); 
        return;
    }

    async function updateQuantityAuth({productId, delta}: UpdateQuantityInput)
    {
        setUpdatingItems(prev => ({ ...prev, [productId]: true })); 

        const oldQuantity: number | undefined = cartItemFEs.find(item => item.productId === productId)?.quantity;
        if (oldQuantity === undefined)
        {
            showToast('Cart Item Does Not Exist', 'error');
            return;
        }

        let targetQuantity: number = oldQuantity;
        if (delta === -2)       targetQuantity = 0;
        else if (delta === -1)  targetQuantity = targetQuantity - 1;
        else if (delta === 1)   targetQuantity = targetQuantity + 1;
    
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
                    setCartItemFEs(prev => prev.filter(item => item.productId !== productId));
                } 
                else 
                {
                    setCartItemFEs(prev => 
                        prev.map(item => 
                            item.productId === productId ? { ...item, quantity: targetQuantity } : item
                        )
                    );
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


    //#region BUTTON FUNCTIONS


    function goBackCartFunction()
    {
        runRevealAnimation(CART, () => {
            setErrors({});
        });
    }

    async function proceedPaymentButtonFunction()
    {
        setIsPressedCartButton(true);

        if (!isAuthenticated)
        {
            setIsPressedCartButton(false);
            navigateWithWipe("/login");
        }
        else
        {
            const isCartValid: boolean = await validateCart();

            if (isCartValid)
            {
                runRevealAnimation(PAYMENT);
            }
        }

        setIsPressedCartButton(false);
    }

    async function doPaymentButtonFunction()
    {
        setIsPressesPayButton(true);

        const isPaymentInputsValid = validatePaymentInputs();
        if (!isPaymentInputsValid)
        {
            showToast("Some Inputs Are Not Valid!", 'error');
        }
        else
        {
            const result = await pay();

            if (!result.result)
            {
                showToast(result.message, 'error');
            }
            else
            {
                fetchCart();
                runRevealAnimation(CART);
                showToast(result.message, 'success');
            }
        }

        setIsPressesPayButton(false);
    }
    //#endregion


    //#region HELPER FUNCTIONS
    

    function calculateTotal () 
    {
        return cartItemFEs.reduce((total, item) => total + (parseFloat(item.product.currentPrice as any) * item.quantity), 0);
    };

    //#endregion
    

    //#region LIFE CYCLE
    useFocusEffect(
        useCallback(() => {
            fetchCart();
        }, [isAuthenticated])
    );

    useEffect(() => {
        if (fontsLoaded && !isLoading) 
        {
            revealWipe();
        }
        
    }, [fontsLoaded, isLoading, revealWipe]);

    //#endregion


    if (!fontsLoaded || isLoading) return null;

    const cartVisibleWidth = wipeProgress.interpolate({
        inputRange: [0, 1],
        outputRange: ['100%', '0%'], 
    });

    // Dynamic Styles
    const cartViewMaskContainerWidth = {
        width: cartVisibleWidth,
    } as const;

    const cartViewContainerWidth = {
        width: containerWidth
    } as const;

    const cartTotal = calculateTotal();


    return (
        <View style={styles.mainContainer}>

            <Navbar />

            <View style={styles.contentContainer} onLayout={onContainerLayout}>


                {(currentView === PAYMENT || isAnimating) &&
                    (
                        <View style={styles.commonContainer}>

                            <Text style={styles.pageTitle}>Payment Information</Text>

                            <View style={styles.goBackButtonContainer}>
                                <GeneralButton
                                    textStyle={styles.genericTextSemiBold}
                                    title='Go Back To Cart' 
                                    onPress={() => {goBackCartFunction()}}
                                />
                            </View>

                            
                            <PaymentView
                                cardHolderName={cardHolderName}
                                cardNumber={cardNumber}
                                cardExpiryYear={cardExpiryYear.toString()}
                                cardExpiryMonth={cardExpiryMonth.toString()}
                                cardCvv={cardCvv}
                                addressCountry={addressCountry}
                                addressCity={addressCity}
                                addressStreet={addressStreet}
                                addressZip={addressZip}
                                addressCheckbox={addressCheckbox}
                                onCardHolderNameChange={onCardHolderNameChange}
                                onCardNumberChange={onCardNumberChange}
                                onCardExpiryYearChange={onCardExpiryYearChange}
                                onCardExpiryMonthChange={onCardExpiryMonthChange}
                                onCardCvvChange={onCardCvvChange}
                                onAdressCountryChange={onAdressCountryChange}
                                onAdressCityChange={onAdressCityChange}
                                onAdressStreetChange={onAdressStreetChange}
                                onAdressZipChange={onAdressZipChange}
                                onAdressCheckboxChange={onAdressCheckboxChange}
                                errors={inputErrors}
                            />

                            <View style={styles.fillObject}></View>
                            
                            <View style={styles.payButtonOuterContainer}> 
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Subtotal</Text>
                                    <Text style={styles.summaryValue}>${cartTotal.toFixed(2)}</Text>
                                </View>

                                <View style={[styles.summaryRow, styles.totalRow]}>
                                    <Text style={styles.totalLabel}>Total</Text>
                                    <Text style={styles.totalValue}>${(cartTotal).toFixed(2)}</Text>
                                </View>

                                <View style={styles.payButtonContainer}>
                                    <WrappedGeneralButton
                                    title={"Pay"}
                                    textStyles={styles.payButtonTextStyle}
                                    wrapperStyles={styles.payButtonWrapperStyle}
                                    disabled={isPressesPayButton}
                                    onPress={() => {
                                        doPaymentButtonFunction()
                                    }}
                                    >
                                    </WrappedGeneralButton>
                                </View>
                            </View>
                            

                        </View>
                    )
                }
                
                {(currentView === CART || isAnimating) && 
                    (   
                        <Animated.View style={[styles.cartViewMaskContainer, cartViewMaskContainerWidth]}>
                        
                            <View style={[styles.commonContainer, {backgroundColor: '#d6cba6'}, cartViewContainerWidth]}>

                                <Text style={styles.pageTitle}>Your Cart</Text>

                                {cartItemFEs.length === 0 ? (
                                    <Text style={styles.emptyCartText}>Your cart is currently empty.</Text>
                                ) : (
                                    <>
                                        <FlatList
                                            data={cartItemFEs}
                                            keyExtractor={(item) => item.productId}
                                            renderItem={({ item }) => (
                                                <ShopCard 
                                                    cartItem={item}
                                                    disabled={!!updatingItems[item.productId]}
                                                    updateQuantity={updateQuantity} 
                                                />
                                            )}
                                            contentContainerStyle={styles.listContainer}
                                            showsVerticalScrollIndicator={true}
                                        />

                                    
                                    </>
                                )}

                                <View style={styles.summaryContainer}>

                                    <View style={styles.summaryRow}>
                                        <Text style={styles.summaryLabel}>Subtotal</Text>
                                        <Text style={styles.summaryValue}>${cartTotal.toFixed(2)}</Text>
                                    </View>

                                    <View style={[styles.summaryRow, styles.totalRow]}>
                                        <Text style={styles.totalLabel}>Total</Text>
                                        <Text style={styles.totalValue}>${(cartTotal).toFixed(2)}</Text>
                                    </View>

                                    <View style={styles.checkoutButtonContainer}>
                                        <WrappedGeneralButton
                                        title={(isAuthenticated) ? "Proceed" : "Login To Continue"}
                                        textStyles={styles.checkoutButtonTextStyle}
                                        wrapperStyles={styles.checkoutButtonWrapperStyle}
                                        disabled={isPressedCartButton}
                                        onPress={() => {
                                            proceedPaymentButtonFunction()
                                        }}
                                        >
                                        </WrappedGeneralButton>
                                    </View>

                                </View>

                            </View>
                        
                        </Animated.View>
                        
                    )
                }

            </View>

        </View>
    );
}

//#region STYLES
const styles = StyleSheet.create({

    /* LAYOUTS */
    mainContainer: {
        flex: 1,
        backgroundColor: '#d6cba6'
    },
    contentContainer: {
        flex: 1,
        maxWidth: 800,
        width: '100%',
        alignSelf: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    commonContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    goBackButtonContainer: {
        width: '100%',
        alignItems: 'flex-start',
        marginLeft: 5,
        marginBottom: 5
    },
    cartViewMaskContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        zIndex: 2,
    },
    fillObject: {
        flex: 1,
    },

    /* TYPOGRAPHY */
    genericTextRegular: {
        fontFamily: 'Montserrat_400Regular',
        fontSize: 16,
        margin: 5
    },
    genericTextSemiBold: {
        fontFamily: 'Montserrat_600SemiBold',
        fontSize: 16,
        margin: 5
    },
    goBackButtonTextStyle: {
        fontFamily: 'Montserrat_400Regular',
    },
    pageTitle: {
        marginBottom: 20,
        fontFamily: 'Montserrat_700Bold',
        fontSize: 28,
        color: '#283618',
    },
    emptyCartText: {
        textAlign: 'center',
        marginTop: 40,
        fontFamily: 'Montserrat_600SemiBold',
        fontSize: 16,
        color: '#606c38',
    },

    listContainer: {
        
    },

    /* PAY BUTTON */
    payButtonOuterContainer: {
        backgroundColor: '#fefae0',
        borderRadius: 12,
        padding: 20,
        marginTop: 10,
        marginBottom: 10
    },
    payButtonContainer: {
        width: '95%',
        alignSelf: 'center',
        marginTop: 10
    },
    payButtonWrapperStyle: {
        alignItems: 'center',
        backgroundColor: '#5d0829',
        borderRadius: 8,
        padding: 15,
        marginTop: 20,
    },
    payButtonTextStyle: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 18,
        color: '#fefae0',
    },

    /* SUMMARY SECTION */
    summaryContainer: {
        backgroundColor: '#fefae0',
        borderRadius: 12,
        padding: 20,
        marginTop: 10,
        marginBottom: 10
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    summaryLabel: {
        fontFamily: 'Montserrat_400Regular',
        fontSize: 16,
        color: '#606c38',
    },
    summaryValue: {
        fontFamily: 'Montserrat_600SemiBold',
        fontSize: 16,
        color: '#283618',
    },
    totalRow: {
        borderTopColor: '#d6cba6',
        borderTopWidth: 1,
        paddingTop: 15,
        marginTop: 5,
    },
    totalLabel: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 20,
        color: '#283618',
    },
    totalValue: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 20,
        color: '#bc4749',
    },


    checkoutButtonContainer: {
        width: '95%',
        alignSelf: 'center',
        marginTop: 10
    },
    checkoutButtonWrapperStyle: {
        alignItems: 'center',
        backgroundColor: '#283618',
        borderRadius: 8,
        padding: 15,
        marginTop: 20,
    },
    checkoutButtonTextStyle: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 18,
        color: '#fefae0',
    },

    
});
//#endregion