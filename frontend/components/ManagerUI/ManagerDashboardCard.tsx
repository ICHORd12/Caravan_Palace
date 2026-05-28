import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Colors, Fonts } from "@/constants/theme";

type ManagerDashboardCardProps = {
    title: string;
    description: string;
    icon: string;
    onPress: () => void;
};

export default function ManagerDashboardCard({
    title,
    description,
    icon,
    onPress,
}: ManagerDashboardCardProps) {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <Text style={styles.cardIcon}>{icon}</Text>
            <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>{title}</Text>
                <Text style={styles.cardDescription}>{description}</Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        width: "48%",
        minWidth: 280,
        backgroundColor: Colors.light.softContainerBackground,
        borderRadius: 12,
        paddingVertical: 22,
        paddingHorizontal: 20,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#d4c99f",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 5,
        elevation: 2,
    },
    cardIcon: {
        fontSize: 34,
        marginRight: 16,
    },
    cardTextContainer: {
        flex: 1,
    },
    cardTitle: {
        fontFamily: Fonts.bold,
        fontSize: 20,
        color: Colors.light.greenButtonBackground,
        marginBottom: 6,
    },
    cardDescription: {
        fontFamily: Fonts.regular,
        fontSize: 14,
        lineHeight: 20,
        color: Colors.light.mainTextColor,
    },
});
