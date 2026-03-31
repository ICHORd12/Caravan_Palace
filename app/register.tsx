import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View, ActivityIndicator } from 'react-native';

import GeneralButton from '../components/utku/GeneralButton/GeneralButton';
import Toast from '../components/utku/Toast/Toast';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const router = useRouter();
  const { register } = useAuth();

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirm: '', tax_id: '', home_address: ''
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: 'error' as 'error'|'success', visible: false });

  const showToast = (msg: string, type: 'error'|'success' = 'error') => {
    setToast({ msg, type, visible: true });
  };

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) {
      return showToast('Name, email, and password are required');
    }
    if (form.password !== form.confirm) {
      return showToast('Passwords do not match');
    }

    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        tax_id: form.tax_id,
        home_address: form.home_address
      });
      showToast('Registration successful! Please login.', 'success');
      setTimeout(() => router.replace('/login'), 2000);
    } catch (err: any) {
      showToast(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}> 
      <Toast type={toast.type} message={toast.msg} visible={toast.visible} onHide={() => setToast({ ...toast, visible: false })} />
      
      <View style={styles.formContainer}>
        <Text style={styles.titleText}>REGISTER</Text>

        <View style={styles.row}>
          <View style={styles.halfCol}>
            <Text style={styles.labelText}>Full Name *</Text>
            <TextInput style={styles.input} value={form.name} onChangeText={(t) => setForm({...form, name: t})} />
          </View>
          <View style={styles.halfCol}>
            <Text style={styles.labelText}>Email *</Text>
            <TextInput style={styles.input} value={form.email} onChangeText={(t) => setForm({...form, email: t})} autoCapitalize="none" keyboardType="email-address" />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfCol}>
            <Text style={styles.labelText}>Password *</Text>
            <TextInput style={styles.input} value={form.password} onChangeText={(t) => setForm({...form, password: t})} secureTextEntry />
          </View>
          <View style={styles.halfCol}>
            <Text style={styles.labelText}>Confirm Password *</Text>
            <TextInput style={styles.input} value={form.confirm} onChangeText={(t) => setForm({...form, confirm: t})} secureTextEntry />
          </View>
        </View>

        <Text style={styles.labelText}>Home Address</Text>
        <TextInput style={styles.input} value={form.home_address} onChangeText={(t) => setForm({...form, home_address: t})} />

        <Text style={styles.labelText}>Tax ID</Text>
        <TextInput style={styles.input} value={form.tax_id} onChangeText={(t) => setForm({...form, tax_id: t})} />

        <View style={styles.loginButtonWrapper}>
          {loading ? (
            <ActivityIndicator size="small" color="#5A7D71" />
          ) : (
            <GeneralButton title="CREATE ACCOUNT" onPress={handleRegister} />
          )}
        </View>
      </View>

      <View style={styles.footerContainer}>
        <Text style={styles.footerText}>Already have an account?</Text>
        <GeneralButton title="LOGIN" onPress={() => router.push('/login')} />
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
    maxWidth: 600,
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
    color: '#222',
    marginBottom: 30,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 15,
  },
  halfCol: {
    flex: 1,
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