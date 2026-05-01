import { StyleSheet } from "react-native"

export const styles = StyleSheet.create({
    writeCommentContainer: {
        padding: 5,
        marginTop: 10,
    },
    writeCommentRatingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20
    },
    writeCommentRatingLabel: {
        fontFamily: 'Montserrat_700Bold',
        color: '#2c2c2c',
        fontSize: 20,
    },
    writeCommentTextInputContainer: {
        marginTop: 10,
    },
    writeCommentTextInput: {
        fontFamily: 'Montserrat_400Regular',
        fontSize: 16,
        color: '#2c2c2c',
        backgroundColor: '#e6dcc1',
        borderRadius: 8,
        padding: 12,
        minHeight: 100,
        maxHeight: 240,
        textAlignVertical: 'top',
    },
    writeCommentTextInputCharacterCounter: {
        fontFamily: 'Montserrat_400Regular',
        fontSize: 12,
        color: '#4f4f4f',
        textAlign: 'right',
        marginTop: 4,
        paddingRight: 4,
    },
    writeCommentSendButtonContainer: {
        paddingTop: 5,
        alignItems: 'flex-end',
    },
    writeCommentSendButtonWrapper: {
        borderRadius: 10,
        padding: 5,
        backgroundColor: '#005242'
    },
    writeCommentSendButtonText: {
        fontFamily: 'Montserrat_600SemiBold',
        color: '#c4c4c4',
        fontSize: 20,
    },
})
