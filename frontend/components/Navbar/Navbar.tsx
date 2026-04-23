//#region IMPORTS

import { usePathname } from 'expo-router';
import { View } from 'react-native';

import {
    Montserrat_400Regular,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    useFonts
} from '@expo-google-fonts/montserrat';

import { useAuth } from '@/context/AuthContext';
import { useTransition } from '@/context/TransitionContext';
import GeneralButton from '../Buttons/GeneralButton/GeneralButton';
import { styles } from './Navbar.styles';
//#endregion


interface NavbarProps {
    navbarContainerStyle?: object;
    navbarLinksStyle?: object;
    loginRegisterButtonStyle?: object;
}


export default function Navbar({ navbarContainerStyle, navbarLinksStyle, loginRegisterButtonStyle }: NavbarProps) {
    const pathname = usePathname();
    const { isAuthenticated, logout } = useAuth();
    const { setWipe, navigateWithWipe, revealWipe } = useTransition();

    const isAuthScreen = pathname === '/login' || pathname === '/register';

    let [fontsLoaded] = useFonts({
        Montserrat_700Bold,
        Montserrat_400Regular,
        Montserrat_600SemiBold,
    });
    if (!fontsLoaded) return null;


    return (
        <View style={[styles.navbarContainer, navbarContainerStyle]}>

            <View style={[styles.navbarLinks, navbarLinksStyle]}>


                {isAuthenticated ?
                    (
                        // IF LOGGED IN
                        <>
                            <GeneralButton title="MY ACCOUNT" onPress={() => navigateWithWipe('/profile')} />
                            <GeneralButton title="LOGOUT" onPress={() => {
                                if (pathname === '/profile') {
                                    navigateWithWipe('/login', () => logout());
                                } else {
                                    setWipe();
                                    setTimeout(() => {
                                        logout();
                                        revealWipe();
                                    }, 400);
                                }
                            }} />
                        </>
                    )
                    :
                    (
                        // IF LOGGED OUT AND NOT ON LOGIN/REGISTER SCREENS
                        !isAuthScreen && (
                            <>
                                <GeneralButton textStyle={[styles.loginRegisterButton, loginRegisterButtonStyle]} title="LOGIN" onPress={() => navigateWithWipe('/login')} />
                                <GeneralButton textStyle={[styles.loginRegisterButton, loginRegisterButtonStyle]} title="REGISTER" onPress={() => navigateWithWipe('/register')} />
                            </>
                        )
                    )
                }

                {pathname !== '/' && (
                    <GeneralButton title="HOME" onPress={() => navigateWithWipe('/')} />
                )}

                {pathname !== '/login' && pathname !== '/register' && (
                    <>
                        <GeneralButton textStyle={styles.caravansTextStyle} title="CARAVANS" onPress={() => navigateWithWipe('/shopping/caravans')} />
                        <GeneralButton textStyle={styles.shopTextStyle} title="SHOP" onPress={() => navigateWithWipe('/shopping/shoppingCart')} />
                    </>
                )}


                {/* 3. Global Links */}
                <GeneralButton title="CONTACT" onPress={() => console.log("Contact clicked")} />
                <GeneralButton title="INSTAGRAM" onPress={() => console.log("Instagram clicked")} />
                <GeneralButton title="X/TWITTER" onPress={() => console.log("Twitter clicked")} />
            </View>
        </View>
    );
}

