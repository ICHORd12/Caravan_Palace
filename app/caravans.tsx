import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import C_CaravanCard from '../components/utku/C_CaravanCard/C_CaravanCard'; // Adjust path if necessary
import C_Navbar from '../components/utku/C_Navbar/C_Navbar';

// Dummy data array to render 10 cards
const dummyCards = Array.from({ length: 10 }).map((_, index) => ({
    id: index.toString(),
    // Adjust relative paths according to your project structure
    starIcon: require('../assets/images/star.png'),
    capacityIcon: require('../assets/images/user.png'),
    seasonIcon: require('../assets/images/snow.png'),
    caravanImages: [
        require('../assets/images/accessory1.jpg'),
        require('../assets/images/camp1.jpg')
    ],
    name: "Test 1",
    type: "Motocaravan",
    score: "4.00",
    price: "40 000 EURO"
}));

export default function Caravans() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            {/* HEADER */}
            <View style={styles.headerBarContainer}> 
                <C_Navbar router={router} />
            </View>

            <View style={styles.screenTitleContainer}>
                <Text style={styles.screenTitle}>Caravans Screen</Text>
            </View>

            {/* CONTENT CONTAINER */}
            <View style={styles.contentContainer}>
                
                {/* FILTER AREA (Left Side) */}
                <View style={styles.filterContainer}>
                    <Text style={styles.filterPlaceholderText}>
                        Filter Component Goes Here
                    </Text>
                </View>

                {/* CARAVAN CARDS GRID (Right Side) */}
                <ScrollView 
                    style={styles.scrollArea}
                    contentContainerStyle={styles.cardsGrid}
                    showsVerticalScrollIndicator={false}
                >
                    {dummyCards.map((item) => (
                        <C_CaravanCard 
                            key={item.id}
                            starIcon={item.starIcon}
                            capacityIcon={item.capacityIcon}
                            seasonIcon={item.seasonIcon}
                            caravanImages={item.caravanImages}
                            name={item.name}
                            type={item.type}
                            score={item.score}
                            price={item.price}
                        />
                    ))}
                </ScrollView>
                
            </View>
        </View> 
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#d6cba6',
    },
    headerBarContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    screenTitleContainer: {
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    screenTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    contentContainer: {
        flex: 1,
        flexDirection: 'row', // Places Filter and Grid side-by-side
        paddingHorizontal: 20,
        paddingBottom: 20,
        gap: 20, // Space between filter and grid
    },
    filterContainer: {
        width: 280, // Fixed width for the filter sidebar
        backgroundColor: '#E2E2E2', // Temporary color to see the rectangle
        borderRadius: 8,
        padding: 20,
        borderWidth: 1,
        borderColor: '#ccc',
        borderStyle: 'dashed', // Dashed border to indicate it's a placeholder
    },
    filterPlaceholderText: {
        color: '#666',
        textAlign: 'center',
        marginTop: 20,
        fontWeight: '600',
    },
    scrollArea: {
        flex: 1,
    },
    cardsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap', // Allows cards to wrap to the next line
        gap: 20, // Space between cards
        justifyContent: 'flex-start',
        paddingBottom: 40,
    }
});