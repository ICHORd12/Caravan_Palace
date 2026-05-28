import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';

export default function ManagerStatusTimeline({
    statuses,
    currentStatus,
    terminalStatuses = [],
}: {
    statuses: string[];
    currentStatus: string;
    terminalStatuses?: string[];
}) {
    const activeIndex = statuses.indexOf(currentStatus);
    const isTerminal = terminalStatuses.includes(currentStatus);

    return (
        <View style={styles.container}>
            {statuses.map((status, idx) => {
                const isActive = status === currentStatus;
                const isCompleted = activeIndex >= idx && !isTerminal;
                return (
                    <View key={status} style={styles.step}>
                        <View style={[
                            styles.circle,
                            isCompleted && styles.completedCircle,
                            isActive && styles.activeCircle,
                            (status === 'cancelled' || status === 'returned') && isActive && styles.cancelledCircle,
                        ]}>
                            <Text style={[styles.circleText, (isCompleted || isActive) && styles.activeCircleText]}>{idx + 1}</Text>
                        </View>
                        <Text style={[styles.stepText, isActive && styles.activeStepText]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
                        {idx < statuses.length - 1 && (
                            <View style={[styles.connector, isCompleted && styles.completedConnector]} />
                        )}
                    </View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 12, marginBottom: 12 },
    step: { flex: 1, alignItems: 'center', position: 'relative' },
    circle: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: Colors.light.greenButtonBackground, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
    completedCircle: { backgroundColor: Colors.light.greenButtonBackground },
    activeCircle: { backgroundColor: '#a94c0f', borderColor: '#a94c0f' },
    cancelledCircle: { backgroundColor: Colors.light.deleteButtonBackground, borderColor: Colors.light.deleteButtonBackground },
    circleText: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.light.greenButtonBackground },
    activeCircleText: { color: Colors.light.greenButtonTextColor },
    stepText: { marginTop: 6, fontFamily: Fonts.semibold, fontSize: 12, color: Colors.light.basePriceDiscountedTextColor, textAlign: 'center' },
    activeStepText: { color: Colors.light.greenButtonBackground },
    connector: { position: 'absolute', top: 16, left: '50%', width: '100%', height: 2, backgroundColor: '#c8bd96', zIndex: 1 },
    completedConnector: { backgroundColor: Colors.light.greenButtonBackground },
});
