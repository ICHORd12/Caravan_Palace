//#region IMPORTS

import { useFocusEffect } from 'expo-router'; // Added for navigation
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import WrappedGeneralButton from '@/components/Buttons/GeneralButtonWithWrapper/GeneralButtonWithWrapper';
import GeneralButton from '../components/Buttons/GeneralButton/GeneralButton';
import { API_BASE_URL, loginEndPoint } from '../constants/API';

import Navbar from '@/components/Navbar/Navbar';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTransition } from '../context/TransitionContext';

//#endregion


export default function Login() { 

    // State to hold the text the user types into the inputs
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const passwordRef = useRef<TextInput>(null);

    const { revealWipe, navigateWithWipe } = useTransition();
    const { showToast } = useToast();
    const { login, isAuthenticated } = useAuth();

    const authTracker = useRef(isAuthenticated);

    useEffect(() => {
        authTracker.current = isAuthenticated;
    }, [isAuthenticated]);

    useFocusEffect(
        useCallback(() => {
            if (authTracker.current) {
                showToast('You are already logged in.', 'info');
                navigateWithWipe('/');
            } else {
                revealWipe();
            }
        }, [])
    );

    // TO DO-> Tell Backend to return proper message for User Not Found, not just 404.
    const handleLogin = async (email: string, password: string) => {

        if (!email.trim() || !password.trim()) {
            showToast('Please enter both email and password.', 'error');
            return;
        }
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}${loginEndPoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                }),
            });

            if (response.ok) 
            {
                const data = await response.json();

                await login(data.token);

                console.log('Token saved securely via AuthContext!');
                
                setEmail('');
                setPassword('');
                navigateWithWipe('/'); // Navigate to home after successful login

            }
            else 
            {
                if (response.status === 404) 
                {
                    showToast('User not found. Please check your email.', 'error');
                } 
                else 
                {
                    showToast('Invalid email or password.', 'error');
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
                    <Text style={styles.titleText}>LOGIN</Text>

                    {/* Main Form Box */}
                    <View style={styles.formContainer}>

                        <Text style={styles.labelText}>Email</Text>
                        <TextInput
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
                            secureTextEntry={true} 
                            returnKeyType="go" 
                            onSubmitEditing={() => {
                                // Prevent triggering if already loading
                                if (!isLoading) {
                                    handleLogin(email, password);
                                }
                            }}
                        />

                        <View style={styles.loginButtonContainer}>
                            <WrappedGeneralButton
                                title="LOGIN"
                                wrapperStyles={styles.loginButtonWrapper} 
                                textStyles={styles.loginButton}           
                                onPress={() => handleLogin(email, password)}
                                disabled={isLoading}
                            />
                        </View>

                    </View>

                    {/* Footer */}
                    <View style={styles.footerContainer}>
                        <Text style={styles.footerText}>Not Registered?</Text>
                        <GeneralButton title="REGISTER" onPress={() => navigateWithWipe('/register')} />
                    </View>

                </View>

                {/* Bottom Spacer (80% of the empty space) */}
                <View style={{ flex: 8 }} />

            </View>

        </View>
    );
}


//#region STYLES

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
    loginButtonContainer: {
        width: '50%',
        alignSelf: 'center',
    },
    loginButtonWrapper: {
        backgroundColor: '#a94c0f',
        borderRadius: 8,
        padding: 10,
    },
    loginButton: {
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