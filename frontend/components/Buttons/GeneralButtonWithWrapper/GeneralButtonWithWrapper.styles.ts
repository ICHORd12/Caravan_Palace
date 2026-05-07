import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    buttonWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        fontFamily: 'Montserrat_600SemiBold', 
        fontSize: 15,                     
        textAlign: 'center',              
        color: '#222222',
    },
    buttonTextHovered: {
        textDecorationLine: 'underline', 
    }
});