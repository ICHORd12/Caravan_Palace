import { Platform, StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    mainContainer: {
        position: 'relative',
    },
    trigger: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#cfb098',
        borderRadius: 5,
        paddingVertical: 10,
        paddingHorizontal: 12,
        ...(Platform.OS === 'web' && { cursor: 'pointer' }),
    },
    triggerText: {
        fontFamily: 'Montserrat_400Regular',
        color: '#283618',
        fontSize: 14,
    },
    dropdownOverlay: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        marginTop: 4,
        backgroundColor: '#fefae0',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#d6cba6',
        zIndex: 1000, 
    },
    scrollView: {
        maxHeight: 250, 
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#d6cba6',
        padding: 12,
        ...(Platform.OS === 'web' && { cursor: 'pointer' }),
    },
    checkbox: {
        width: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#bc6c25',
        marginRight: 10,
    },
    checkboxSelected: {
        backgroundColor: '#283618',
        borderColor: '#283618',
    },
    optionText: {
        fontFamily: 'Montserrat_400Regular',
        color: '#283618',
        fontSize: 14,
    },

    selectAllButton: { 
        backgroundColor: '#b69853',
        alignItems: 'center',
        padding: 10,
        ...(Platform.OS === 'web' && { cursor: 'pointer' }),
    },
    selectAllText: {
        fontFamily: 'Montserrat_600SemiBold',
        color: '#fefae0',
        fontSize: 14,
    },
    closeButton: {
        backgroundColor: '#283618',
        alignItems: 'center',
        padding: 10,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
        ...(Platform.OS === 'web' && { cursor: 'pointer' }),
    },
    closeButtonText: {
        fontFamily: 'Montserrat_600SemiBold',
        color: '#fefae0',
        fontSize: 14,
    }
});