import { SplashScreen, Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { TransitionProvider } from '../context/TransitionContext';
import { UserProvider } from '@/context/UserContext';

import {
    useFonts,
    Montserrat_400Regular,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
} from '@expo-google-fonts/montserrat';
import { useEffect } from 'react';

export default function RootLayout() {

    const [loaded, error] = useFonts({
        'Montserrat-Regular': Montserrat_400Regular,
        'Montserrat-SemiBold': Montserrat_600SemiBold,
        'Montserrat-Bold': Montserrat_700Bold,
    });

    useEffect(() => {
        if (loaded || error) {
            SplashScreen.hideAsync();
        }
    }, [loaded, error]);

    if (!loaded && !error) {
        return null;
    }

    return (
        <TransitionProvider>
            <ToastProvider>
                <AuthProvider>
                    <UserProvider>


                        <Stack screenOptions={{ headerShown: false }} />

                    </UserProvider>
                </AuthProvider>
            </ToastProvider>
        </TransitionProvider>
    );
}