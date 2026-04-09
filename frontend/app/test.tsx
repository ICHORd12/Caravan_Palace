import { Caravan } from '@/constants/BACKEND_MODELS';
import { StyleSheet, View } from 'react-native';
import ProductCard from '../components/ProductCard/ProductCard';


const caravan: Caravan = {
    id: "1",
    model: "Kral",
    price: "100K",
    fuelType: "Electric",
    weight: "10 Tones",
    hasKitchen: true,
    score: 4.8,
    images: ['https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=500&q=60', 'https://images.unsplash.com/photo-1513311068348-19c8fbdc0bb6?auto=format&fit=crop&w=500&q=60']
};


export default function Test() {
    return (
        <View style={styles.container}>
            <View style={styles.innerContainer}>
                <ProductCard caravan={caravan} />
            </View>
        </View>
    )
}



const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#2a9c91',
        alignItems: 'center',
        justifyContent: 'center',
    },
    innerContainer: {
        backgroundColor: '#fefae0',
        alignItems: 'center',
        justifyContent: 'center',
    }
});