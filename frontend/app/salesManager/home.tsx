//#region IMPORTS
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import Navbar from "@/components/Navbar/Navbar";

import { Colors, Fonts } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useTransition } from "@/context/TransitionContext";
import { useUser } from "@/context/UserContext";
import GeneralButton from "@/components/Buttons/GeneralButton/GeneralButton";
//#endregion


export default function SalesManagerHome() {
    const { isLoading, user: authUser } = useAuth();
    const { user, isLoadingUser } = useUser();
    const { showToast } = useToast();
    const { navigateWithWipe, revealWipe } = useTransition();

    const [hasHandledAccess, setHasHandledAccess] = useState(false);

    const activeUser = user ?? authUser;
    const userRole = activeUser?.role ?? "guest";
    const userName = activeUser?.name ?? "";
    const isSalesManager = userRole === "sales_manager";

    useFocusEffect(
        useCallback(() => {
            setHasHandledAccess(false);

            if (isLoading || isLoadingUser) return;

            if (!isSalesManager) {
                setHasHandledAccess(true);
                navigateWithWipe("/", () => {showToast(`Invalid Route For ${userRole}`, "error");});
                return;
            }

            setHasHandledAccess(true);
            revealWipe();
        }, [isLoading, isLoadingUser, isSalesManager, userRole, showToast, navigateWithWipe, revealWipe])
    );

    function onStatisticsPress() 
    {
        navigateWithWipe('/salesManager/statistics');
    }

    function onProductsPress()
    {
        navigateWithWipe('/salesManager/products');
    }

    function onOrdersPress() 
    {
        navigateWithWipe('/salesManager/orders');
    }

    const isPageReady: boolean = !isLoading && !isLoadingUser && hasHandledAccess && isSalesManager;

    return (
        <View style={styles.mainContainer}>
            <Navbar />

            <View style={styles.contentContainer}>
                {isPageReady ? (
                    <View>
                        <Text style={styles.welcomeText}>Welcome, Sales Manager {userName}</Text>
                        <View style={styles.buttonsContainer}>
                            <GeneralButton title="Statistics" onPress={onStatisticsPress} />
                            <GeneralButton title="Products" onPress={onProductsPress} />
                            <GeneralButton title="Orders" onPress={onOrdersPress} />
                        </View>
                    </View>
                ) : (
                    <ActivityIndicator size="large" color={Colors.light.mainTextColor} />
                )}
            </View>
        </View>
    );
}

//#region STYLES
const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: Colors.light.salesManagerBackground,
    },
    contentContainer: {
        flex: 1,
        marginTop: '15%',
        alignItems: "center",
        padding: 20,
    },
    welcomeText: {
        fontFamily: Fonts.semibold,
        fontSize: 28,
        color: Colors.light.mainTextColor,
        textAlign: "center",
    },
    buttonsContainer: {
        marginTop: 10,
        flexDirection: "row",
        justifyContent: "center",
        gap: 40,
    }
});
//#endregion

