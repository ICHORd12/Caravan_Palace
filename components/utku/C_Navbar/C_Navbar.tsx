import { Router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { styles } from './C_Navbar.style';

import GeneralButton from '../GeneralButton/GeneralButton';
import LoginRegisterButton from '../LoginRegisterButton/LoginRegisterButton';


type C_NavbarProps = {
    router: Router;
};  

export default function C_Navbar({ router }: C_NavbarProps) {

    return (
        <View style={styles.headerLinks}>
          <LoginRegisterButton title="LOGIN" onPress={() => router.push('/login')} />
          <LoginRegisterButton title="REGISTER" onPress={() => router.push('/register')} />
          <GeneralButton title="CONTACT" onPress={() => console.log("Contact clicked")} />
          <GeneralButton title="INSTAGRAM" onPress={() => console.log("Instagram clicked")} />
          <GeneralButton title="X/TWITTER" onPress={() => console.log("Twitter clicked")} />
        </View>
    );
}



