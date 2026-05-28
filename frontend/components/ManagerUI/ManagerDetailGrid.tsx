import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';

type DetailItem = { label: string; value: string | number };

export default function ManagerDetailGrid({ items }: { items: DetailItem[] }) {
    return (
        <View style={styles.grid}>
            {items.map((it) => (
                <View key={it.label} style={styles.item}>
                    <Text style={styles.label}>{it.label}</Text>
                    <Text style={styles.value}>{String(it.value)}</Text>
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    item: { flex: 1, minWidth: 180, backgroundColor: '#fff', borderRadius: 8, padding: 10 },
    label: { marginBottom: 4, fontFamily: Fonts.semibold, fontSize: 12, color: Colors.light.basePriceDiscountedTextColor },
    value: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.light.mainTextColor },
});
