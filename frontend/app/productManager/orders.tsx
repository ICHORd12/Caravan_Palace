import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, View, Platform } from "react-native";

import Navbar from "@/components/Navbar/Navbar";
import SortDropdown from "@/components/DropDowns/SortDropdown/SortDropdown";
import WrappedGeneralButton from "@/components/Buttons/GeneralButtonWithWrapper/GeneralButtonWithWrapper";

import { API_BASE_URL, PM_ORDERS_ENDPOINT } from "@/constants/API"; 
import { Colors, Fonts } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useTransition } from "@/context/TransitionContext";

//#region TYPES 
type OrderStatus = "processing" | "pending" | "in-transit" | "delivered" | "cancelled" | "returned";

interface PMOrderItem {
    orderItemId: string;
    productId: string;
    quantity: number;
    isDelivered: boolean;
}

interface PMOrder {
    orderId: string;
    customerId: string;
    status: OrderStatus;
    deliveryAddress: string;
    orderDate: string;
    items: PMOrderItem[];
}
//#endregion


const ORDER_STATUSES: OrderStatus[] = ["processing", "in-transit", "delivered"];
const DISPLAY_ORDER_STATUSES: OrderStatus[] = ["processing", "in-transit", "delivered", "cancelled", "returned"];
const TERMINAL_DISPLAY_STATUSES: OrderStatus[] = ["cancelled", "returned"];

const statusSortOptions = [
    { label: "Status: Processing First", value: "processing" },
    { label: "Status: In-transit First", value: "in-transit" },
    { label: "Status: Delivered First", value: "delivered" }
];

export default function ProductManagerOrders() {
    const { token, user } = useAuth();
    const { showToast } = useToast();
    const { navigateWithWipe, revealWipe } = useTransition();

    const [orders, setOrders] = useState<PMOrder[]>([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);
    const [updatingOrders, setUpdatingOrders] = useState<Record<string, boolean>>({});

    const [orderIdFilter, setOrderIdFilter] = useState("");
    const [statusSort, setStatusSort] = useState<OrderStatus>("processing");

    const isPM = user?.role === "product_manager";

    //#region API FUNCTIONS
    const fetchOrders = async () => {
        if (!token) return;
        setIsLoadingOrders(true);
        try {
            const response = await fetch(`${API_BASE_URL}${PM_ORDERS_ENDPOINT}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setOrders(data.orders || []);
            } else {
                showToast(data.message || "Failed to fetch orders", "error");
            }
        } catch (error) {
            showToast("Network Error", "error");
        } finally {
            setIsLoadingOrders(false);
        }
    };

    const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
        if (!token) return;
        setUpdatingOrders(prev => ({ ...prev, [orderId]: true }));
        try {
            const payloadStatus = status === "pending" ? "processing" : status;
            const response = await fetch(`${API_BASE_URL}${PM_ORDERS_ENDPOINT}/${orderId}/status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ status: payloadStatus }),
            });

            if (response.ok) {
                setOrders(prevOrders => prevOrders.map(order =>
                    order.orderId === orderId ? { ...order, status: payloadStatus } : order
                ));
                showToast(`Order transitioned to ${payloadStatus.toUpperCase()}`, "success");
            } else {
                const data = await response.json();
                showToast(data.message || "Status update failed", "error");
            }
        } catch (error) {
            showToast("Network Error", "error");
        } finally {
            setUpdatingOrders(prev => ({ ...prev, [orderId]: false }));
        }
    };
    //#endregion

    //#region FILTERING
    const filteredOrders = useMemo(() => {
        const searchId = orderIdFilter.trim().toLowerCase();
        return orders
            .filter(order => !searchId || order.orderId.toLowerCase().includes(searchId))
            .sort((a, b) => {
                if (a.status === statusSort && b.status !== statusSort) return -1;
                if (b.status === statusSort && a.status !== statusSort) return 1;
                return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime();
            });
    }, [orders, orderIdFilter, statusSort]);
    //#endregion

    useFocusEffect(
        useCallback(() => {
            if (!isPM) {
                navigateWithWipe("/");
                return;
            }
            fetchOrders().then(() => revealWipe());
        }, [isPM])
    );

    if (!isPM) return null;

    //#region RENDER CARD
    const renderOrderCard = ({ item }: { item: PMOrder }) => {
        const activeStatusIndex = DISPLAY_ORDER_STATUSES.indexOf(item.status);
        const isTerminalDisplayStatus = TERMINAL_DISPLAY_STATUSES.includes(item.status);
        const isUpdating = updatingOrders[item.orderId];

        return (
            <View style={styles.orderCard}>
                <View style={styles.orderCardHeader}>
                    <View>
                        <Text style={styles.orderTitle}>Order #{item.orderId.split('-')[0].toUpperCase()}</Text>
                        <Text style={styles.orderDate}>{item.orderDate.split('T')[0]}</Text>
                    </View>
                    <View style={styles.statusBadge}>
                        <Text style={styles.statusBadgeText}>{item.status.toUpperCase()}</Text>
                    </View>
                </View>

                <View style={styles.addressContainer}>
                    <Text style={styles.detailLabel}>Destination Address</Text>
                    <Text style={styles.addressText}>{item.deliveryAddress}</Text>
                </View>

                {/* Status Timeline */}
                <View style={styles.statusTimelineContainer}>
                    {DISPLAY_ORDER_STATUSES.map((status, index) => {
                        const isActive = item.status === status;
                        const isCompleted = activeStatusIndex >= index && !isTerminalDisplayStatus;
                        return (
                            <View key={status} style={styles.statusStepContainer}>
                                <View style={[
                                    styles.statusCircle,
                                    isCompleted && styles.completedStatusCircle,
                                    isActive && styles.activeStatusCircle
                                ]}>
                                    <Text style={[styles.statusCircleText, (isCompleted || isActive) && { color: '#fff' }]}>{index + 1}</Text>
                                </View>
                                <Text style={styles.statusStepText}>{status.toUpperCase()}</Text>
                                {index < DISPLAY_ORDER_STATUSES.length - 1 && (
                                    <View style={[styles.statusConnector, isCompleted && styles.completedStatusConnector]} />
                                )}
                            </View>
                        );
                    })}
                </View>

               
                <Text style={styles.sectionTitle}>Fulfillment Actions</Text>
                <View style={styles.statusButtonContainer}>
                    {ORDER_STATUSES.map((status) => (
                        <WrappedGeneralButton
                            key={status}
                            title={`${status.toUpperCase()}`}
                            disabled={isUpdating || item.status === status || TERMINAL_DISPLAY_STATUSES.includes(item.status)}
                            wrapperStyles={[styles.statusButtonWrapper, item.status === status && styles.currentStatusButtonWrapper]}
                            textStyles={styles.statusButtonText}
                            onPress={() => updateOrderStatus(item.orderId, status)}
                        />
                    ))}
                </View>
            </View>
        );
    };
    //#endregion

    return (
        <View style={styles.mainContainer}>
            <Navbar />
            <View style={styles.contentContainer}>
                <Text style={styles.pageTitle}>Logistics & Fulfillment</Text>

                <View style={styles.filterContainer}>
                    <View style={styles.filterInputContainer}>
                        <Text style={styles.filterLabel}>Search Order ID</Text>
                        <TextInput
                            style={styles.filterInput}
                            value={orderIdFilter}
                            onChangeText={setOrderIdFilter}
                            placeholder="e.g. 7e8f8f62..."
                        />
                    </View>
                    
                    {/* The Z-Index wrapper for the dropdown menu */}
                    <View style={styles.sortContainer}>
                        <Text style={styles.filterLabel}>Priority Sort</Text>
                        <SortDropdown
                            options={statusSortOptions}
                            selectedValue={statusSort}
                            onChange={(val) => setStatusSort(val as OrderStatus)}
                            containerStyle={{ width: '100%', zIndex: 999 }}
                            triggerStyle={styles.filterInput}
                        />
                    </View>
                </View>

                {isLoadingOrders ? (
                    <ActivityIndicator size="large" color={Colors.light.greenButtonBackground} style={{ marginTop: 50 }} />
                ) : (
                    <FlatList
                        data={filteredOrders}
                        keyExtractor={(item) => item.orderId}
                        renderItem={renderOrderCard}
                        contentContainerStyle={{ paddingBottom: 30 }}
                        showsVerticalScrollIndicator={false}
                        // This prevents the FlatList from trapping the dropdown menu behind it
                        style={{ zIndex: 1 }}
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: Colors.light.salesManagerBackground },
    contentContainer: { flex: 1, width: "100%", maxWidth: 1100, alignSelf: "center", padding: 20 },
    pageTitle: { marginBottom: 20, fontFamily: Fonts.bold, fontSize: 28, color: Colors.light.greenButtonBackground },
    
    
    filterContainer: { 
        flexDirection: "row", 
        gap: 15, 
        backgroundColor: Colors.light.softContainerBackground, 
        padding: 15, 
        borderRadius: 8, 
        marginBottom: 20,
        ...(Platform.OS === 'web' ? { zIndex: 100 } : { elevation: 10 }) 
    },
    filterInputContainer: { flex: 2, zIndex: 1 },
    sortContainer: { flex: 1, zIndex: 999 },
    filterLabel: { fontFamily: Fonts.semibold, fontSize: 13, color: Colors.light.greenButtonBackground, marginBottom: 6 },
    filterInput: { height: 42, borderWidth: 1, borderColor: "#c8bd96", borderRadius: 8, paddingHorizontal: 12, backgroundColor: "#fff", fontFamily: Fonts.regular },

    /* ORDER CARD */
    orderCard: { backgroundColor: Colors.light.softContainerBackground, borderRadius: 8, padding: 20, marginBottom: 16 },
    orderCardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 15 },
    orderTitle: { fontFamily: Fonts.bold, fontSize: 20, color: Colors.light.greenButtonBackground },
    orderDate: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.light.basePriceDiscountedTextColor, marginTop: 4 },
    statusBadge: { backgroundColor: Colors.light.greenButtonBackground, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, alignSelf: 'flex-start' },
    statusBadgeText: { fontFamily: Fonts.semibold, color: '#fff', fontSize: 12 },
    
    addressContainer: { backgroundColor: "#fff", padding: 15, borderRadius: 8, marginBottom: 20 },
    detailLabel: { fontFamily: Fonts.semibold, fontSize: 12, color: Colors.light.basePriceDiscountedTextColor, marginBottom: 4 },
    addressText: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.light.mainTextColor },

    /* TIMELINE */
    statusTimelineContainer: { flexDirection: "row", alignItems: "flex-start", marginBottom: 25 },
    statusStepContainer: { flex: 1, alignItems: "center", position: "relative" },
    statusCircle: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: Colors.light.greenButtonBackground, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", zIndex: 2 },
    completedStatusCircle: { backgroundColor: Colors.light.greenButtonBackground },
    activeStatusCircle: { backgroundColor: "#a94c0f", borderColor: "#a94c0f" },
    statusCircleText: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.light.greenButtonBackground },
    statusStepText: { marginTop: 6, fontFamily: Fonts.semibold, fontSize: 10, color: Colors.light.basePriceDiscountedTextColor, textAlign: "center" },
    statusConnector: { position: "absolute", top: 16, left: "50%", width: "100%", height: 2, backgroundColor: "#c8bd96", zIndex: 1 },
    completedStatusConnector: { backgroundColor: Colors.light.greenButtonBackground },

    /* BUTTONS (UPDATED FOR BETTER UI) */
    sectionTitle: { fontFamily: Fonts.bold, fontSize: 16, color: Colors.light.greenButtonBackground, marginBottom: 10 },
    statusButtonContainer: { 
        flexDirection: "row", 
        flexWrap: "wrap", 
        gap: 15 
    },
    statusButtonWrapper: { 
        flex: 1, 
        minWidth: 150, 
        minHeight: 48,
        alignItems: "center", 
        justifyContent: "center",
        backgroundColor: Colors.light.greenButtonBackground, 
        borderRadius: 8, 
        paddingVertical: 14 
    },
    currentStatusButtonWrapper: { backgroundColor: "#a94c0f" },
    statusButtonText: { 
        fontFamily: Fonts.bold, 
        fontSize: 14, 
        color: '#fff',
        letterSpacing: 0.5
    }
});