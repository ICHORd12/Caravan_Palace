import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { useCart } from '../../../context/CartContext';
import GeneralButton from '../GeneralButton/GeneralButton';
import LoginRegisterButton from '../LoginRegisterButton/LoginRegisterButton';

export default function C_Navbar() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();
  const { itemCount } = useCart();

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      {/* Left: Logo / Home */}
      <Pressable onPress={() => router.push('/')} style={styles.logoContainer}>
        <Text style={styles.logoText}>CARAVAN PALACE</Text>
      </Pressable>

      {/* Right: Navigation */}
      <View style={styles.headerLinks}>
        <GeneralButton title="HOME" onPress={() => router.push('/')} />
        <GeneralButton title="CARAVANS" onPress={() => router.push('/caravans')} />

        {/* Cart Button with Badge */}
        <Pressable onPress={() => router.push('/cart')} style={styles.cartButton}>
          <Text style={styles.cartText}>🛒 CART</Text>
          {itemCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{itemCount}</Text>
            </View>
          )}
        </Pressable>

        {isAuthenticated ? (
          <>
            <GeneralButton title="MY ORDERS" onPress={() => router.push('/orders')} />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>Hello, {user?.name?.split(' ')[0]}</Text>
            </View>
            <LoginRegisterButton title="LOGOUT" onPress={handleLogout} />
          </>
        ) : (
          <>
            <LoginRegisterButton title="LOGIN" onPress={() => router.push('/login')} />
            <LoginRegisterButton title="REGISTER" onPress={() => router.push('/register')} />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  logoContainer: {
    paddingRight: 20,
  },
  logoText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 20,
    color: '#222222',
    letterSpacing: 2,
  },
  headerLinks: {
    flexDirection: 'row',
    gap: 30,
    alignItems: 'center',
  },
  cartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  cartText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 15,
    color: '#222222',
  },
  cartBadge: {
    position: 'absolute',
    top: -8,
    right: -14,
    backgroundColor: '#E74C3C',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  userInfo: {
    paddingHorizontal: 8,
  },
  userName: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 14,
    color: '#5A7D71',
  },
});
