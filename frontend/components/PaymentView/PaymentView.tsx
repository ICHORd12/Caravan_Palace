import React, { useRef, useState } from "react";
import { TextInput, View, Text, Switch, TouchableOpacity, StyleSheet, Modal, FlatList, ActivityIndicator } from "react-native";
import { styles } from './PaymentView.styles';
import { Address, useUser } from "@/context/UserContext";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from '@/constants/API'
import { Fonts } from "@/constants/theme";


//#region OVERLAY
interface AddressOverlayProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (fullAddress: string) => void;
}

function AddressSelectionOverlay({ visible, onClose, onSelect }: AddressOverlayProps) {
    const { user, addAddress, updateAddress, refreshUser } = useUser();
    const { token } = useAuth();
    
    // View state: 'list' | 'form'
    const [currentView, setCurrentView] = useState<'list' | 'form'>('list');
    const [isLoading, setIsLoading] = useState(false);
    
    // Form state
    const [editTargetId, setEditTargetId] = useState<number | null>(null);
    const [label, setLabel] = useState("");
    const [fullAddress, setFullAddress] = useState("");
    const [isDefault, setIsDefault] = useState(false);

    const openForm = (address?: Address) => {
        if (address) {
            setEditTargetId(address.addressId);
            setLabel(address.label);
            setFullAddress(address.fullAddress);
            setIsDefault(address.isDefault);
        } else {
            setEditTargetId(null);
            setLabel("");
            setFullAddress("");
            setIsDefault(false);
        }
        setCurrentView('form');
    };

    const handleSaveAddress = async () => {
        setIsLoading(true);
        // Replace API_BASE_URL with your actual variable
        const endpoint = editTargetId 
            ? `${API_BASE_URL}/api/v3/users/me/addresses/${editTargetId}` 
            : `${API_BASE_URL}/api/v3/users/me/addresses`;
        
        const method = editTargetId ? 'PATCH' : 'POST';
        const payload = { label, fullAddress, isDefault };

        try {
            const response = await fetch(endpoint, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                if (isDefault) {
                    await refreshUser();
                } else {
                    const data = await response.json(); 
                    const savedAddress = data.address || { ...payload, addressId: editTargetId || Date.now() }; 
                    
                    if (editTargetId) updateAddress(editTargetId, savedAddress);
                    else addAddress(savedAddress);
                }
                setCurrentView('list');
            } else {
                console.error("Failed to save address");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <View style={overlayStyles.modalBackground}>
                <View style={overlayStyles.modalContainer}>
                    
                    {currentView === 'list' ? (
                        <>
                            <Text style={overlayStyles.title}>Select Address</Text>
                            <FlatList 
                                data={user?.addresses || []}
                                keyExtractor={(item) => item.addressId.toString()}
                                renderItem={({ item }) => (
                                    <TouchableOpacity style={overlayStyles.addressItem} onPress={() => onSelect(item.fullAddress)}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={overlayStyles.addressItemTitle}>{item.label} {item.isDefault && '(Default)'}</Text>
                                            <Text style={overlayStyles.addressItemText}>{item.fullAddress}</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => openForm(item)}>
                                            <Text style={overlayStyles.editText}>Edit</Text>
                                        </TouchableOpacity>
                                    </TouchableOpacity>
                                )}
                            />
                            <View style={overlayStyles.buttonRow}>
                                <TouchableOpacity onPress={onClose} style={overlayStyles.btnSecondary}>
                                    <Text style={overlayStyles.btnSecondaryText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => openForm()} style={overlayStyles.btnPrimary}>
                                    <Text style={overlayStyles.btnPrimaryText}>+ Add New</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    ) : (
                        <>
                            <Text style={overlayStyles.title}>{editTargetId ? 'Edit Address' : 'Add Address'}</Text>
                            
                            <TextInput placeholder="Label (e.g. Home)" value={label} onChangeText={setLabel} style={overlayStyles.input} />
                            <TextInput placeholder="Full Address" value={fullAddress} onChangeText={setFullAddress} style={overlayStyles.input} multiline />
                            
                            <View style={overlayStyles.switchRow}>
                                <Text style={overlayStyles.switchLabel}>Set as Default</Text>
                                <Switch value={isDefault} onValueChange={setIsDefault} />
                            </View>

                            <View style={overlayStyles.buttonRow}>
                                <TouchableOpacity onPress={() => setCurrentView('list')} style={overlayStyles.btnSecondary}>
                                    <Text style={overlayStyles.btnSecondaryText}>Back</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleSaveAddress} disabled={isLoading} style={overlayStyles.btnPrimary}>
                                    {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={overlayStyles.btnPrimaryText}>Save</Text>}
                                </TouchableOpacity>
                            </View>
                        </>
                    )}

                </View>
            </View>
        </Modal>
    );
}

const overlayStyles = StyleSheet.create({
    modalBackground: { 
        flex: 1, 
        justifyContent: 'flex-end', 
        backgroundColor: 'rgba(0,0,0,0.5)' 
    },
    modalContainer: { 
        backgroundColor: 'white', 
        padding: 20, 
        borderTopLeftRadius: 20, 
        borderTopRightRadius: 20, 
        minHeight: 400 
    },
    title: { 
        fontFamily: Fonts.bold,
        fontSize: 18, 
        marginBottom: 15 
    },
    addressItem: { 
        flexDirection: 'row', 
        padding: 15, 
        borderBottomWidth: 1, 
        borderColor: '#eee', 
        alignItems: 'center' 
    },
    addressItemTitle: {
        fontFamily: Fonts.bold,
        fontSize: 14,
        marginBottom: 4,
    },
    addressItemText: {
        fontFamily: Fonts.regular,
        fontSize: 14,
        color: '#333',
    },
    editText: {
        fontFamily: Fonts.semibold,
        color: '#21758f', // Updated to match your theme instead of standard blue
        fontSize: 14,
    },
    input: { 
        fontFamily: Fonts.regular,
        borderWidth: 1, 
        borderColor: '#ccc', 
        padding: 10, 
        borderRadius: 5, 
        marginBottom: 15 
    },
    switchRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 20 
    },
    switchLabel: {
        fontFamily: Fonts.semibold,
        fontSize: 14,
    },
    buttonRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        marginTop: 10 
    },
    btnPrimary: { 
        backgroundColor: '#21758f', 
        padding: 15, 
        borderRadius: 8, 
        flex: 1, 
        marginLeft: 5, 
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnPrimaryText: {
        fontFamily: Fonts.bold,
        color: 'white',
        fontSize: 14,
    },
    btnSecondary: { 
        backgroundColor: '#e0e0e0', 
        padding: 15, 
        borderRadius: 8, 
        flex: 1, 
        marginRight: 5, 
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnSecondaryText: {
        fontFamily: Fonts.semibold,
        color: '#333',
        fontSize: 14,
    }
});
//#endregion


interface PaymentViewProps {
    cardHolderName: string;
    cardNumber: string;
    cardExpiryYear: string;
    cardExpiryMonth: string;
    cardCvv: string;
    addressFull: string;
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

    onAddressFullChange: (fullAddress: string) => void;
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
    addressFull,
    onCardHolderNameChange, 
    onCardNumberChange,
    onCardExpiryMonthChange,
    onCardExpiryYearChange,
    onCardCvvChange,
    onAddressFullChange,
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


    const [isOverlayVisible, setIsOverlayVisible] = useState(false);

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

    function handleAddressFullChange(fullAddress: string)
    {
        onAddressFullChange(fullAddress);
    }

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

            <View style={styles.addressChangeContainer}>
                {/* Trigger Overlay */}
                <TouchableOpacity onPress={() => setIsOverlayVisible(true)}>
                    <Text style={{ color: '#21758f', fontWeight: 'bold' }}>Change Address</Text>
                </TouchableOpacity>
            </View>

            {/* Address Details Container */}
            <View style={styles.addressInputContainer}>

                <View style={styles.addressFullInputContainer}>
                    <Text style={styles.addressFullInputLabel}>Address</Text>
                    <TextInput
                        ref={addressCountryRef}
                        style={[styles.addressFullInput, errors.addressFull ? styles.inputErrorBorder : null]}
                        placeholder="Address Line (Street, City, Country, Zip)"
                        keyboardType="default"
                        value={addressFull}
                        maxLength={100}
                        onChangeText={handleAddressFullChange}
                    />
                    {errors.addressFull && <Text style={styles.errorText}>{errors.addressFull}</Text>}
                </View>

            </View>

            {/* The Overlay Component */}
            <AddressSelectionOverlay 
                visible={isOverlayVisible} 
                onClose={() => setIsOverlayVisible(false)}
                onSelect={(selectedAddressFull) => {
                    handleAddressFullChange(selectedAddressFull);
                    setIsOverlayVisible(false);
                }}
            />

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



/*
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
*/