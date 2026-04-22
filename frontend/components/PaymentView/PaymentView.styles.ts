import { StyleSheet } from "react-native";

const commonInputElementContainerStyle = {
    flexDirection: "row",
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
} as const;

const commonInputElementLabelStyle = {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 14,
    fontWeight: '600',
    color: '#222222',
    marginLeft: 4,
    width: 150, 
} as const;

const commonInputElementStyle = {
    fontFamily: 'Montserrat_400Regular',
    backgroundColor: '#d5d5d5',
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    flex: 1, 
} as const;


export const styles = StyleSheet.create({
    mainContainer: {
        backgroundColor: 'rgba(159, 159, 159, 0.4)',
        borderRadius: 15,
        paddingTop: 30,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },

    cardInputContainer: {
        marginBottom: 20,
        backgroundColor: 'rgba(142, 139, 123, 0.4)',
        borderRadius: 15,
        padding: 10,
    },
    addressInputContainer: {
        backgroundColor: 'rgba(142, 139, 123, 0.4)',
        borderRadius: 15,
        padding: 10,
    },

    // --- ERROR STATE ---
    inputErrorBorder: {
        borderColor: '#bc4749', 
        borderWidth: 1.5,
    },
    errorText: {
        color: '#bc4749',
        fontSize: 12,
        fontFamily: 'Montserrat_500Medium',
        marginTop: 4,
        marginLeft: 4,
    },

    // --- CARD INPUTS ---
    cardHolderNameInputContainer: { 
        ...commonInputElementContainerStyle 
    },
    cardHolderNameInputLabel: { 
        ...commonInputElementLabelStyle 
    },
    cardHolderNameInput: { 
        ...commonInputElementStyle,
    },

    cardNumberInputContainer: { 
        ...commonInputElementContainerStyle 
    },
    cardNumberInputLabel: { 
        ...commonInputElementLabelStyle 
    },
    cardNumberInput: { 
        ...commonInputElementStyle,
    },


    cardExpiryMonthInputContainer: { 
        ...commonInputElementContainerStyle 
    },
    cardExpiryMonthInputLabel: { 
        ...commonInputElementLabelStyle 
    },
    cardExpiryMonthInput: { 
        ...commonInputElementStyle,
        flex: 0,     
        width: 100,   
        
    },

    cardExpiryYearInputContainer: { 
        ...commonInputElementContainerStyle 
    },
    cardExpiryYearInputLabel: { 
        ...commonInputElementLabelStyle 
    },
    cardExpiryYearInput: { 
        ...commonInputElementStyle,
        flex: 0,
        width: 120,
        
    },

    cardCvvInputContainer: { 
        ...commonInputElementContainerStyle 
    },
    cardCvvInputLabel: { 
        ...commonInputElementLabelStyle 
    },
    cardCvvInput: { 
        ...commonInputElementStyle,
        flex: 0,
        width: 100,
        
    },

    // --- ADDRESS INPUTS ---
    addressCountryInputContainer: { 
        ...commonInputElementContainerStyle 
    },
    addressCountryInputLabel: { 
        ...commonInputElementLabelStyle 
    },
    addressCountryInput: { 
        ...commonInputElementStyle 
    },

    addressCityInputContainer: { 
        ...commonInputElementContainerStyle 
    },
    addressCityInputLabel: { 
        ...commonInputElementLabelStyle 
    },
    addressCityInput: { 
        ...commonInputElementStyle 
    },

    addressStreetInputContainer: { 
        ...commonInputElementContainerStyle 
    },
    addressStreetInputLabel: { 
        ...commonInputElementLabelStyle 
    },
    addressStreetInput: { 
        ...commonInputElementStyle 
    },

    addressZipInputContainer: { 
        ...commonInputElementContainerStyle 
    },
    addressZipInputLabel: { 
        ...commonInputElementLabelStyle 
    },
    addressZipInput: { 
        ...commonInputElementStyle,
        flex: 0,
        width: 120 
    },

    // --- CHECKBOX ---
    addressCheckboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end', 
        marginTop: 10,
        gap: 10,
        paddingRight: 10,
    },
    addressCheckboxLabel: {
        fontFamily: 'Montserrat_400Regular',
        fontSize: 14,
        fontWeight: '600',
        color: '#222222',
    },
    addressCheckbox: {
       
    }
});