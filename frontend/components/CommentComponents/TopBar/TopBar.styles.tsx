import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    topBarContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10,
        elevation: 10,
    },
    topBarRatingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    topBarRatingAvgStar: {

    },
    topBarRatingAvgPoint: {
        borderRadius: 10,
        padding: 5,
        backgroundColor: '#003d20'
    },
    topBarRatingAvgPointText: {
        fontFamily: 'Montserrat_400Regular',
        color: '#c4c4c4',
        fontSize: 20,
    },
    topBarSortDropDown: {

    },
});