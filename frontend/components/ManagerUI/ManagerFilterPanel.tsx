import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';

export default function ManagerFilterPanel({ children }: { children: React.ReactNode }) {
    return <View style={styles.container}>{children}</View>;
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        backgroundColor: Colors.light.softContainerBackground,
        borderRadius: 8,
        padding: 14,
        marginBottom: 16,
        zIndex: 10,
    },
});
