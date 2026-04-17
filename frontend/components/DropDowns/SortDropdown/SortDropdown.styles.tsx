import { Platform, StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: { 
        position: 'relative',
        width: 200,
        zIndex: 10 
    },
    trigger: {
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        backgroundColor: '#cfb098', 
        borderRadius: 5,
        padding: 10,
        ...(Platform.OS === 'web' && { cursor: 'pointer' }),
    },
    triggerText: { 
        fontFamily: 'Montserrat_600SemiBold', 
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
        elevation: 5,
    },
    optionItem: {
        padding: 12, 
        borderBottomWidth: 1, 
        borderBottomColor: '#d6cba6',
        ...(Platform.OS === 'web' && { cursor: 'pointer' }),
    },
    optionText: { 
        fontFamily: 'Montserrat_400Regular', 
        color: '#283618', 
        fontSize: 14 
    },
    selectedText: { 
        fontFamily: 'Montserrat_700Bold', 
        color: '#bc6c25' 
    }
});