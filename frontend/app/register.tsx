import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';


import { useAuth } from '@/context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTransition } from '../context/TransitionContext';

import WrappedGeneralButton from '@/components/Buttons/GeneralButtonWithWrapper/GeneralButtonWithWrapper';
import Navbar from '@/components/Navbar/Navbar';
import { API_BASE_URL, registerEndPoint } from '@/constants/API';
import GeneralButton from '../components/Buttons/GeneralButton/GeneralButton';


// TO DO-> Implement Register Form, and Connect it with Backend.
export default function Register() {

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [taxId, setTaxId] = useState('');
    const [homeAddress, setHomeAddress] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    
    const { revealWipe, navigateWithWipe } = useTransition();
    const { showToast } = useToast();
    
    const { login, isAuthenticated } = useAuth();
    const authTracker = useRef(isAuthenticated);

    const emailRef = useRef<TextInput>(null);
    const passwordRef = useRef<TextInput>(null);
    const confirmPasswordRef = useRef<TextInput>(null);
    const taxIdRef = useRef<TextInput>(null);
    const homeAddressRef = useRef<TextInput>(null);

    useEffect(() => {
        authTracker.current = isAuthenticated;
    }, [isAuthenticated]);

    useFocusEffect(
        useCallback(() => {
            if (authTracker.current) {
                showToast('Logout to register.', 'info');
                navigateWithWipe('/');
            } else {
                revealWipe();
            }
        }, [])
    );

    type RegisterInput = {
        name: string;
        email: string;
        password: string;
        confirmPassword: string;
        taxId: string;
        homeAddress: string;
    }

    const handleRegister = async (input: RegisterInput) => {
        

        if (   !input.name.trim() 
            || !input.email.trim() 
            || !input.password.trim() 
            || !input.confirmPassword.trim() 
            || !input.taxId.trim() 
            || !input.homeAddress.trim()) 
        {
            showToast('Please fill in all fields.', 'error');
            return;
        }
        
        if (input.password !== input.confirmPassword) 
        {
            showToast('Passwords do not match.', 'error');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}${registerEndPoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name,
                    email: email,
                    password: password,
                    tax_id: taxId,
                    home_address: homeAddress
                }),
            });

            if (response.ok) 
            {
                const data = await response.json();
                
                setName('');
                setEmail('');
                setPassword('');
                setConfirmPassword('');
                setTaxId('');
                setHomeAddress('');
                navigateWithWipe('/login'); // Navigate to login after successful register

            }
            else 
            {
                if (response.status === 404) 
                {
                    showToast('404', 'error');
                } 
                else 
                {
                    showToast('Error', 'error');
                }
            }

        } catch (error) {
            console.error('Login error:', error);
            Alert.alert('Network Error', 'Could not connect to the server.');

        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.mainContainer}>
            {/* Navbar */}
            <Navbar></Navbar>

            {/* Content */}
            <View style={styles.contentContainer}>
            
                {/* Top Spacer (20% of the empty space) */}
                <View style={{ flex: 2 }} />

                <View style={styles.innerContent}>
                    {/* Title */}
                    <Text style={styles.titleText}>REGISTER</Text>

                    {/* Main Form Box */}
                    <View style={styles.formContainer}>

                        <Text style={styles.labelText}>Full Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your full name"
                            value={name}
                            onChangeText={setName}
                            autoCapitalize="none"
                            returnKeyType="next"
                            onSubmitEditing={() => emailRef.current?.focus()}
                        />

                        <Text style={styles.labelText}>Email</Text>
                        <TextInput
                            ref={emailRef}
                            style={styles.input}
                            placeholder="Enter your email"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            returnKeyType="next"
                            onSubmitEditing={() => passwordRef.current?.focus()}
                        />
                        
                        <Text style={styles.labelText}>Password</Text>
                        <TextInput
                            ref={passwordRef}
                            style={styles.input}
                            placeholder="Enter your password"
                            value={password}
                            onChangeText={setPassword}
                            autoCapitalize="none"
                            secureTextEntry={true}
                            returnKeyType="next"
                            onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                        />

                        <Text style={styles.labelText}>Confirm Password</Text>
                        <TextInput
                            ref={confirmPasswordRef}
                            style={styles.input}
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            autoCapitalize="none"
                            secureTextEntry={true}
                            returnKeyType="next"
                            onSubmitEditing={() => taxIdRef.current?.focus()}
                        />

                        <Text style={styles.labelText}>Tax ID</Text>
                        <TextInput
                            ref={taxIdRef}
                            style={styles.input}
                            placeholder="Enter your tax ID"
                            value={taxId}
                            onChangeText={setTaxId}
                            autoCapitalize="none"
                            returnKeyType="next"
                            onSubmitEditing={() => homeAddressRef.current?.focus()}
                        />

                        <Text style={styles.labelText}>Home Address</Text>
                        <TextInput
                            ref={homeAddressRef}
                            style={styles.input}
                            placeholder="Enter your Home Address"
                            value={homeAddress}
                            onChangeText={setHomeAddress}
                            autoCapitalize="none"
                            returnKeyType="next"
                             onSubmitEditing={() => {
                                // Prevent triggering if already loading
                                const input: RegisterInput = {
                                    name,
                                    email,
                                    password,
                                    confirmPassword,
                                    taxId,
                                    homeAddress
                                };

                                if (!isLoading) {
                                    handleRegister(input);
                                }
                            }}
                        />

                        <View style={styles.registerButtonContainer}>
                            <WrappedGeneralButton
                                title="REGISTER"
                                wrapperStyles={styles.registerButtonWrapper} 
                                textStyles={styles.registerButton}           
                                onPress={() => {
                                    const input: RegisterInput = {
                                        name,
                                        email,
                                        password,
                                        confirmPassword,
                                        taxId,
                                        homeAddress
                                    };

                                    handleRegister(input);
                                }}
                                disabled={isLoading}
                            />
                        </View>

                    </View>

                    {/* Footer */}
                    <View style={styles.footerContainer}>
                        <Text style={styles.footerText}>Already registered?</Text>
                        <GeneralButton title="LOGIN" onPress={() => navigateWithWipe('/login')} />
                    </View>

                </View>

                {/* Bottom Spacer (80% of the empty space) */}
                <View style={{ flex: 8 }} />

            </View>
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
    innerContent: {
        alignItems: 'center',
        width: '100%',
    },
    titleText: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 20,
    },
    formContainer: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: 'rgba(159, 159, 159, 0.4)',
        borderRadius: 15,
        paddingTop: 30,
        paddingHorizontal: 20,
        paddingBottom: 20,
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
    registerButtonContainer: {
        width: '50%',
        alignSelf: 'center',
    },
    registerButtonWrapper: {
        backgroundColor: '#a94c0f',
        borderRadius: 8,
        padding: 10,
    },
    registerButton: {
        color: '#222222',
    },
    footerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 15,
        padding: 10
    },
    footerText: {
        fontFamily: 'Montserrat_400Regular',
        fontSize: 16,
        color: '#222222',
    }
});
//#endregion