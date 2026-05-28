import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Platform, StyleSheet, Text, TextInput, View } from "react-native";

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


//#region HELPER FUNCTIONS
function formatDate(dateString: string): string {
    if (!dateString) return "Unknown Date";
    return dateString.split("T")[0];
}

function formatStatus(status: OrderStatus): string {
    if (status === "in-transit") return "In-transit";
    return status.charAt(0).toUpperCase() + status.slice(1);
}
//#endregion


//#region API NAMES
const downloadOrderInvoiceApi = (orderId: string) => `/api/v3/orders/${orderId}/invoice.pdf`;
//#endregion


const ORDER_STATUSES: OrderStatus[] = ["processing", "in-transit", "delivered"];
const DISPLAY_ORDER_STATUSES: OrderStatus[] = ["processing", "in-transit", "delivered", "cancelled", "returned"];
const TERMINAL_DISPLAY_STATUSES: OrderStatus[] = ["cancelled", "returned"];

const statusSortOptions = [
    { label: "Status: Processing First", value: "processing" },
    { label: "Status: In-transit First", value: "in-transit" },
    { label: "Status: Delivered First", value: "delivered" },
    { label: "Status: Cancelled First", value: "cancelled" },
    { label: "Status: Returned First", value: "returned" }
];

export default function ProductManagerOrders() {
    const { token, user } = useAuth();
    const { showToast } = useToast();
    const { navigateWithWipe, revealWipe } = useTransition();

    const [orders, setOrders] = useState<PMOrder[]>([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);
    const [updatingOrders, setUpdatingOrders] = useState<Record<string, boolean>>({});
    const [downloadingInvoices, setDownloadingInvoices] = useState<Record<string, boolean>>({});

    const [orderIdFilter, setOrderIdFilter] = useState("");
    const [customerIdFilter, setCustomerIdFilter] = useState("");
    const [statusSort, setStatusSort] = useState<OrderStatus>("processing");

    const isPM = user?.role === "product_manager";

    //#region API FUNCTIONS
    const fetchOrders = React.useCallback(async () => {
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
        } catch {
            showToast("Network Error", "error");
        } finally {
            setIsLoadingOrders(false);
        }
    }, [showToast, token]);

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
        } catch {
            showToast("Network Error", "error");
        } finally {
            setUpdatingOrders(prev => ({ ...prev, [orderId]: false }));
        }
    };

    const downloadInvoice = async (orderId: string): Promise<void> => {
        if (!token) return;

        if (Platform.OS !== "web") {
            showToast("PDF downloads on mobile require Expo FileSystem. Try this on web!", "info");
            return;
        }

        setDownloadingInvoices(prev => ({ ...prev, [orderId]: true }));

        try {
            const response = await fetch(`${API_BASE_URL}${downloadOrderInvoiceApi(orderId)}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Invoice could not be downloaded");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = `invoice-order-${orderId}.pdf`;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            window.URL.revokeObjectURL(url);

            showToast("Invoice downloaded", "success");
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Failed to download invoice", "error");
            console.error("LOG::ERROR::downloadInvoice", error);
        } finally {
            setDownloadingInvoices(prev => ({ ...prev, [orderId]: false }));
        }
    };
    //#endregion

    //#region FILTERING
    const filteredOrders = useMemo(() => {
        const searchId = orderIdFilter.trim().toLowerCase();
        const searchCustomerId = customerIdFilter.trim().toLowerCase();
        return orders
            .filter(order => {
                const orderMatches = !searchId || order.orderId.toLowerCase().includes(searchId);
                const customerMatches = !searchCustomerId || order.customerId.toLowerCase().includes(searchCustomerId);
                return orderMatches && customerMatches;
            })
            .sort((a, b) => {
                if (a.status === statusSort && b.status !== statusSort) return -1;
                if (b.status === statusSort && a.status !== statusSort) return 1;
                return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime();
            });
    }, [orders, orderIdFilter, customerIdFilter, statusSort]);
    //#endregion

    function clearFiltersButtonFunction(): void {
        setOrderIdFilter("");
        setCustomerIdFilter("");
        setStatusSort("processing");
    }

    function refreshOrdersButtonFunction(): void {
        fetchOrders();
    }

    useFocusEffect(
        useCallback(() => {
            if (!isPM) {
                navigateWithWipe("/");
                return;
            }
            fetchOrders().then(() => revealWipe());
        }, [fetchOrders, isPM, navigateWithWipe, revealWipe])
    );

    if (!isPM) return null;

    //#region RENDER CARD
    const renderOrderCard = ({ item }: { item: PMOrder }) => {
        const activeStatusIndex = DISPLAY_ORDER_STATUSES.indexOf(item.status);
        const isTerminalDisplayStatus = TERMINAL_DISPLAY_STATUSES.includes(item.status);
        const isUpdating = updatingOrders[item.orderId];
        const deliveredItemCount = item.items.filter(orderItem => orderItem.isDelivered).length;

        return (
            <View style={styles.orderCard}>
                <View style={styles.orderCardHeader}>
                    <View>
                        <Text style={styles.orderTitle}>Order #{item.orderId.split('-')[0].toUpperCase()}</Text>
                        <Text style={styles.orderDate}>{formatDate(item.orderDate)}</Text>
                    </View>
                    <View style={styles.statusBadge}>
                        <Text style={styles.statusBadgeText}>{formatStatus(item.status)}</Text>
                    </View>
                </View>

                <View style={styles.detailGrid}>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Customer ID</Text>
                        <Text style={styles.detailValue}>{item.customerId}</Text>
                    </View>

                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Total Items</Text>
                        <Text style={styles.detailValue}>{item.items.length}</Text>
                    </View>

                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Delivered Items</Text>
                        <Text style={styles.detailValue}>{deliveredItemCount}</Text>
                    </View>

                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Order Date</Text>
                        <Text style={styles.detailValue}>{formatDate(item.orderDate)}</Text>
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
                                <Text style={styles.statusStepText}>{formatStatus(status)}</Text>
                                {index < DISPLAY_ORDER_STATUSES.length - 1 && (
                                    <View style={[styles.statusConnector, isCompleted && styles.completedStatusConnector]} />
                                )}
                            </View>
                        );
                    })}
                </View>

                <View style={styles.itemsContainer}>
                    <Text style={styles.sectionTitle}>Order Items</Text>
                    {item.items.map((orderItem) => (
                        <View key={orderItem.orderItemId} style={styles.orderItemContainer}>
                            <View style={styles.orderItemHeader}>
                                <Text style={styles.orderItemTitle}>Item #{orderItem.orderItemId}</Text>
                                <Text style={styles.orderItemDelivered}>{orderItem.isDelivered ? "Delivered" : "Not Delivered"}</Text>
                            </View>
                            <Text style={styles.orderItemText}>Product ID: {orderItem.productId}</Text>
                            <Text style={styles.orderItemText}>Quantity: {orderItem.quantity}</Text>
                        </View>
                    ))}
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

                <Text style={[styles.sectionTitle, styles.invoiceSectionTitle]}>Invoice Actions</Text>
                <View style={styles.invoiceButtonContainer}>
                    <WrappedGeneralButton
                        title={downloadingInvoices[item.orderId] ? "Downloading..." : "Download Invoice"}
                        disabled={updatingOrders[item.orderId] || downloadingInvoices[item.orderId]}
                        wrapperStyles={styles.statusButtonWrapper}
                        textStyles={styles.statusButtonText}
                        onPress={() => downloadInvoice(item.orderId)}
                    />
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

                    <View style={styles.filterInputContainer}>
                        <Text style={styles.filterLabel}>Search Customer ID</Text>
                        <TextInput
                            style={styles.filterInput}
                            value={customerIdFilter}
                            onChangeText={setCustomerIdFilter}
                            placeholder="e.g. user_3a0..."
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

                    <View style={styles.filterButtonContainer}>
                        <WrappedGeneralButton
                            title="Clear Filters"
                            wrapperStyles={styles.filterButtonWrapper}
                            textStyles={styles.filterButtonText}
                            onPress={clearFiltersButtonFunction}
                        />

                        <WrappedGeneralButton
                            title="Refresh"
                            wrapperStyles={styles.filterButtonWrapper}
                            textStyles={styles.filterButtonText}
                            onPress={refreshOrdersButtonFunction}
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
        flexWrap: "wrap",
        gap: 12,
        backgroundColor: Colors.light.softContainerBackground, 
        padding: 15, 
        borderRadius: 8, 
        marginBottom: 20,
        ...(Platform.OS === 'web' ? { zIndex: 100 } : { elevation: 10 }) 
    },
    filterInputContainer: { flex: 1, minWidth: 230, zIndex: 1 },
    sortContainer: { flex: 1, minWidth: 220, zIndex: 999 },
    filterButtonContainer: {
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 10,
    },
    filterButtonWrapper: {
        minWidth: 120,
        alignItems: "center",
        backgroundColor: Colors.light.greenButtonBackground,
        borderRadius: 8,
        paddingVertical: 11,
        paddingHorizontal: 14,
    },
    filterButtonText: {
        fontFamily: Fonts.semibold,
        fontSize: 14,
        color: Colors.light.greenButtonTextColor,
    },
    filterLabel: { fontFamily: Fonts.semibold, fontSize: 13, color: Colors.light.greenButtonBackground, marginBottom: 6 },
    filterInput: { height: 42, borderWidth: 1, borderColor: "#c8bd96", borderRadius: 8, paddingHorizontal: 12, backgroundColor: "#fff", fontFamily: Fonts.regular },

    /* ORDER CARD */
    orderCard: { backgroundColor: Colors.light.softContainerBackground, borderRadius: 8, padding: 20, marginBottom: 16 },
    orderCardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 15 },
    orderTitle: { fontFamily: Fonts.bold, fontSize: 20, color: Colors.light.greenButtonBackground },
    orderDate: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.light.basePriceDiscountedTextColor, marginTop: 4 },
    statusBadge: { backgroundColor: Colors.light.greenButtonBackground, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, alignSelf: 'flex-start' },
    statusBadgeText: { fontFamily: Fonts.semibold, color: '#fff', fontSize: 12 },
    detailGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 12 },
    detailItem: { flex: 1, minWidth: 210, backgroundColor: "#fff", borderRadius: 8, padding: 12 },
    detailValue: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.light.mainTextColor },
    
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
    invoiceSectionTitle: { marginTop: 12 },
    itemsContainer: { marginTop: 4, marginBottom: 12 },
    orderItemContainer: { backgroundColor: "#fff", borderRadius: 8, padding: 12, marginBottom: 10 },
    orderItemHeader: { flexDirection: "row", justifyContent: "space-between", gap: 10, marginBottom: 8 },
    orderItemTitle: { flex: 1, fontFamily: Fonts.semibold, fontSize: 14, color: Colors.light.greenButtonBackground },
    orderItemDelivered: { fontFamily: Fonts.semibold, fontSize: 13, color: Colors.light.currentPriceTextColor },
    orderItemText: { marginBottom: 4, fontFamily: Fonts.regular, fontSize: 13, color: Colors.light.mainTextColor },
    statusButtonContainer: { 
        flexDirection: "row", 
        flexWrap: "wrap", 
        gap: 15 
    },
    invoiceButtonContainer: {
        marginTop: 4,
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