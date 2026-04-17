import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { TransitionProvider } from '../context/TransitionContext';

export default function RootLayout() {
    return (
        <TransitionProvider>
            <ToastProvider>
                <AuthProvider>


                    <Stack screenOptions={{ headerShown: false }} />


                </AuthProvider>
            </ToastProvider>
        </TransitionProvider>
    );
}