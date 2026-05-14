//#region IMPORTS
import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import Navbar from "@/components/Navbar/Navbar";
import SortDropdown from "@/components/DropDowns/SortDropdown/SortDropdown";
import WrappedGeneralButton from "@/components/Buttons/GeneralButtonWithWrapper/GeneralButtonWithWrapper";

import { API_BASE_URL } from "@/constants/API";
import { Colors, Fonts } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useTransition } from "@/context/TransitionContext";
import { useUser } from "@/context/UserContext";
//#endregion


//#region API NAMES
const refundsApi = "/api/v3/refunds";
const updateRefundStatusApi = (refundId: string) => `/api/v3/refunds/${refundId}`;
//#endregion


//#region TYPES
type RefundStatus = "pending" | "approved" | "rejected" | "completed";
type RefundStatusFilter = RefundStatus | "all";
type RefundStatusSort = RefundStatus;

interface SalesManagerRefund {
    refundId: string;
    orderItemId: string;
    orderId: string;
    customerId: string;
    status: RefundStatus;
    refundAmount: number;
    requestDate: string;
    processedAt: string | null;
}

interface GetRefundsResponse {
    message: string;
    refunds: SalesManagerRefund[];
}

interface RefundCardProps {
    refund: SalesManagerRefund;
    isUpdating: boolean;
    onStatusChange: (refundId: string, status: RefundStatus) => void;
}

interface RefundGroup {
    orderId: string;
    customerId: string;
    refunds: SalesManagerRefund[];
    totalRefundAmount: number;
    latestRequestDate: string;
}

interface RefundGroupCardProps {
    group: RefundGroup;
    updatingRefunds: Record<string, boolean>;
    onStatusChange: (refundId: string, status: RefundStatus) => void;
}
//#endregion


//#region LOCAL CONSTANTS
const REFUND_STATUSES: RefundStatus[] = ["pending", "approved", "rejected", "completed"];
const ACTIONABLE_REFUND_STATUSES: RefundStatus[] = ["approved", "rejected"];

const statusFilterOptions = [
    { label: "Status: All", value: "all" },
    { label: "Status: Pending", value: "pending" },
    { label: "Status: Approved", value: "approved" },
    { label: "Status: Rejected", value: "rejected" },
    { label: "Status: Completed", value: "completed" },
];

const statusSortOptions = [
    { label: "Status: Pending First", value: "pending" },
    { label: "Status: Approved First", value: "approved" },
    { label: "Status: Rejected First", value: "rejected" },
    { label: "Status: Completed First", value: "completed" },
];
//#endregion


//#region HELPER FUNCTIONS
function formatDate(dateString: string | null): string
{
    if (!dateString) return "Not Processed";

    return dateString.split("T")[0];
}

function formatCurrency(value: number): string
{
    return `$${Number(value || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

function formatStatus(status: RefundStatus): string
{
    return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatDateFilterInput(text: string): string
{
    const digitsOnly = text.replace(/[^0-9]/g, "").slice(0, 8);

    if (digitsOnly.length <= 4) return digitsOnly;
    if (digitsOnly.length <= 6) return `${digitsOnly.slice(0, 4)}-${digitsOnly.slice(4)}`;

    return `${digitsOnly.slice(0, 4)}-${digitsOnly.slice(4, 6)}-${digitsOnly.slice(6)}`;
}

function isValidStrictDate(date: string): boolean
{
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;

    const [yearString, monthString, dayString] = date.split("-");
    const year = Number(yearString);
    const month = Number(monthString);
    const day = Number(dayString);
    const parsedDate = new Date(Date.UTC(year, month - 1, day));

    return (
        parsedDate.getUTCFullYear() === year &&
        parsedDate.getUTCMonth() === month - 1 &&
        parsedDate.getUTCDate() === day
    );
}

function normalizeRefundStatus(status: string): RefundStatus
{
    const normalizedStatus = status.toLowerCase();

    if (normalizedStatus === "pending") return "pending";
    if (normalizedStatus === "approved") return "approved";
    if (normalizedStatus === "rejected") return "rejected";
    if (normalizedStatus === "completed") return "completed";

    return "pending";
}

function normalizeSalesManagerRefund(refund: SalesManagerRefund): SalesManagerRefund
{
    return {
        ...refund,
        status: normalizeRefundStatus(refund.status),
        refundAmount: Number(refund.refundAmount || 0),
    };
}

function getRefundSearchText(refund: SalesManagerRefund): string
{
    return [
        refund.refundId,
        refund.orderId,
        refund.orderItemId,
        refund.customerId,
    ].join(" ").toLowerCase();
}

function getStatusSortRank(status: RefundStatus, selectedStatus: RefundStatusSort): number
{
    if (status === selectedStatus) return 0;

    return REFUND_STATUSES.indexOf(status) + 1;
}

function getRefundGroupStatusSummary(refunds: SalesManagerRefund[]): string
{
    return REFUND_STATUSES
        .map(status => {
            const count = refunds.filter(refund => refund.status === status).length;
            return count > 0 ? `${count} ${formatStatus(status)}` : "";
        })
        .filter(Boolean)
        .join(" / ");
}

function getLatestDate(firstDate: string, secondDate: string): string
{
    return new Date(firstDate).getTime() >= new Date(secondDate).getTime() ? firstDate : secondDate;
}

function isDateFilterReady(date: string): boolean
{
    return date.length === 10 && isValidStrictDate(date);
}

function shouldApplyDateFilter(date: string): boolean
{
    return date.trim().length === 0 || isDateFilterReady(date);
}

function shouldApplyDateRangeFilter(startDate: string, endDate: string): boolean
{
    return shouldApplyDateFilter(startDate) && shouldApplyDateFilter(endDate);
}

function isRefundInDateRange(requestDate: string, startDate: string, endDate: string): boolean
{
    if (!shouldApplyDateRangeFilter(startDate, endDate)) return false;
    if (!startDate && !endDate) return true;
    if (!startDate) return requestDate <= endDate;
    if (!endDate) return requestDate >= startDate;

    return requestDate >= startDate && requestDate <= endDate;
}

function getDateFilterError(date: string): string
{
    if (date.trim().length === 0 || isDateFilterReady(date)) return "";

    return "Use YYYY-MM-DD";
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


//#region REFUND CARD COMPONENT
function RefundCard({ refund, isUpdating, onStatusChange }: RefundCardProps)
{
    return (
        <View style={styles.refundCard}>
            <View style={styles.refundCardHeader}>
                <View style={styles.refundTitleContainer}>
                    <Text style={styles.refundTitle}>Refund #{refund.refundId}</Text>
                    <Text style={styles.refundDate}>Requested {formatDate(refund.requestDate)}</Text>
                </View>

                <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>{formatStatus(refund.status)}</Text>
                </View>
            </View>

            <View style={styles.detailGrid}>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Order ID</Text>
                    <Text style={styles.detailValue}>{refund.orderId}</Text>
                </View>

                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Order Item ID</Text>
                    <Text style={styles.detailValue}>{refund.orderItemId}</Text>
                </View>

                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Customer ID</Text>
                    <Text style={styles.detailValue}>{refund.customerId}</Text>
                </View>

                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Refund Amount</Text>
                    <Text style={styles.detailValue}>{formatCurrency(refund.refundAmount)}</Text>
                </View>

                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Processed At</Text>
                    <Text style={styles.detailValue}>{formatDate(refund.processedAt)}</Text>
                </View>
            </View>

            <View style={styles.statusButtonContainer}>
                {ACTIONABLE_REFUND_STATUSES.map((status) => (
                    <WrappedGeneralButton
                        key={status}
                        title={formatStatus(status)}
                        disabled={isUpdating || refund.status !== "pending"}
                        wrapperStyles={[
                            styles.statusButtonWrapper,
                            status === "rejected" && styles.rejectButtonWrapper,
                            refund.status === status && styles.currentStatusButtonWrapper,
                        ]}
                        textStyles={styles.statusButtonText}
                        onPress={() => onStatusChange(refund.refundId, status)}
                    />
                ))}
            </View>
        </View>
    );
}
//#endregion


//#region REFUND GROUP CARD COMPONENT
function RefundGroupCard({ group, updatingRefunds, onStatusChange }: RefundGroupCardProps)
{
    return (
        <View style={styles.groupCard}>
            <View style={styles.groupCardHeader}>
                <View style={styles.refundTitleContainer}>
                    <Text style={styles.groupTitle}>Order #{group.orderId}</Text>
                    <Text style={styles.refundDate}>
                        {group.refunds.length} refund request{group.refunds.length === 1 ? "" : "s"} / {getRefundGroupStatusSummary(group.refunds)}
                    </Text>
                </View>

                <View style={styles.groupAmountContainer}>
                    <Text style={styles.detailLabel}>Total Refund</Text>
                    <Text style={styles.groupAmount}>{formatCurrency(group.totalRefundAmount)}</Text>
                </View>
            </View>

            <View style={styles.detailGrid}>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Customer ID</Text>
                    <Text style={styles.detailValue}>{group.customerId}</Text>
                </View>

                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Latest Request</Text>
                    <Text style={styles.detailValue}>{formatDate(group.latestRequestDate)}</Text>
                </View>
            </View>

            <View style={styles.groupRefundsContainer}>
                <Text style={styles.sectionTitle}>Refund Requests</Text>

                {group.refunds.map((refund) => (
                    <View key={refund.refundId} style={styles.groupRefundItem}>
                        <View style={styles.groupRefundHeader}>
                            <View style={styles.refundTitleContainer}>
                                <Text style={styles.groupRefundTitle}>Refund #{refund.refundId}</Text>
                                <Text style={styles.orderItemText}>Item ID: {refund.orderItemId}</Text>
                            </View>

                            <View style={styles.statusBadge}>
                                <Text style={styles.statusBadgeText}>{formatStatus(refund.status)}</Text>
                            </View>
                        </View>

                        <View style={styles.groupRefundDetails}>
                            <Text style={styles.orderItemText}>Amount: {formatCurrency(refund.refundAmount)}</Text>
                            <Text style={styles.orderItemText}>Requested: {formatDate(refund.requestDate)}</Text>
                            <Text style={styles.orderItemText}>Processed: {formatDate(refund.processedAt)}</Text>
                        </View>

                        <View style={styles.statusButtonContainer}>
                            {ACTIONABLE_REFUND_STATUSES.map((status) => (
                                <WrappedGeneralButton
                                    key={status}
                                    title={formatStatus(status)}
                                    disabled={!!updatingRefunds[refund.refundId] || refund.status !== "pending"}
                                    wrapperStyles={[
                                        styles.statusButtonWrapper,
                                        styles.compactStatusButtonWrapper,
                                        status === "rejected" && styles.rejectButtonWrapper,
                                        refund.status === status && styles.currentStatusButtonWrapper,
                                    ]}
                                    textStyles={styles.statusButtonText}
                                    onPress={() => onStatusChange(refund.refundId, status)}
                                />
                            ))}
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
}
//#endregion


export default function SalesManagerRefunds()
{
    const { isLoading, token, user: authUser } = useAuth();
    const { user, isLoadingUser } = useUser();
    const { showToast } = useToast();
    const { navigateWithWipe, revealWipe } = useTransition();

    const [refunds, setRefunds] = useState<SalesManagerRefund[]>([]);
    const [isLoadingRefunds, setIsLoadingRefunds] = useState(false);
    const [hasHandledAccess, setHasHandledAccess] = useState(false);
    const [updatingRefunds, setUpdatingRefunds] = useState<Record<string, boolean>>({});

    const [beginningDateFilter, setBeginningDateFilter] = useState("");
    const [endingDateFilter, setEndingDateFilter] = useState("");
    const [searchFilter, setSearchFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState<RefundStatusFilter>("all");
    const [statusSort, setStatusSort] = useState<RefundStatusSort>("pending");
    const [isGrouped, setIsGrouped] = useState(true);

    const activeUser = user ?? authUser;
    const userRole = activeUser?.role ?? "guest";
    const isSalesManager = userRole === "sales_manager";
    const beginningDateFilterError = getDateFilterError(beginningDateFilter);
    const endingDateFilterError = getDateFilterError(endingDateFilter);

    //#region API FUNCTIONS
    const fetchRefunds = useCallback(async (status: RefundStatusFilter = statusFilter): Promise<void> =>
    {
        if (!token) return;

        setIsLoadingRefunds(true);

        try {
            const queryString = status !== "all" ? `?status=${encodeURIComponent(status)}` : "";
            const response = await fetch(`${API_BASE_URL}${refundsApi}${queryString}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            });

            const responseData = await readResponseJson<GetRefundsResponse>(response);

            if (response.ok)
            {
                setRefunds((responseData?.refunds || []).map(normalizeSalesManagerRefund));
            }
            else
            {
                showToast(responseData?.message || "Refunds could not be fetched", "error");
            }
        } catch (error) {
            showToast("Something went wrong while fetching refunds", "error");
            console.error("LOG::ERROR::fetchRefunds", error);
        } finally {
            setIsLoadingRefunds(false);
        }
    }, [showToast, statusFilter, token]);

    async function updateRefundStatus(refundId: string, status: RefundStatus): Promise<void>
    {
        if (!token) return;

        setUpdatingRefunds(prev => ({ ...prev, [refundId]: true }));

        try {
            const response = await fetch(`${API_BASE_URL}${updateRefundStatusApi(refundId)}`, {
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
                setRefunds(prevRefunds =>
                    prevRefunds.map(refund =>
                        refund.refundId === refundId
                            ? { ...refund, status, processedAt: new Date().toISOString() }
                            : refund
                    )
                );
                showToast(`Refund status changed to ${formatStatus(status)}`, "success");
            }
            else
            {
                showToast(responseData?.message || "Refund status could not be updated", "error");
            }
        } catch (error) {
            showToast("Something went wrong while updating refund status", "error");
            console.error("LOG::ERROR::updateRefundStatus", error);
        } finally {
            setUpdatingRefunds(prev => ({ ...prev, [refundId]: false }));
        }
    }
    //#endregion

    //#region BUTTON FUNCTIONS
    function clearFiltersButtonFunction(): void
    {
        setBeginningDateFilter("");
        setEndingDateFilter("");
        setSearchFilter("");
        setStatusFilter("all");
        setStatusSort("pending");
        setIsGrouped(true);
        fetchRefunds("all");
    }

    function refreshRefundsButtonFunction(): void
    {
        fetchRefunds();
    }

    function statusFilterChange(newStatus: string): void
    {
        const nextStatus = newStatus as RefundStatusFilter;
        setStatusFilter(nextStatus);
        fetchRefunds(nextStatus);
    }

    function beginningDateFilterInputChange(text: string): void
    {
        setBeginningDateFilter(formatDateFilterInput(text));
    }

    function endingDateFilterInputChange(text: string): void
    {
        setEndingDateFilter(formatDateFilterInput(text));
    }
    //#endregion

    //#region FILTER AND SORT
    const filteredRefunds = useMemo(() => {
        const normalizedBeginningDateFilter = beginningDateFilter.trim().toLowerCase();
        const normalizedEndingDateFilter = endingDateFilter.trim().toLowerCase();
        const normalizedSearchFilter = searchFilter.trim().toLowerCase();

        return refunds
            .filter(refund => {
                const requestDate = formatDate(refund.requestDate).toLowerCase();

                return (
                    isRefundInDateRange(requestDate, normalizedBeginningDateFilter, normalizedEndingDateFilter) &&
                    (!normalizedSearchFilter || getRefundSearchText(refund).includes(normalizedSearchFilter)) &&
                    (statusFilter === "all" || refund.status === statusFilter)
                );
            })
            .sort((firstRefund, secondRefund) => {
                const statusDifference = getStatusSortRank(firstRefund.status, statusSort) - getStatusSortRank(secondRefund.status, statusSort);

                if (statusDifference !== 0) return statusDifference;

                return new Date(secondRefund.requestDate).getTime() - new Date(firstRefund.requestDate).getTime();
            });
    }, [refunds, beginningDateFilter, endingDateFilter, searchFilter, statusFilter, statusSort]);

    const groupedRefunds = useMemo(() => {
        const groupMap = new Map<string, RefundGroup>();

        filteredRefunds.forEach(refund => {
            const existingGroup = groupMap.get(refund.orderId);

            if (!existingGroup) {
                groupMap.set(refund.orderId, {
                    orderId: refund.orderId,
                    customerId: refund.customerId,
                    refunds: [refund],
                    totalRefundAmount: refund.refundAmount,
                    latestRequestDate: refund.requestDate,
                });
                return;
            }

            existingGroup.refunds.push(refund);
            existingGroup.totalRefundAmount += refund.refundAmount;
            existingGroup.latestRequestDate = getLatestDate(existingGroup.latestRequestDate, refund.requestDate);
        });

        return Array.from(groupMap.values()).sort((firstGroup, secondGroup) => {
            const firstRank = Math.min(...firstGroup.refunds.map(refund => getStatusSortRank(refund.status, statusSort)));
            const secondRank = Math.min(...secondGroup.refunds.map(refund => getStatusSortRank(refund.status, statusSort)));

            if (firstRank !== secondRank) return firstRank - secondRank;

            return new Date(secondGroup.latestRequestDate).getTime() - new Date(firstGroup.latestRequestDate).getTime();
        });
    }, [filteredRefunds, statusSort]);
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
            fetchRefunds();
        }, [fetchRefunds, isLoading, isLoadingUser, isSalesManager, navigateWithWipe, showToast, userRole])
    );

    useFocusEffect(
        useCallback(() => {
            if (hasHandledAccess && isSalesManager && !isLoadingRefunds) {
                revealWipe();
            }
        }, [hasHandledAccess, isSalesManager, isLoadingRefunds, revealWipe])
    );
    //#endregion

    if (isLoading || isLoadingUser || !hasHandledAccess || !isSalesManager) {
        return null;
    }

    return (
        <View style={styles.mainContainer}>
            <Navbar />

            <View style={styles.contentContainer}>
                <Text style={styles.pageTitle}>Sales Manager Refunds</Text>

                <View style={styles.filterContainer}>
                    <View style={[styles.filterInputContainer, styles.dateFilterInputContainer]}>
                        <Text style={styles.filterLabel}>Beginning Date</Text>
                        <TextInput
                            style={[styles.filterInput, beginningDateFilterError.length > 0 && styles.invalidFilterInput]}
                            value={beginningDateFilter}
                            onChangeText={beginningDateFilterInputChange}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor="#a09a80"
                            keyboardType="number-pad"
                            maxLength={10}
                        />
                        {beginningDateFilterError.length > 0 && (
                            <Text style={styles.filterErrorText}>{beginningDateFilterError}</Text>
                        )}
                    </View>

                    <View style={[styles.filterInputContainer, styles.dateFilterInputContainer]}>
                        <Text style={styles.filterLabel}>Ending Date</Text>
                        <TextInput
                            style={[styles.filterInput, endingDateFilterError.length > 0 && styles.invalidFilterInput]}
                            value={endingDateFilter}
                            onChangeText={endingDateFilterInputChange}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor="#a09a80"
                            keyboardType="number-pad"
                            maxLength={10}
                        />
                        {endingDateFilterError.length > 0 && (
                            <Text style={styles.filterErrorText}>{endingDateFilterError}</Text>
                        )}
                    </View>

                    <View style={styles.searchInputContainer}>
                        <Text style={styles.filterLabel}>Search</Text>
                        <TextInput
                            style={styles.filterInput}
                            value={searchFilter}
                            onChangeText={setSearchFilter}
                            placeholder="Refund, order, item, or customer ID"
                            placeholderTextColor="#a09a80"
                        />
                    </View>

                    <View style={styles.sortContainer}>
                        <Text style={styles.filterLabel}>Filter</Text>
                        <SortDropdown
                            options={statusFilterOptions}
                            selectedValue={statusFilter}
                            onChange={statusFilterChange}
                            containerStyle={styles.sortDropdownContainer}
                            triggerStyle={styles.sortDropdownTrigger}
                        />
                    </View>

                    <View style={styles.sortContainer}>
                        <Text style={styles.filterLabel}>Sort</Text>
                        <SortDropdown
                            options={statusSortOptions}
                            selectedValue={statusSort}
                            onChange={(newStatus) => setStatusSort(newStatus as RefundStatusSort)}
                            containerStyle={styles.sortDropdownContainer}
                            triggerStyle={styles.sortDropdownTrigger}
                        />
                    </View>

                    <Pressable style={styles.groupToggleContainer} onPress={() => setIsGrouped(prev => !prev)}>
                        <View style={[styles.checkbox, isGrouped && styles.checkedCheckbox]}>
                            {isGrouped && <Text style={styles.checkboxMark}>✓</Text>}
                        </View>
                        <Text style={styles.groupToggleText}>Group by order</Text>
                    </Pressable>

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
                            disabled={isLoadingRefunds}
                            onPress={refreshRefundsButtonFunction}
                        />
                    </View>
                </View>

                {isLoadingRefunds ? (
                    <ActivityIndicator size="large" color={Colors.light.greenButtonBackground} style={styles.loadingIndicator} />
                ) : filteredRefunds.length === 0 ? (
                    <Text style={styles.emptyRefundsText}>No refunds match your filters.</Text>
                ) : isGrouped ? (
                    <FlatList
                        data={groupedRefunds}
                        keyExtractor={(item) => item.orderId}
                        renderItem={({ item }) => (
                            <RefundGroupCard
                                group={item}
                                updatingRefunds={updatingRefunds}
                                onStatusChange={updateRefundStatus}
                            />
                        )}
                        contentContainerStyle={styles.listContainer}
                        showsVerticalScrollIndicator={false}
                    />
                ) : (
                    <FlatList
                        data={filteredRefunds}
                        keyExtractor={(item) => item.refundId}
                        renderItem={({ item }) => (
                            <RefundCard
                                refund={item}
                                isUpdating={!!updatingRefunds[item.refundId]}
                                onStatusChange={updateRefundStatus}
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
        backgroundColor: Colors.light.salesManagerBackground,
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
    dateFilterInputContainer: {
        flexGrow: 0,
        flexBasis: 180,
    },
    searchInputContainer: {
        flexGrow: 1,
        flexBasis: 360,
        minWidth: 300,
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
    invalidFilterInput: {
        borderColor: Colors.light.errorText,
    },
    filterErrorText: {
        marginTop: 4,
        fontFamily: Fonts.semibold,
        fontSize: 12,
        color: Colors.light.errorText,
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
    groupToggleContainer: {
        minHeight: 42,
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-end",
        gap: 8,
        paddingHorizontal: 6,
        paddingBottom: 1,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderWidth: 2,
        borderColor: Colors.light.greenButtonBackground,
        borderRadius: 4,
        backgroundColor: "#ffffff",
        alignItems: "center",
        justifyContent: "center",
    },
    checkedCheckbox: {
        backgroundColor: Colors.light.greenButtonBackground,
    },
    checkboxMark: {
        fontFamily: Fonts.bold,
        fontSize: 14,
        color: Colors.light.greenButtonTextColor,
    },
    groupToggleText: {
        fontFamily: Fonts.semibold,
        fontSize: 14,
        color: Colors.light.greenButtonBackground,
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
    emptyRefundsText: {
        marginTop: 40,
        textAlign: "center",
        fontFamily: Fonts.semibold,
        fontSize: 16,
        color: Colors.light.greenButtonBackground,
    },
    listContainer: {
        paddingBottom: 30,
    },

    /* REFUND CARD */
    refundCard: {
        backgroundColor: Colors.light.softContainerBackground,
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
    },
    refundCardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 14,
    },
    refundTitleContainer: {
        flex: 1,
    },
    refundTitle: {
        fontFamily: Fonts.bold,
        fontSize: 18,
        color: Colors.light.greenButtonBackground,
    },
    refundDate: {
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
        flexWrap: "wrap",
    },

    /* GROUP CARD */
    groupCard: {
        backgroundColor: Colors.light.softContainerBackground,
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
    },
    groupCardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 14,
    },
    groupTitle: {
        fontFamily: Fonts.bold,
        fontSize: 18,
        color: Colors.light.greenButtonBackground,
    },
    groupAmountContainer: {
        alignSelf: "flex-start",
        backgroundColor: "#ffffff",
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    groupAmount: {
        fontFamily: Fonts.bold,
        fontSize: 15,
        color: Colors.light.currentPriceTextColor,
    },
    groupRefundsContainer: {
        marginTop: 14,
    },
    sectionTitle: {
        marginBottom: 10,
        fontFamily: Fonts.bold,
        fontSize: 16,
        color: Colors.light.greenButtonBackground,
    },
    groupRefundItem: {
        backgroundColor: "#ffffff",
        borderRadius: 8,
        padding: 12,
        marginBottom: 10,
    },
    groupRefundHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 10,
        marginBottom: 8,
    },
    groupRefundTitle: {
        flex: 1,
        fontFamily: Fonts.semibold,
        fontSize: 14,
        color: Colors.light.greenButtonBackground,
    },
    groupRefundDetails: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
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
        marginTop: 12,
    },
    statusButtonWrapper: {
        minWidth: 120,
        alignItems: "center",
        backgroundColor: Colors.light.greenButtonBackground,
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    compactStatusButtonWrapper: {
        minWidth: 105,
        paddingVertical: 8,
    },
    rejectButtonWrapper: {
        backgroundColor: Colors.light.deleteButtonBackground,
    },
    currentStatusButtonWrapper: {
        backgroundColor: "#a94c0f",
    },
    statusButtonText: {
        fontFamily: Fonts.semibold,
        fontSize: 13,
        color: Colors.light.greenButtonTextColor,
    },
});
//#endregion
