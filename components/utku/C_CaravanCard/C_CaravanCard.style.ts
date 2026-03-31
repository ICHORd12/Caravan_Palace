import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: {
        backgroundColor: '#E2E2E2', 
        width: 320,
        overflow: 'hidden',
        position: 'relative',
        paddingBottom: 70, // Leaves space for the floating button
        borderRadius: 4,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        paddingHorizontal: 15,
        paddingVertical: 12,
    },
    name: {
        fontSize: 22,
        fontWeight: '900',
        color: '#000',
    },
    type: {
        fontSize: 14,
        color: '#333',
        fontWeight: '400',
    },
    imageContainer: {
        height: 190,
        width: '100%',
    },
    image: {
        width: 320, // Must match container width for proper ScrollView paging
        height: 190,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        marginTop: 15,
    },
    leftInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    stars: {
        flexDirection: 'row',
        gap: 2,
    },
    iconSmall: {
        width: 16,
        height: 16,
        tintColor: '#FFC107', // Yellow tint assuming SVGs/PNGs accept tint
    },
    scoreBadge: {
        backgroundColor: '#FDE17A',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 14,
    },
    scoreText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#111',
    },
    rightInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    iconMedium: {
        width: 24,
        height: 24,
    },
    capacityText: {
        fontSize: 20,
        fontWeight: '400',
        color: '#111',
    },
    price: {
        fontSize: 24,
        fontWeight: '900',
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 10,
        color: '#000',
    },
    buttonContainer: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        height: 60,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    pressableButtonWrapper: {
        width: '100%',
        height: '100%',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    button: {
        backgroundColor: '#5A7D71',
        height: 45,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute', // Allows dynamic bottom positioning 
    },
    buttonText: {
        color: '#111', 
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.5,
    }
});