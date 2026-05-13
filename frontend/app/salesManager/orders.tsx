//#region IMPORTS
import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import Navbar from "@/components/Navbar/Navbar";
import SortDropdown from "@/components/DropDowns/SortDropdown/SortDropdown";
import WrappedGeneralButton from "@/components/Buttons/GeneralButtonWithWrapper/GeneralButtonWithWrapper";

import { API_BASE_URL, SALES_MANAGER_ORDERS_ENDPOINT } from "@/constants/API";
import { Colors, Fonts } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useTransition } from "@/context/TransitionContext";
import { useUser } from "@/context/UserContext";
//#endregion


//#region MOCK API NAMES
const getOrdersApi = "/api/v3/orders";
const updateOrderStatusApi = (orderId: string) => `/api/v3/orders/${orderId}/status`;
//#endregion


//#region TYPES
type OrderStatus = "pending" | "in-transit" | "delivered" | "cancelled";

interface SalesManagerOrderItem {
    orderItemId: string;
    orderId: string;
    productId: string;
    quantity: number;
    purchasedPrice: number;
    isDelivered: boolean;
}

interface SalesManagerOrder {
    orderId: string;
    customerId: string;
    cardLast4: string;
    totalPrice: number;
    invoiceNumber: string;
    status: OrderStatus;
    deliveryAddress: string;
    orderDate: string;
    items: SalesManagerOrderItem[];
}

interface GetOrdersResponse {
    message: string;
    orders: SalesManagerOrder[];
}

interface SalesManagerOrderCardProps {
    order: SalesManagerOrder;
    isUpdating: boolean;
    onStatusChange: (orderId: string, status: OrderStatus) => void;
}
//#endregion


//#region LOCAL CONSTANTS
const ORDER_STATUSES: OrderStatus[] = ["pending", "in-transit", "delivered", "cancelled"];

const statusSortOptions = [
    { label: "Status: Pending First", value: "pending" },
    { label: "Status: In-transit First", value: "in-transit" },
    { label: "Status: Delivered First", value: "delivered" },
    { label: "Status: Cancelled First", value: "cancelled" },
];
//#endregion


//#region HELPER FUNCTIONS
function formatDate(dateString: string): string 
{
    if (!dateString) return "Unknown Date";

    return dateString.split("T")[0];
}

function formatCurrency(value: number): string 
{
    return `$${Number(value || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

function formatStatus(status: OrderStatus): string 
{
    if (status === "in-transit") return "In-transit";
    return status.charAt(0).toUpperCase() + status.slice(1);
}

function getStatusSortRank(status: OrderStatus, selectedStatus: string): number 
{
    if (status === selectedStatus) return 0;
    return ORDER_STATUSES.indexOf(status) + 1;
}

async function readResponseJson<T>(response: Response): Promise<T | null> 
{
    try {
        return await response.json();
    } catch {
        return null;
    }
}
//#endregion


//#region ORDER CARD COMPONENT
function SalesManagerOrderCard({ order, isUpdating, onStatusChange }: SalesManagerOrderCardProps) 
{
    const activeStatusIndex = ORDER_STATUSES.indexOf(order.status);

    return (
        <View style={styles.orderCard}>
            <View style={styles.orderCardHeader}>
                <View style={styles.orderTitleContainer}>
                    <Text style={styles.orderTitle}>Order #{order.orderId}</Text>
                    <Text style={styles.orderDate}>{formatDate(order.orderDate)}</Text>
                </View>

                <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>{formatStatus(order.status)}</Text>
                </View>
            </View>

            <View style={styles.detailGrid}>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Customer ID</Text>
                    <Text style={styles.detailValue}>{order.customerId}</Text>
                </View>

                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Card Last 4</Text>
                    <Text style={styles.detailValue}>{order.cardLast4}</Text>
                </View>

                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Invoice Number</Text>
                    <Text style={styles.detailValue}>{order.invoiceNumber}</Text>
                </View>

                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Total Price</Text>
                    <Text style={styles.detailValue}>{formatCurrency(order.totalPrice)}</Text>
                </View>
            </View>

            <View style={styles.addressContainer}>
                <Text style={styles.detailLabel}>Delivery Address</Text>
                <Text style={styles.addressText}>{order.deliveryAddress}</Text>
            </View>

            <View style={styles.statusTimelineContainer}>
                {ORDER_STATUSES.map((status, index) => {
                    const isActive = order.status === status;
                    const isCompleted = activeStatusIndex >= index && order.status !== "cancelled";

                    return (
                        <View key={status} style={styles.statusStepContainer}>
                            <Pressable
                                disabled={isUpdating || isActive}
                                onPress={() => onStatusChange(order.orderId, status)}
                                style={[
                                    styles.statusCircle,
                                    isCompleted && styles.completedStatusCircle,
                                    isActive && styles.activeStatusCircle,
                                    status === "cancelled" && isActive && styles.cancelledStatusCircle,
                                    isUpdating && styles.disabledStatusCircle,
                                ]}
                            >
                                <Text style={[styles.statusCircleText, (isCompleted || isActive) && styles.activeStatusCircleText]}>
                                    {index + 1}
                                </Text>
                            </Pressable>

                            <Text style={[styles.statusStepText, isActive && styles.activeStatusStepText]}>
                                {formatStatus(status)}
                            </Text>

                            {index < ORDER_STATUSES.length - 1 && (
                                <View style={[styles.statusConnector, activeStatusIndex > index && order.status !== "cancelled" && styles.completedStatusConnector]} />
                            )}
                        </View>
                    );
                })}
            </View>

            <View style={styles.itemsContainer}>
                <Text style={styles.sectionTitle}>Order Items</Text>

                {order.items.map((item) => (
                    <View key={item.orderItemId} style={styles.orderItemContainer}>
                        <View style={styles.orderItemHeader}>
                            <Text style={styles.orderItemTitle}>Item #{item.orderItemId}</Text>
                            <Text style={styles.orderItemDelivered}>{item.isDelivered ? "Delivered" : "Not Delivered"}</Text>
                        </View>

                        <Text style={styles.orderItemText}>Order ID: {item.orderId}</Text>
                        <Text style={styles.orderItemText}>Product ID: {item.productId}</Text>
                        <Text style={styles.orderItemText}>Quantity: {item.quantity}</Text>
                        <Text style={styles.orderItemText}>Purchased Price: {formatCurrency(item.purchasedPrice)}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.statusButtonContainer}>
                {ORDER_STATUSES.map((status) => (
                    <WrappedGeneralButton
                        key={status}
                        title={formatStatus(status)}
                        disabled={isUpdating || order.status === status}
                        wrapperStyles={[
                            styles.statusButtonWrapper,
                            order.status === status && styles.currentStatusButtonWrapper,
                            status === "cancelled" && styles.cancelStatusButtonWrapper,
                        ]}
                        textStyles={styles.statusButtonText}
                        onPress={() => onStatusChange(order.orderId, status)}
                    />
                ))}
            </View>
        </View>
    );
}
//#endregion


export default function SalesManagerOrders() {
    const { isLoading, token, user: authUser } = useAuth();
    const { user, isLoadingUser } = useUser();
    const { showToast } = useToast();
    const { navigateWithWipe, revealWipe } = useTransition();

    const [orders, setOrders] = useState<SalesManagerOrder[]>([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);
    const [hasHandledAccess, setHasHandledAccess] = useState(false);
    const [updatingOrders, setUpdatingOrders] = useState<Record<string, boolean>>({});

    const [dateFilter, setDateFilter] = useState("");
    const [customerIdFilter, setCustomerIdFilter] = useState("");
    const [orderIdFilter, setOrderIdFilter] = useState("");
    const [statusSort, setStatusSort] = useState<OrderStatus>("pending");

    const activeUser = user ?? authUser;
    const userRole = activeUser?.role ?? "guest";
    const isSalesManager = userRole === "sales_manager";

    //#region API FUNCTIONS
    async function fetchOrders(): Promise<void> 
    {
        if (!token) return;

        setIsLoadingOrders(true);

        try {
            const response = await fetch(`${API_BASE_URL}${SALES_MANAGER_ORDERS_ENDPOINT}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            });

            const responseData = await readResponseJson<GetOrdersResponse>(response);

            if (response.ok) 
            {
                setOrders(responseData?.orders || []);
            }
            else 
            {   
                showToast(responseData?.message || "Orders could not be fetched", "error");
            }

        } catch (error) {
            showToast("Something went wrong while fetching orders", "error");
            console.error("LOG::ERROR::fetchOrders", error);
        } finally {
            setIsLoadingOrders(false);
        }
    }

    async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
        if (!token) return;

        setUpdatingOrders(prev => ({ ...prev, [orderId]: true }));

        try {
            const response = await fetch(`${API_BASE_URL}${updateOrderStatusApi(orderId)}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ status }),
            });

            const responseData = await readResponseJson<{ message?: string }>(response);

            if (response.ok) 
            {
                setOrders(prevOrders =>
                    prevOrders.map(order =>
                        order.orderId === orderId ? { ...order, status } : order
                    )
                );
                showToast(`Order status changed to ${formatStatus(status)}`, "success");
            }
            else 
            {
                showToast(responseData?.message || "Order status could not be updated", "error");
            }
            
        } catch (error) {
            showToast("Something went wrong while updating order status", "error");
            console.error("LOG::ERROR::updateOrderStatus", error);
        } finally {
            setUpdatingOrders(prev => ({ ...prev, [orderId]: false }));
        }
    }
    //#endregion

    //#region BUTTON FUNCTIONS
    function clearFiltersButtonFunction(): void {
        setDateFilter("");
        setCustomerIdFilter("");
        setOrderIdFilter("");
        setStatusSort("pending");
    }

    function refreshOrdersButtonFunction(): void {
        fetchOrders();
    }
    //#endregion

    //#region FILTER AND SORT
    const filteredOrders = useMemo(() => {
        const normalizedDateFilter = dateFilter.trim().toLowerCase();
        const normalizedCustomerIdFilter = customerIdFilter.trim().toLowerCase();
        const normalizedOrderIdFilter = orderIdFilter.trim().toLowerCase();

        return orders
            .filter(order => {
                const orderDate = formatDate(order.orderDate).toLowerCase();
                const customerId = order.customerId.toLowerCase();
                const orderId = order.orderId.toLowerCase();

                return (
                    (!normalizedDateFilter || orderDate.includes(normalizedDateFilter)) &&
                    (!normalizedCustomerIdFilter || customerId.includes(normalizedCustomerIdFilter)) &&
                    (!normalizedOrderIdFilter || orderId.includes(normalizedOrderIdFilter))
                );
            })
            .sort((firstOrder, secondOrder) => {
                const statusDifference = getStatusSortRank(firstOrder.status, statusSort) - getStatusSortRank(secondOrder.status, statusSort);

                if (statusDifference !== 0) return statusDifference;

                return new Date(secondOrder.orderDate).getTime() - new Date(firstOrder.orderDate).getTime();
            });
    }, [orders, dateFilter, customerIdFilter, orderIdFilter, statusSort]);
    //#endregion

    //#region LIFE CYCLE
    useFocusEffect(
        useCallback(() => {
            setHasHandledAccess(false);

            if (isLoading || isLoadingUser) return;

            if (!isSalesManager) {
                setHasHandledAccess(true);
                showToast(`Invalid Route For ${userRole}`, "error");
                navigateWithWipe("/");
                return;
            }

            setHasHandledAccess(true);
            fetchOrders();
        }, [isLoading, isLoadingUser, isSalesManager, userRole, token])
    );

    useFocusEffect(
        useCallback(() => {
            if (hasHandledAccess && isSalesManager && !isLoadingOrders) {
                revealWipe();
            }
        }, [hasHandledAccess, isSalesManager, isLoadingOrders, revealWipe])
    );
    //#endregion

    if (isLoading || isLoadingUser || !hasHandledAccess || !isSalesManager) {
        return null;
    }

    return (
        <View style={styles.mainContainer}>
            <Navbar />

            <View style={styles.contentContainer}>
                <Text style={styles.pageTitle}>Sales Manager Orders</Text>

                <View style={styles.filterContainer}>
                    <View style={styles.filterInputContainer}>
                        <Text style={styles.filterLabel}>Date</Text>
                        <TextInput
                            style={styles.filterInput}
                            value={dateFilter}
                            onChangeText={setDateFilter}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor="#a09a80"
                        />
                    </View>

                    <View style={styles.filterInputContainer}>
                        <Text style={styles.filterLabel}>Customer ID</Text>
                        <TextInput
                            style={styles.filterInput}
                            value={customerIdFilter}
                            onChangeText={setCustomerIdFilter}
                            placeholder="Customer ID"
                            placeholderTextColor="#a09a80"
                        />
                    </View>

                    <View style={styles.filterInputContainer}>
                        <Text style={styles.filterLabel}>Order ID</Text>
                        <TextInput
                            style={styles.filterInput}
                            value={orderIdFilter}
                            onChangeText={setOrderIdFilter}
                            placeholder="Order ID"
                            placeholderTextColor="#a09a80"
                        />
                    </View>

                    <View style={styles.sortContainer}>
                        <Text style={styles.filterLabel}>Sort</Text>
                        <SortDropdown
                            options={statusSortOptions}
                            selectedValue={statusSort}
                            onChange={(newStatus) => setStatusSort(newStatus as OrderStatus)}
                            containerStyle={styles.sortDropdownContainer}
                            triggerStyle={styles.sortDropdownTrigger}
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
                            disabled={isLoadingOrders}
                            onPress={refreshOrdersButtonFunction}
                        />
                    </View>
                </View>

                {isLoadingOrders ? (
                    <ActivityIndicator size="large" color={Colors.light.greenButtonBackground} style={styles.loadingIndicator} />
                ) : filteredOrders.length === 0 ? (
                    <Text style={styles.emptyOrdersText}>No orders match your filters.</Text>
                ) : (
                    <FlatList
                        data={filteredOrders}
                        keyExtractor={(item) => item.orderId}
                        renderItem={({ item }) => (
                            <SalesManagerOrderCard
                                order={item}
                                isUpdating={!!updatingOrders[item.orderId]}
                                onStatusChange={updateOrderStatus}
                            />
                        )}
                        contentContainerStyle={styles.listContainer}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>
        </View>
    );
}


//#region STYLES
const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: Colors.light.mainBackground,
    },
    contentContainer: {
        flex: 1,
        width: "100%",
        maxWidth: 1100,
        alignSelf: "center",
        padding: 20,
    },
    pageTitle: {
        marginBottom: 20,
        fontFamily: Fonts.bold,
        fontSize: 28,
        color: Colors.light.greenButtonBackground,
    },

    /* FILTERS */
    filterContainer: {
        zIndex: 10,
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        backgroundColor: Colors.light.softContainerBackground,
        borderRadius: 8,
        padding: 14,
        marginBottom: 18,
    },
    filterInputContainer: {
        flex: 1,
        minWidth: 190,
    },
    filterLabel: {
        marginBottom: 6,
        fontFamily: Fonts.semibold,
        fontSize: 13,
        color: Colors.light.greenButtonBackground,
    },
    filterInput: {
        height: 42,
        borderWidth: 1,
        borderColor: "#c8bd96",
        borderRadius: 8,
        paddingHorizontal: 12,
        backgroundColor: "#ffffff",
        fontFamily: Fonts.regular,
        fontSize: 14,
        color: Colors.light.mainTextColor,
    },
    sortContainer: {
        flex: 1,
        minWidth: 220,
        zIndex: 20,
    },
    sortDropdownContainer: {
        width: "100%",
    },
    sortDropdownTrigger: {
        height: 42,
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#c8bd96",
    },
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

    /* LIST */
    loadingIndicator: {
        marginTop: 50,
    },
    emptyOrdersText: {
        marginTop: 40,
        textAlign: "center",
        fontFamily: Fonts.semibold,
        fontSize: 16,
        color: Colors.light.greenButtonBackground,
    },
    listContainer: {
        paddingBottom: 30,
    },

    /* ORDER CARD */
    orderCard: {
        backgroundColor: Colors.light.softContainerBackground,
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
    },
    orderCardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 14,
    },
    orderTitleContainer: {
        flex: 1,
    },
    orderTitle: {
        fontFamily: Fonts.bold,
        fontSize: 18,
        color: Colors.light.greenButtonBackground,
    },
    orderDate: {
        marginTop: 4,
        fontFamily: Fonts.regular,
        fontSize: 13,
        color: Colors.light.basePriceDiscountedTextColor,
    },
    statusBadge: {
        alignSelf: "flex-start",
        backgroundColor: Colors.light.greenButtonBackground,
        borderRadius: 8,
        paddingVertical: 6,
        paddingHorizontal: 12,
    },
    statusBadgeText: {
        fontFamily: Fonts.semibold,
        fontSize: 13,
        color: Colors.light.greenButtonTextColor,
    },
    detailGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    detailItem: {
        flex: 1,
        minWidth: 210,
        backgroundColor: "#ffffff",
        borderRadius: 8,
        padding: 12,
    },
    detailLabel: {
        marginBottom: 4,
        fontFamily: Fonts.semibold,
        fontSize: 12,
        color: Colors.light.basePriceDiscountedTextColor,
    },
    detailValue: {
        fontFamily: Fonts.bold,
        fontSize: 14,
        color: Colors.light.mainTextColor,
    },
    addressContainer: {
        backgroundColor: "#ffffff",
        borderRadius: 8,
        padding: 12,
        marginTop: 12,
    },
    addressText: {
        fontFamily: Fonts.regular,
        fontSize: 14,
        color: Colors.light.mainTextColor,
    },

    /* STATUS TIMELINE */
    statusTimelineContainer: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginTop: 18,
        marginBottom: 16,
    },
    statusStepContainer: {
        flex: 1,
        alignItems: "center",
        position: "relative",
    },
    statusCircle: {
        width: 34,
        height: 34,
        borderRadius: 17,
        borderWidth: 2,
        borderColor: Colors.light.greenButtonBackground,
        backgroundColor: "#ffffff",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2,
    },
    completedStatusCircle: {
        backgroundColor: Colors.light.greenButtonBackground,
    },
    activeStatusCircle: {
        backgroundColor: "#a94c0f",
        borderColor: "#a94c0f",
    },
    cancelledStatusCircle: {
        backgroundColor: Colors.light.deleteButtonBackground,
        borderColor: Colors.light.deleteButtonBackground,
    },
    disabledStatusCircle: {
        opacity: 0.6,
    },
    statusCircleText: {
        fontFamily: Fonts.bold,
        fontSize: 13,
        color: Colors.light.greenButtonBackground,
    },
    activeStatusCircleText: {
        color: Colors.light.greenButtonTextColor,
    },
    statusStepText: {
        marginTop: 6,
        fontFamily: Fonts.semibold,
        fontSize: 12,
        color: Colors.light.basePriceDiscountedTextColor,
        textAlign: "center",
    },
    activeStatusStepText: {
        color: Colors.light.greenButtonBackground,
    },
    statusConnector: {
        position: "absolute",
        top: 16,
        left: "50%",
        width: "100%",
        height: 2,
        backgroundColor: "#c8bd96",
        zIndex: 1,
    },
    completedStatusConnector: {
        backgroundColor: Colors.light.greenButtonBackground,
    },

    /* ITEMS */
    itemsContainer: {
        marginTop: 4,
    },
    sectionTitle: {
        marginBottom: 10,
        fontFamily: Fonts.bold,
        fontSize: 16,
        color: Colors.light.greenButtonBackground,
    },
    orderItemContainer: {
        backgroundColor: "#ffffff",
        borderRadius: 8,
        padding: 12,
        marginBottom: 10,
    },
    orderItemHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 10,
        marginBottom: 8,
    },
    orderItemTitle: {
        flex: 1,
        fontFamily: Fonts.semibold,
        fontSize: 14,
        color: Colors.light.greenButtonBackground,
    },
    orderItemDelivered: {
        fontFamily: Fonts.semibold,
        fontSize: 13,
        color: Colors.light.currentPriceTextColor,
    },
    orderItemText: {
        marginBottom: 4,
        fontFamily: Fonts.regular,
        fontSize: 13,
        color: Colors.light.mainTextColor,
    },

    /* STATUS BUTTONS */
    statusButtonContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginTop: 8,
    },
    statusButtonWrapper: {
        minWidth: 120,
        alignItems: "center",
        backgroundColor: Colors.light.greenButtonBackground,
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    currentStatusButtonWrapper: {
        backgroundColor: "#a94c0f",
    },
    cancelStatusButtonWrapper: {
        backgroundColor: Colors.light.deleteButtonBackground,
    },
    statusButtonText: {
        fontFamily: Fonts.semibold,
        fontSize: 13,
        color: Colors.light.greenButtonTextColor,
    },
});
//#endregion
