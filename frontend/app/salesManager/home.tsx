//#region IMPORTS
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import Navbar from "@/components/Navbar/Navbar";
import ManagerDashboardCard from "@/components/ManagerUI/ManagerDashboardCard";

import { Colors, Fonts } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useTransition } from "@/context/TransitionContext";
import { useUser } from "@/context/UserContext";
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

    function onRefundsPress()
    {
        navigateWithWipe('/salesManager/refunds');
    }

    const isPageReady: boolean = !isLoading && !isLoadingUser && hasHandledAccess && isSalesManager;

    return (
        <View style={styles.mainContainer}>
            <Navbar />

            <View style={styles.contentContainer}>
                {isPageReady ? (
                    <View>
                        <View style={styles.header}>
                            <Text style={styles.welcomeText}>Welcome, Sales Manager {userName}</Text>
                            <Text style={styles.subHeader}>Revenue, order, and pricing control center</Text>
                        </View>

                        <View style={styles.buttonsContainer}>
                            <ManagerDashboardCard
                                icon="📈"
                                title="Statistics"
                                description="Track monthly performance, refund losses, and profit indicators."
                                onPress={onStatisticsPress}
                            />
                            <ManagerDashboardCard
                                icon="🏷️"
                                title="Products"
                                description="Adjust base prices and discounts with advanced filtering."
                                onPress={onProductsPress}
                            />
                            <ManagerDashboardCard
                                icon="📦"
                                title="Orders"
                                description="Inspect order details and issue invoice documents quickly."
                                onPress={onOrdersPress}
                            />
                            <ManagerDashboardCard
                                icon="↩️"
                                title="Refunds"
                                description="Review and process refund requests in grouped or detailed views."
                                onPress={onRefundsPress}
                            />
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
        maxWidth: 1100,
        width: "100%",
        alignSelf: "center",
        padding: 20,
    },
    header: {
        marginTop: 24,
        marginBottom: 26,
    },
    welcomeText: {
        fontFamily: Fonts.bold,
        fontSize: 30,
        color: Colors.light.greenButtonBackground,
    },
    subHeader: {
        marginTop: 8,
        fontFamily: Fonts.semibold,
        fontSize: 17,
        color: Colors.light.mainTextColor,
    },
    buttonsContainer: {
        marginTop: 8,
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        gap: 16,
    }
});
//#endregion

