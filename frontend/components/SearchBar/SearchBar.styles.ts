import { Platform, StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fefae0',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#d6cba6',
        padding: 10
    },
    icon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontFamily: 'Montserrat_400Regular',
        fontSize: 14,
        color: '#283618',
        ...(Platform.OS === 'web' && { outlineStyle: 'none' as any}), // Removes default web outline
    }
});