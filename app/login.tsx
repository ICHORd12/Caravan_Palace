import {
    Montserrat_400Regular,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    useFonts
} from '@expo-google-fonts/montserrat';
import { useRouter } from 'expo-router'; // Added for navigation
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import GeneralButton from '../components/utku/GeneralButton/GeneralButton';

export default function Login() {
    const router = useRouter();

    let [fontsLoaded] = useFonts({
        Montserrat_700Bold,
        Montserrat_400Regular,
        Montserrat_600SemiBold,
    });

    // State to hold the text the user types into the inputs
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    return (
        <View style={styles.container}> 
            
            {/* Main Form Box */}
            <View style={styles.formContainer}>
                <Text style={styles.titleText}>LOGIN</Text>

                <Text style={styles.labelText}>User Name</Text>
                <TextInput 
                    style={styles.input} 
                    placeholder="Enter your username"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none" 
                />

                <Text style={styles.labelText}>Password</Text>
                <TextInput 
                    style={styles.input} 
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={true} // Hides the password with dots
                />

                <View style={styles.loginButtonWrapper}>
                    <GeneralButton 
                        title="LOGIN" 
                        onPress={() => console.log('Logging in with:', username, password)} 
                    />
                </View>
            </View>

            <View style={styles.footerContainer}>
                <Text style={styles.footerText}>Not Registered?</Text>
                <GeneralButton 
                    title="REGISTER" 
                    onPress={() => router.push('/Register')} 
                />
            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#d6cba6', // Your requested background color
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    formContainer: {
        width: '100%',
        maxWidth: 400, // Prevents it from getting too wide on tablets/web
        backgroundColor: 'rgba(255, 255, 255, 0.4)', // Adds a nice subtle glass/card effect
        padding: 30,
        borderRadius: 15,
        marginBottom: 40,
    },
    titleText: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 32,
        fontWeight: 'bold',
        color: '#222222',
        marginBottom: 30,
        textAlign: 'center',
        // fontFamily: 'Montserrat_700Bold', // Uncomment if you bring your fonts over!
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
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#cccccc',
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 12,
        marginBottom: 20,
        fontSize: 16,
    },
    loginButtonWrapper: {
        marginTop: 10,
        alignItems: 'center', // Centers your GeneralButton
    },
    footerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15, // Puts space between the text and the button
    },
    footerText: {
        fontFamily: 'Montserrat_400Regular',
        fontSize: 16,
        color: '#222222',
        // fontFamily: 'Montserrat_400Regular', // Uncomment if you bring your fonts over!
    }
});