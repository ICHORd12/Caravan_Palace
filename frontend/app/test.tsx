import { Caravan } from '@/models/BACKEND_MODELS';
import { CartItemFE } from '@/models/FRONTEND_MODELS';
import { StyleSheet, View, Text } from 'react-native';
import ProductCard from '../components/ProductCard/ProductCard';
import ShopCard from '@/components/ShopCard/ShopCard'
import Navbar from '@/components/Navbar/Navbar'
import PaymentView from '@/components/PaymentView/PaymentView';
import WrappedGeneralButton from '@/components/Buttons/GeneralButtonWithWrapper/GeneralButtonWithWrapper';

const cartItemFE: CartItemFE = {
    cartItemId: "1",
    productId: "4",
    quantity: 2,
    product: {
        currentPrice: "100",
        name: "utku",
        quantityInStocks: 100
    }
}



export default function Test() {
    function sayHello()
    {

    }

    return (
         <View style={styles.mainContainer}>
            <Navbar />

            <View style={styles.contentContainer}>
                <View style={styles.innerContentContainer}>
                    <Text style={styles.pageTitle}>Your Cart</Text>
                    <PaymentView></PaymentView>
                    <WrappedGeneralButton textStyles={styles.payButtonTextStyle} wrapperStyles={styles.payButtonWrapperStyle} title='Pay' onPress={sayHello}></WrappedGeneralButton>
                </View>
            </View>

        </View>

    )
}


const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#d6cba6'
    },
    contentContainer: {
        flex: 1,
        padding: 20,
        maxWidth: 800,
        width: '100%',
        alignSelf: 'center',
        backgroundColor: '#ff0000'
    },
    innerContentContainer: {
        flex: 1
    },
    pageTitle: {
        marginBottom: 20,
        fontFamily: 'Montserrat_700Bold',
        fontSize: 28,
        color: '#283618',
    },
    payButtonWrapperStyle: {
        padding: 10,
        borderRadius: 10,
        backgroundColor: '#00ffe1'
    },
    payButtonTextStyle: {
        fontFamily: 'Montserrat_600SemiBold',
    }
});