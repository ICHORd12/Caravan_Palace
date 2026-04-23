import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

import Navbar from '../components/Navbar/Navbar';
import GeneralButton from '../components/Buttons/GeneralButton/GeneralButton';
import WrappedGeneralButton from '../components/Buttons/GeneralButtonWithWrapper/GeneralButtonWithWrapper';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTransition } from '../context/TransitionContext';
import { API_BASE_URL, UPDATE_PROFILE_ENDPOINT, ADDRESSES_ENDPOINT } from '../constants/API';

type Address = {
    addressId: number;
    label: string;
    fullAddress: string;
    isDefault: boolean;
};

export default function Profile() {
    const { token, isAuthenticated } = useAuth();
    const { showToast } = useToast();
    const { revealWipe, navigateWithWipe } = useTransition();

    // Profile state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [taxId, setTaxId] = useState('');

    // Profile Edit States
    const [editingField, setEditingField] = useState<'name' | 'taxId' | 'password' | null>(null);
    const [editName, setEditName] = useState('');
    const [editTaxId, setEditTaxId] = useState('');
    const [editPassword, setEditPassword] = useState('');
    const [editConfirmPassword, setEditConfirmPassword] = useState('');


    // Address state
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [newAddressLabel, setNewAddressLabel] = useState('');
    const [newAddressText, setNewAddressText] = useState('');
    const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
    const [editAddressLabel, setEditAddressLabel] = useState('');
    const [editAddressText, setEditAddressText] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const authTracker = useRef(isAuthenticated);

    useEffect(() => {
        authTracker.current = isAuthenticated;
    }, [isAuthenticated]);

    useFocusEffect(
        useCallback(() => {
            if (!authTracker.current) {
                showToast('Please login to view your profile.', 'error');
                navigateWithWipe('/login');
            } else {
                fetchProfileData();
                revealWipe();
            }
        }, [])
    );

    const fetchProfileData = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}${UPDATE_PROFILE_ENDPOINT}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setName(data.user.name || '');
                setEmail(data.user.email || '');
                setTaxId(data.user.taxId || '');
                setAddresses(data.user.addresses || []);
            } else {
                showToast('Failed to load profile data', 'error');
            }
        } catch (error) {
            showToast('Network error loading profile', 'error');
        }
    };

    const handleUpdateSingleField = async (field: 'name' | 'taxId' | 'password') => {
        const fieldLabel = { name: 'Name', taxId: 'Tax ID', password: 'Password' }[field];
        const bodyData: any = {};

        if (field === 'name') {
            if (!editName.trim()) { showToast('Name cannot be empty.', 'error'); return; }
            bodyData.name = editName;
        } else if (field === 'taxId') {
            if (!editTaxId.trim()) { showToast('Tax ID cannot be empty.', 'error'); return; }
            bodyData.taxId = editTaxId;
        } else if (field === 'password') {
            if (!editPassword.trim()) { showToast('Password cannot be empty.', 'error'); return; }
            if (editPassword !== editConfirmPassword) { showToast('Passwords do not match.', 'error'); return; }
            bodyData.password = editPassword;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}${UPDATE_PROFILE_ENDPOINT}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(bodyData)
            });

            if (response.ok) {
                showToast(`${fieldLabel} updated successfully!`, 'success');
                setEditingField(null);
                fetchProfileData();
            } else {
                const errData = await response.json().catch(() => ({}));
                const msg = errData?.message || `Failed to update ${fieldLabel} (${response.status})`;
                showToast(msg, 'error');
            }
        } catch (error: any) {
            showToast(`Network error: ${error?.message || 'Cannot reach server'}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddAddress = async () => {
        if (!newAddressLabel.trim() || !newAddressText.trim()) {
            showToast('Please enter both label and address text.', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}${ADDRESSES_ENDPOINT}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    label: newAddressLabel,
                    fullAddress: newAddressText
                })
            });

            if (response.ok) {
                showToast('Address added successfully!', 'success');
                setNewAddressLabel('');
                setNewAddressText('');
                fetchProfileData(); // Reload addresses
            } else {
                showToast('Failed to add address.', 'error');
            }
        } catch (error) {
            showToast('Network error adding address', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateAddress = async (addressId: number) => {
        if (!editAddressLabel.trim() || !editAddressText.trim()) {
            showToast('Label and address text cannot be empty.', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}${ADDRESSES_ENDPOINT}/${addressId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    label: editAddressLabel,
                    fullAddress: editAddressText
                })
            });

            if (response.ok) {
                showToast('Address updated successfully!', 'success');
                setEditingAddressId(null);
                fetchProfileData();
            } else {
                showToast('Failed to update address.', 'error');
            }
        } catch (error) {
            showToast('Network error updating address', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSetDefaultAddress = async (addressId: number) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}${ADDRESSES_ENDPOINT}/${addressId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ isDefault: true })
            });

            if (response.ok) {
                showToast('Default address updated!', 'success');
                fetchProfileData();
            } else {
                showToast('Failed to update default address.', 'error');
            }
        } catch (error) {
            showToast('Network error updating address', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteAddress = async (addressId: number) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}${ADDRESSES_ENDPOINT}/${addressId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                showToast('Address deleted successfully!', 'success');
                fetchProfileData();
            } else {
                showToast('Cannot delete the last address.', 'error');
            }
        } catch (error) {
            showToast('Network error deleting address', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.mainContainer}>
            <Navbar />

            <ScrollView style={styles.contentContainer} contentContainerStyle={styles.scrollContent}>

                <Text style={styles.titleText}>MY PROFILE</Text>

                {/* Personal Information Section */}
                <View style={styles.formContainer}>
                    <Text style={styles.sectionHeader}>Personal Information</Text>

                    {/* Email Card */}
                    <View style={styles.addressCard}>
                        <Text style={styles.addressLabel}>Email Address</Text>
                        <Text style={styles.addressText}>{email}</Text>
                    </View>

                    {/* Name Card */}
                    <View style={styles.addressCard}>
                        <Text style={styles.addressLabel}>Full Name</Text>
                        {editingField === 'name' ? (
                            <>
                                <TextInput style={styles.input} value={editName} onChangeText={setEditName} />
                                <View style={styles.addressActions}>
                                    <WrappedGeneralButton title="Save" wrapperStyles={styles.smallButtonWrapper} textStyles={styles.smallButtonText} onPress={() => handleUpdateSingleField('name')} disabled={isLoading} />
                                    <WrappedGeneralButton title="Cancel" wrapperStyles={[styles.smallButtonWrapper, { backgroundColor: '#ccc' }]} textStyles={styles.smallButtonText} onPress={() => setEditingField(null)} disabled={isLoading} />
                                </View>
                            </>
                        ) : (
                            <>
                                <Text style={styles.addressText}>{name}</Text>
                                <View style={styles.addressActions}>
                                    <WrappedGeneralButton title="Edit" wrapperStyles={styles.smallButtonWrapper} textStyles={styles.smallButtonText} onPress={() => { setEditName(name); setEditingField('name'); }} disabled={isLoading} />
                                </View>
                            </>
                        )}
                    </View>

                    {/* Tax ID Card */}
                    <View style={styles.addressCard}>
                        <Text style={styles.addressLabel}>Tax ID</Text>
                        {editingField === 'taxId' ? (
                            <>
                                <TextInput style={styles.input} value={editTaxId} onChangeText={setEditTaxId} />
                                <View style={styles.addressActions}>
                                    <WrappedGeneralButton title="Save" wrapperStyles={styles.smallButtonWrapper} textStyles={styles.smallButtonText} onPress={() => handleUpdateSingleField('taxId')} disabled={isLoading} />
                                    <WrappedGeneralButton title="Cancel" wrapperStyles={[styles.smallButtonWrapper, { backgroundColor: '#ccc' }]} textStyles={styles.smallButtonText} onPress={() => setEditingField(null)} disabled={isLoading} />
                                </View>
                            </>
                        ) : (
                            <>
                                <Text style={styles.addressText}>{taxId}</Text>
                                <View style={styles.addressActions}>
                                    <WrappedGeneralButton title="Edit" wrapperStyles={styles.smallButtonWrapper} textStyles={styles.smallButtonText} onPress={() => { setEditTaxId(taxId); setEditingField('taxId'); }} disabled={isLoading} />
                                </View>
                            </>
                        )}
                    </View>

                    {/* Password Card */}
                    <View style={styles.addressCard}>
                        <Text style={styles.addressLabel}>Password</Text>
                        {editingField === 'password' ? (
                            <>
                                <Text style={styles.labelText}>New Password</Text>
                                <TextInput style={styles.input} value={editPassword} onChangeText={setEditPassword} secureTextEntry />
                                <Text style={styles.labelText}>Confirm New Password</Text>
                                <TextInput style={styles.input} value={editConfirmPassword} onChangeText={setEditConfirmPassword} secureTextEntry />
                                <View style={styles.addressActions}>
                                    <WrappedGeneralButton title="Save" wrapperStyles={styles.smallButtonWrapper} textStyles={styles.smallButtonText} onPress={() => handleUpdateSingleField('password')} disabled={isLoading} />
                                    <WrappedGeneralButton title="Cancel" wrapperStyles={[styles.smallButtonWrapper, { backgroundColor: '#ccc' }]} textStyles={styles.smallButtonText} onPress={() => setEditingField(null)} disabled={isLoading} />
                                </View>
                            </>
                        ) : (
                            <>
                                <Text style={styles.addressText}>••••••••</Text>
                                <View style={styles.addressActions}>
                                    <WrappedGeneralButton title="Change Password" wrapperStyles={styles.smallButtonWrapper} textStyles={styles.smallButtonText} onPress={() => { setEditPassword(''); setEditConfirmPassword(''); setEditingField('password'); }} disabled={isLoading} />
                                </View>
                            </>
                        )}
                    </View>

                </View>

                {/* Addresses Section */}
                <View style={styles.formContainer}>
                    <Text style={styles.sectionHeader}>Your Addresses</Text>

                    {addresses.map((address) => (
                        <View key={address.addressId} style={styles.addressCard}>
                            {editingAddressId === address.addressId ? (
                                <>
                                    <TextInput
                                        style={styles.input}
                                        value={editAddressLabel}
                                        onChangeText={setEditAddressLabel}
                                    />
                                    <TextInput
                                        style={styles.input}
                                        value={editAddressText}
                                        onChangeText={setEditAddressText}
                                        multiline
                                    />
                                    <View style={styles.addressActions}>
                                        <WrappedGeneralButton
                                            title="Save"
                                            wrapperStyles={styles.smallButtonWrapper}
                                            textStyles={styles.smallButtonText}
                                            onPress={() => handleUpdateAddress(address.addressId)}
                                            disabled={isLoading}
                                        />
                                        <WrappedGeneralButton
                                            title="Cancel"
                                            wrapperStyles={[styles.smallButtonWrapper, { backgroundColor: '#ccc' }]}
                                            textStyles={styles.smallButtonText}
                                            onPress={() => setEditingAddressId(null)}
                                            disabled={isLoading}
                                        />
                                    </View>
                                </>
                            ) : (
                                <>
                                    <View style={styles.addressHeader}>
                                        <Text style={styles.addressLabel}>{address.label}</Text>
                                        {address.isDefault && (
                                            <View style={styles.defaultBadge}>
                                                <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.addressText}>{address.fullAddress}</Text>

                                    <View style={styles.addressActions}>
                                        {!address.isDefault && (
                                            <WrappedGeneralButton
                                                title="Set as Default"
                                                wrapperStyles={[styles.smallButtonWrapper, { backgroundColor: '#7e7e7e' }]}
                                                textStyles={[styles.smallButtonText, { color: '#fff' }]}
                                                onPress={() => handleSetDefaultAddress(address.addressId)}
                                                disabled={isLoading}
                                            />
                                        )}
                                        <TouchableOpacity
                                            style={styles.iconButton}
                                            onPress={() => {
                                                setEditingAddressId(address.addressId);
                                                setEditAddressLabel(address.label);
                                                setEditAddressText(address.fullAddress);
                                            }}
                                            disabled={isLoading}
                                        >
                                            <Ionicons name="pencil" size={18} color="#222" />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.iconButton, styles.iconButtonDelete]}
                                            onPress={() => handleDeleteAddress(address.addressId)}
                                            disabled={isLoading}
                                        >
                                            <Ionicons name="trash" size={18} color="#fff" />
                                        </TouchableOpacity>
                                    </View>
                                </>
                            )}
                        </View>
                    ))}

                    {/* Add New Address */}
                    <View style={styles.addAddressContainer}>
                        <Text style={styles.subHeader}>Add New Address</Text>

                        <Text style={styles.labelText}>Label (e.g., Home, Office)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Address Label"
                            value={newAddressLabel}
                            onChangeText={setNewAddressLabel}
                        />

                        <Text style={styles.labelText}>Full Address</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Full address details"
                            value={newAddressText}
                            onChangeText={setNewAddressText}
                            multiline
                        />

                        <View style={styles.buttonContainer}>
                            <WrappedGeneralButton
                                title="ADD ADDRESS"
                                wrapperStyles={styles.actionButtonWrapper}
                                textStyles={styles.actionButtonText}
                                onPress={handleAddAddress}
                                disabled={isLoading}
                            />
                        </View>
                    </View>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#d6cba6',
    },
    contentContainer: {
        flex: 1,
    },
    scrollContent: {
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    titleText: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 24,
        marginBottom: 20,
        color: '#222222',
    },
    formContainer: {
        width: '100%',
        maxWidth: 500,
        backgroundColor: 'rgba(159, 159, 159, 0.4)',
        borderRadius: 15,
        padding: 25,
        marginBottom: 30,
    },
    sectionHeader: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 20,
        color: '#222222',
        marginBottom: 20,
        textAlign: 'center',
    },
    subHeader: {
        fontFamily: 'Montserrat_600SemiBold',
        fontSize: 16,
        color: '#222222',
        marginBottom: 15,
        marginTop: 20,
    },
    labelText: {
        fontFamily: 'Montserrat_400Regular',
        fontSize: 14,
        fontWeight: '600',
        color: '#222222',
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        fontFamily: 'Montserrat_400Regular',
        backgroundColor: '#d5d5d5',
        borderWidth: 1,
        borderColor: '#cccccc',
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginBottom: 20,
        fontSize: 16,
    },
    readOnlyInput: {
        backgroundColor: '#bcbcbc',
        color: '#555555',
    },
    buttonContainer: {
        width: '60%',
        alignSelf: 'center',
        marginTop: 10,
    },
    actionButtonWrapper: {
        backgroundColor: '#a94c0f',
        borderRadius: 8,
        padding: 12,
    },
    actionButtonText: {
        color: '#222222',
        fontFamily: 'Montserrat_600SemiBold',
        textAlign: 'center',
    },
    addressCard: {
        backgroundColor: '#e6dfc8',
        padding: 15,
        borderRadius: 8,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    addressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    addressLabel: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 16,
        color: '#222222',
    },
    defaultBadge: {
        backgroundColor: '#a94c0f',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    defaultBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontFamily: 'Montserrat_700Bold',
    },
    addressText: {
        fontFamily: 'Montserrat_400Regular',
        fontSize: 14,
        color: '#333333',
        marginBottom: 15,
    },
    addressActions: {
        flexDirection: 'row',
        gap: 10,
        flexWrap: 'wrap',
        alignItems: 'center',
    },
    iconButton: {
        backgroundColor: '#a94c0f',
        borderRadius: 8,
        padding: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconButtonDelete: {
        backgroundColor: '#c14e4e',
    },
    smallButtonWrapper: {
        backgroundColor: '#a94c0f',
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    smallButtonText: {
        color: '#222222',
        fontFamily: 'Montserrat_600SemiBold',
        fontSize: 12,
        textAlign: 'center',
    },
    addAddressContainer: {
        marginTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#aaa',
        paddingTop: 15,
    }
});
