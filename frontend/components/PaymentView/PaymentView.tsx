import React, { useRef, useState } from "react";
import { TextInput, View, Text, Switch } from "react-native";
import { styles } from './PaymentView.styles';

interface PaymentViewProps {
    cardHolderName: string;
    cardNumber: string;
    cardExpiryYear: string;
    cardExpiryMonth: string;
    cardCvv: string;
    addressCountry: string;
    addressCity: string;
    addressStreet: string;
    addressZip: string;
    addressCheckbox: boolean;

    onCardHolderNameChange: (cardHolder: string) => void;
    onCardNumberChange: (cardNumber: string) => void;
    onCardExpiryMonthChange: (expiryMonth: number) => void;
    onCardExpiryYearChange: (expiryYear: number) => void;
    onCardCvvChange: (CVV: string) => void;

    onAdressStreetChange: (street: string) => void;
    onAdressCityChange: (city: string) => void;
    onAdressZipChange: (zip: string) => void;
    onAdressCountryChange: (country: string) => void;
    onAdressCheckboxChange: (checkbox: boolean) => void;
    errors: Record<string, string>;
}

function PaymentView({
    cardHolderName,
    cardNumber,
    cardExpiryYear,
    cardExpiryMonth,
    cardCvv,
    addressCountry,
    addressCity,
    addressStreet,
    addressZip,
    addressCheckbox,
    onCardHolderNameChange, 
    onCardNumberChange,
    onCardExpiryMonthChange,
    onCardExpiryYearChange,
    onCardCvvChange,
    onAdressCountryChange,
    onAdressCityChange,
    onAdressStreetChange,
    onAdressZipChange,
    onAdressCheckboxChange,
    errors
}: PaymentViewProps) {

    const cardNumberRef = useRef<TextInput>(null);
    const cardExpiryMonthRef = useRef<TextInput>(null);
    const cardExpiryYearRef = useRef<TextInput>(null);
    const cardCvvRef = useRef<TextInput>(null);

    const addressCountryRef = useRef<TextInput>(null); 
    const addressCityRef = useRef<TextInput>(null);
    const addressStreetRef = useRef<TextInput>(null);
    const addressZipRef = useRef<TextInput>(null);

    //#region CARD HANDLERS


    function handleCardHolderNameChange(holderName: string) 
    {
        onCardHolderNameChange(holderName);
    }

    function handleCardNumberChange(cardNumberInput: string) 
    {
        const cleaned = cardNumberInput.replace(/\D/g, '');
        const formatted = cleaned.match(/.{1,4}/g)?.join('-') || '';

        onCardNumberChange(formatted);
    }

    function handleCardExpiryYearChange(expiryYear: string) 
    {
        const cleaned = expiryYear.replace(/\D/g, '');
        onCardExpiryYearChange(parseInt(cleaned) || 0); 
    }

    function handleCardExpiryMonthChange(expiryMonth: string) 
    {
        let cleaned = expiryMonth.replace(/\D/g, '');

        if (cleaned === '00') cleaned = '0';
        if (parseInt(cleaned, 10) > 12) cleaned = cleaned[0]; 
            
        onCardExpiryMonthChange(parseInt(cleaned) || 0);
    }

    function handleCardCvvChange(cvv: string) 
    {
        const cleaned = cvv.replace(/\D/g, '');
        onCardCvvChange(cleaned);
    }
    //#endregion

    //#region ADDRESS HANDLERS


    function handleCountryChange(newCountry: string) 
    {
        onAdressCountryChange(newCountry);
    }

    function handleCityChange(newCity: string) 
    {
        onAdressCityChange(newCity);
    }

    function handleStreetChange(newStreet: string) 
    {
        onAdressStreetChange(newStreet);
    }

    function handleZipChange(newZip: string) 
    {
        onAdressZipChange(newZip);
    }

    function handleCheckboxChange(newValue: boolean) 
    {
        onAdressCheckboxChange(newValue);
    }
    //#endregion


    return (
        <View style={styles.mainContainer}>

            {/* Card Details Container */}
            <View style={styles.cardInputContainer}>

                <View style={styles.cardHolderNameInputContainer}>
                    <Text style={styles.cardHolderNameInputLabel}>Card Holder Name-Surname</Text>
                    <TextInput
                        style={[styles.cardHolderNameInput, errors.cardHolderName ? styles.inputErrorBorder : null]}
                        placeholder="e.g. Aslan Parcasi"
                        keyboardType="default" 
                        maxLength={100}
                        value={cardHolderName}        
                        onChangeText={handleCardHolderNameChange}
                        onSubmitEditing={() => cardNumberRef.current?.focus()}
                    />
                    {/* Render the error message if it exists: */}
                    {errors.cardHolderName && <Text style={styles.errorText}>{errors.cardHolderName}</Text>}
                </View>

                <View style={styles.cardNumberInputContainer}>
                    <Text style={styles.cardNumberInputLabel}>Card Number</Text>
                    <TextInput
                        ref={cardNumberRef}
                        style={[styles.cardNumberInput, errors.cardNumber ? styles.inputErrorBorder : null]}
                        placeholder="e.g. 0000-0000-0000-0000"
                        keyboardType="numeric" 
                        maxLength={19}
                        value={cardNumber}        
                        onChangeText={handleCardNumberChange}
                        onSubmitEditing={() => cardExpiryYearRef.current?.focus()}
                        />
                    {errors.cardNumber && <Text style={styles.errorText}>{errors.cardNumber}</Text>}
                </View>

                <View style={styles.cardExpiryYearInputContainer}>
                    <Text style={styles.cardExpiryYearInputLabel}>Year Expiry</Text>
                    <TextInput
                        ref={cardExpiryYearRef}
                        style={[styles.cardExpiryYearInput, errors.cardExpiryYear ? styles.inputErrorBorder : null]}
                        placeholder="e.g. 2089"
                        keyboardType="numeric" 
                        maxLength={4}
                        value={cardExpiryYear}        
                        onChangeText={handleCardExpiryYearChange}
                        onSubmitEditing={() => cardExpiryMonthRef.current?.focus()}
                        />
                    {errors.cardExpiryYear && <Text style={styles.errorText}>{errors.cardExpiryYear}</Text>}
                </View>

                <View style={styles.cardExpiryMonthInputContainer}>
                    <Text style={styles.cardExpiryMonthInputLabel}>Month Expiry</Text>
                    <TextInput
                        ref={cardExpiryMonthRef}
                        style={[styles.cardExpiryMonthInput, errors.cardExpiryMonth ? styles.inputErrorBorder : null]}
                        placeholder="e.g. 1"
                        keyboardType="numeric" 
                        maxLength={2}
                        value={cardExpiryMonth}        
                        onChangeText={handleCardExpiryMonthChange}
                        onSubmitEditing={() => cardCvvRef.current?.focus()}
                        />
                    {errors.cardExpiryMonth && <Text style={styles.errorText}>{errors.cardExpiryMonth}</Text>}
                </View>


                <View style={styles.cardCvvInputContainer}>
                    <Text style={styles.cardCvvInputLabel}>CVV</Text>
                    <TextInput
                        ref={cardCvvRef}
                        style={[styles.cardCvvInput, errors.cardCvv ? styles.inputErrorBorder : null]}
                        placeholder="e.g. 123"
                        keyboardType="numeric" 
                        maxLength={3}
                        value={cardCvv}        
                        onChangeText={handleCardCvvChange}
                        secureTextEntry={true}
                        onSubmitEditing={() => addressCountryRef.current?.focus()}
                    />
                    {errors.cardCvv && <Text style={styles.errorText}>{errors.cardCvv}</Text>}
                </View>

            </View>

            {/* Address Details Container */}
            <View style={styles.addressInputContainer}>

                <View style={styles.addressCountryInputContainer}>
                    <Text style={styles.addressCountryInputLabel}>Country</Text>
                    <TextInput
                        ref={addressCountryRef}
                        style={[styles.addressCountryInput, errors.addressCountry ? styles.inputErrorBorder : null]}
                        placeholder="Country"
                        keyboardType="default"
                        value={addressCountry}
                        maxLength={100}
                        onChangeText={handleCountryChange}
                        onSubmitEditing={() => addressCityRef.current?.focus()}
                    />
                    {errors.addressCountry && <Text style={styles.errorText}>{errors.addressCountry}</Text>}
                </View>

                <View style={styles.addressCityInputContainer}>
                    <Text style={styles.addressCityInputLabel}>City</Text>
                    <TextInput
                        ref={addressCityRef}
                        style={[styles.addressCityInput, errors.addressCity ? styles.inputErrorBorder : null]}
                        placeholder="City"
                        keyboardType="default"
                        value={addressCity}
                        maxLength={100}
                        onChangeText={handleCityChange}
                        onSubmitEditing={() => addressStreetRef.current?.focus()}
                    />
                    {errors.addressCity && <Text style={styles.errorText}>{errors.addressCity}</Text>}
                </View>

                <View style={styles.addressStreetInputContainer}>
                    <Text style={styles.addressStreetInputLabel}>Street</Text>
                    <TextInput
                        ref={addressStreetRef}
                        style={[styles.addressStreetInput, errors.addressStreet ? styles.inputErrorBorder : null]}
                        placeholder="Street Address"
                        keyboardType="default"
                        value={addressStreet}
                        maxLength={200}
                        onChangeText={handleStreetChange}
                        onSubmitEditing={() => addressZipRef.current?.focus()}
                    />
                    {errors.addressStreet && <Text style={styles.errorText}>{errors.addressStreet}</Text>}
                </View>

                <View style={styles.addressZipInputContainer}>
                    <Text style={styles.addressZipInputLabel}>Zip</Text>
                    <TextInput
                        ref={addressZipRef}
                        style={[styles.addressZipInput, errors.addressZip ? styles.inputErrorBorder : null]}
                        placeholder="Zip / Postal Code"
                        keyboardType="default" 
                        maxLength={10}
                        value={addressZip}
                        onChangeText={handleZipChange}
                    />
                    {errors.addressZip && <Text style={styles.errorText}>{errors.addressZip}</Text>}
                </View>
            </View>

            {/* Checkbox / Toggle Container  */}
            <View style={styles.addressCheckboxContainer}>
                <Text style={styles.addressCheckboxLabel}>Billing Address Is The Same</Text>
                <Switch
                    style={styles.addressCheckbox}
                    value={addressCheckbox}
                    onValueChange={handleCheckboxChange}
                />
            </View>
            
        </View>
    );
}

export default PaymentView;



