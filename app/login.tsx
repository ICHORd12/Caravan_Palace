import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View, ActivityIndicator } from 'react-native';

import GeneralButton from '../components/utku/GeneralButton/GeneralButton';
import Toast from '../components/utku/Toast/Toast';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setToastMsg('Please enter email and password');
      setToastVisible(true);
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      // Redirect to returnTo path if exists, otherwise back
      if (params.returnTo) {
        router.replace(params.returnTo as string);
      } else if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/');
      }
    } catch (err: any) {
      setToastMsg(err.message || 'Login failed');
      setToastVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}> 
      <Toast type="error" message={toastMsg} visible={toastVisible} onHide={() => setToastVisible(false)} />
      
      <View style={styles.formContainer}>
        <Text style={styles.titleText}>LOGIN</Text>

        <Text style={styles.labelText}>Email</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none" 
          keyboardType="email-address"
        />

        <Text style={styles.labelText}>Password</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={true} 
        />

        <View style={styles.loginButtonWrapper}>
          {loading ? (
            <ActivityIndicator size="small" color="#5A7D71" />
          ) : (
            <GeneralButton title="LOGIN" onPress={handleLogin} />
          )}
        </View>
      </View>

      <View style={styles.footerContainer}>
        <Text style={styles.footerText}>Not Registered?</Text>
        <GeneralButton 
          title="REGISTER" 
          onPress={() => router.push('/register')} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d6cba6',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 30,
    borderRadius: 15,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  titleText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 32,
    color: '#222222',
    marginBottom: 30,
    textAlign: 'center',
  },
  labelText: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 14,
    color: '#222',
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
    outlineStyle: 'none',
  },
  loginButtonWrapper: {
    marginTop: 10,
    alignItems: 'center',
  },
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  footerText: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 16,
    color: '#222',
  }
});