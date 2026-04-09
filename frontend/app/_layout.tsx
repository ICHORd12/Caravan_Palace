import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { TransitionProvider } from '../context/TransitionContext';

export default function RootLayout() {
    return (
        <AuthProvider>
            <TransitionProvider>
                <ToastProvider>
                    <Stack screenOptions={{ headerShown: false }} />
                </ToastProvider>
            </TransitionProvider>
        </AuthProvider>
    );
}