import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    userCommentBox: {
        padding: 15,
        marginRight: 10,
        backgroundColor: '#e6dcc1', 
        borderRadius: 8,
    },
    userCommentTopBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    userCommentTopBarUserNameText: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 16,
        color: '#2c2c2c',
    },
    userCommentContainer: {
        marginVertical: 10
    },
    userCommentText: {
        fontFamily: 'Montserrat_400Regular',
        fontSize: 14,
        color: '#3b3b3b',
        lineHeight: 20,
    },
    userCommentCreatedAtContainer: {
        alignItems: 'flex-end',
    },
    userCommentCreatedAtText: {
        fontFamily: 'Montserrat_400Regular',
        fontSize: 12,
        color: '#8a8a8a',
    }
});