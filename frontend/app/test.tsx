import { useRef, useState } from "react"
import { Animated, View, StyleSheet, Text, LayoutChangeEvent, Easing, TouchableOpacity } from "react-native"



export default function Test()
{
    const PAYMENT: boolean = true;
    const CART: boolean = false;

    const wipeProgress = useRef(new Animated.Value(0)).current;
    
    const [currentView, setCurrentView] = useState(CART);
    const [isAnimating, setIsAnimating] = useState(false);
    const [frameWidth, setFrameWidth] = useState(0);

    function onFrameLayout(event: LayoutChangeEvent) 
    {
        const { width } = event.nativeEvent.layout;
        setFrameWidth(width);

        console.log("Frame Width is set to: ", width);
    }

    function runRevealAnimation(showPayment: boolean) 
    {
        console.log("Current Page: ", showPayment);
        console.log("FrameWidth: ", frameWidth);
        console.log("Is animating: ", isAnimating);

        if (frameWidth === 0 || isAnimating) return;


        setIsAnimating(true);
        
        Animated.timing(wipeProgress, {
            toValue: showPayment ? 1 : 0,
            duration: 500,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: false,
        }).start(() => {
            setIsAnimating(false);
        });

        setCurrentView(showPayment);
    }

    const cartVisibleWidth = wipeProgress.interpolate({
        inputRange: [0, 1],
        outputRange: ['100%', '0%'], 
    });

    const cartViewMaskContainerWidthHeight = {
        width: cartVisibleWidth,
    } as const;

    const cartViewContainerWidth = {
        width: frameWidth
    } as const;

    return(
        <View style={styles.mainContainer}>

            <View style={styles.contentContainer} onLayout={onFrameLayout}>

                {(currentView === PAYMENT || isAnimating) &&
                    (
                        <View style={[styles.commonContainer, styles.paymentViewContainer]}>
                            <Text>PAYMENT</Text>
                        </View>
                    )
                }

                {(currentView === CART || isAnimating) && 
                    (
                        <Animated.View style={[styles.cartViewMaskContainer, cartViewMaskContainerWidthHeight]}>

                            <View style={[styles.commonContainer, styles.cartViewContainer, cartViewContainerWidth]}>
                                <Text>CART</Text>
                            </View>
                        
                        </Animated.View>
                    )
                }

            </View>


            <View style={styles.buttonRow}>
                <TouchableOpacity
                    style={[styles.button, styles.primaryButton]}
                    onPress={() => runRevealAnimation(PAYMENT)}
                    disabled={isAnimating}
                >
                    <Text style={styles.buttonText}>Show Payment</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.secondaryButton]}
                    onPress={() => runRevealAnimation(CART)}
                    disabled={isAnimating}
                >
                    <Text style={styles.buttonText}>Show Cart</Text>
                </TouchableOpacity>
            </View>

            
        </View>
    )
}


const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#d6cba6',
        padding: 20,
    },
    contentContainer: {
        flex: 1,
        width: '100%',
        maxWidth: 800,
        borderRadius: 20,
        backgroundColor: '#67af99',
        position: 'relative',
        overflow: 'hidden',
    },
    commonContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    paymentViewContainer: {
        backgroundColor: '#c1121f'
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
    cartViewContainer: {
        backgroundColor: '#2563eb',
    },


    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
        flexWrap: 'wrap',
        justifyContent: 'center',
        backgroundColor: '#ff0000',
        padding: 10,
        borderRadius: 10,
    },
    button: {
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 10,
        minWidth: 140,
        alignItems: 'center',
    },
    primaryButton: {
        backgroundColor: '#283618',
    },
    secondaryButton: {
        backgroundColor: '#606c38',
    },
    buttonText: {
        color: '#fefae0',
        fontSize: 16,
        fontWeight: '700',
    },

});

/*
 
*/
