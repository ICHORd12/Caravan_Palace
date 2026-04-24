import { Platform, StyleSheet } from 'react-native';



export const styles = StyleSheet.create({
    cartCard: {
        flexDirection: 'row',
        backgroundColor: '#fefae0',
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
        alignItems: 'center',
    },
    itemImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: '#e9e5d3',
    },
    itemDetails: {
        flex: 1,
        marginLeft: 15,
        justifyContent: 'space-between',
        height: 80,
    },
    itemNameText: {
        fontFamily: 'Montserrat_600SemiBold',
        fontSize: 16,
        color: '#283618',
    },
    itemPriceText: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 16,
        color: '#bc4749',
    },
    itemStockInfoText: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 16,
        color: '#9e7f7f',
    },
    removeText: {
        fontFamily: 'Montserrat_400Regular',
        fontSize: 13,
        color: '#666',
        textDecorationLine: 'underline',
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 40,
        backgroundColor: '#e9e5d3',
        borderRadius: 8,
        paddingHorizontal: 5,
    },
    qtyBtn: {
        paddingVertical: 5,
        paddingHorizontal: 12,
    },
    qtyBtnText: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 18,
        color: '#283618',
    },
    qtyText: {
        textAlign: 'center',
        minWidth: 20,
        fontFamily: 'Montserrat_600SemiBold',
        fontSize: 16,
        color: '#283618',
    },
});