import { Platform, StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    outerContainer: {
        width: 560,
        height: 800,
        paddingTop: 10,
    },
    cardContainer: {
        flex: 1,
        backgroundColor: '#fefae0',     
        borderRadius: 12,
        overflow: 'hidden',
        // Transition setup for web smooth animations
        ...(Platform.OS === 'web' && { transition: 'transform 0.1s ease' }),
    },
    cardContainerHovered: {
        transform: [{ translateY: -10 }],
    },

    // First Half
    imageContainer: {
        flex: 1,
        position: 'relative',
        backgroundColor: '#a3895f'
    },
    image: {
        width: '100%',
        height: '100%',
    },
    arrowButton: {
        position: 'absolute',
        top: '50%',
        backgroundColor: 'rgba(254, 250, 224, 0.8)',
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',       
    },
    arrowLeft: { 
        left: 10 
    },
    arrowRight: { 
        right: 10 
    },
    imageIndicator: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: 'rgba(40, 54, 24, 0.7)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    indicatorText: {
        color: '#fefae0',
        fontSize: 12,
        fontFamily: 'Montserrat_600SemiBold',
    },

    // Second Half
    detailsContainer: {
        padding: 15,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardTitle: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 18,
        color: '#283618',
    },
    scoreBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#bc6c25',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    scoreText: {
        color: '#fefae0',
        fontFamily: 'Montserrat_700Bold',
        fontSize: 12,
        marginLeft: 4,
    },
    priceText: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 20,
        color: '#bc6c25',
        marginBottom: 12,
    },
    specsGrid: {
        marginBottom: 15,
    },
    specText: {
        fontFamily: 'Montserrat_400Regular',
        color: '#283618',
        fontSize: 13,
        marginBottom: 4,
    },
    cartContainer: { 
        justifyContent: 'center',
    },
    addButtonWrapper: {
        backgroundColor: '#283618',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        height: 40
    },
    addButtonText: {
        color: '#fefae0',
        fontFamily: 'Montserrat_600SemiBold',
        fontSize: 14,
        padding: 10
    },
    quantityControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#cfb098',
        height: 40,
        borderRadius: 8,
        padding: 5
    },
    qtyButton: {
        backgroundColor: '#283618',
        width: 32,
        height: 32,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        ...(Platform.OS === 'web' && { cursor: 'pointer' }),
    },
    qtyText: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 16,
        color: '#283618',
    }
});