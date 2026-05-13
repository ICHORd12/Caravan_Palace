//#region IMPORTS
import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import Navbar from "@/components/Navbar/Navbar";
import WrappedGeneralButton from "@/components/Buttons/GeneralButtonWithWrapper/GeneralButtonWithWrapper";

import { API_BASE_URL } from "@/constants/API";
import { Colors, Fonts } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useTransition } from "@/context/TransitionContext";
import { useUser } from "@/context/UserContext";
//#endregion


//#region API NAMES
const getFinancialSummaryApi = "/api/v3/orders/reports/financial-summary";
//#endregion


//#region TYPES
interface FinancialDateRange {
    startDate: string;
    endDate: string;
    startAt: string;
    endAt: string;
}

interface FinancialSummary {
    orderCount: number;
    itemsSold: number;
    refundCount: number;
    potentialRevenue: number;
    grossRevenue: number;
    discountLoss: number;
    refundLoss: number;
    totalLoss: number;
    netRevenue: number;
    profit: number;
}

interface FinancialSummaryResponse {
    message: string;
    dateRange: FinancialDateRange;
    summary: FinancialSummary;
}

interface MonthlyFinancialSummary {
    label: string;
    startDate: string;
    endDate: string;
    summary: FinancialSummary;
}

interface MetricCardProps {
    label: string;
    value: string;
    tone?: "default" | "good" | "warning" | "danger";
}

interface SummaryBarProps {
    label: string;
    value: number;
    maxValue: number;
    color: string;
}

interface MonthlyTrendChartProps {
    monthlySummaries: MonthlyFinancialSummary[];
    maxMonthlyValue: number;
}
//#endregion


//#region HELPER FUNCTIONS
function getTodayDateString(): string
{
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = `${currentDate.getMonth() + 1}`.padStart(2, "0");
    const day = `${currentDate.getDate()}`.padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getMonthStartDateString(): string
{
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = `${currentDate.getMonth() + 1}`.padStart(2, "0");

    return `${year}-${month}-01`;
}

function formatDateFromDate(date: Date): string
{
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getMonthLabel(dateString: string): string
{
    const [yearString, monthString] = dateString.split("-");
    const monthIndex = Number(monthString) - 1;
    const monthName = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][monthIndex] || monthString;

    return `${monthName} ${yearString}`;
}

function getMonthRangesInDateRange(startDate: string, endDate: string): { label: string; startDate: string; endDate: string }[]
{
    if (!isDateRangeValid(startDate, endDate)) return [];

    const [startYear, startMonth] = startDate.split("-").map(Number);
    const [endYear, endMonth] = endDate.split("-").map(Number);
    const currentMonth = new Date(startYear, startMonth - 1, 1);
    const lastMonth = new Date(endYear, endMonth - 1, 1);
    const ranges: { label: string; startDate: string; endDate: string }[] = [];

    while (currentMonth <= lastMonth) {
        const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        const rangeStart = formatDateFromDate(monthStart) < startDate ? startDate : formatDateFromDate(monthStart);
        const rangeEnd = formatDateFromDate(monthEnd) > endDate ? endDate : formatDateFromDate(monthEnd);

        ranges.push({
            label: getMonthLabel(rangeStart),
            startDate: rangeStart,
            endDate: rangeEnd,
        });

        currentMonth.setMonth(currentMonth.getMonth() + 1);
    }

    return ranges;
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

function getDateInputError(date: string): string
{
    if (date.trim().length === 0) return "Required";
    if (isValidStrictDate(date)) return "";

    return "Use YYYY-MM-DD";
}

function isDateRangeValid(startDate: string, endDate: string): boolean
{
    return isValidStrictDate(startDate) && isValidStrictDate(endDate) && startDate <= endDate;
}

function formatCurrency(value: number): string
{
    return `$${Number(value || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

function formatNumber(value: number): string
{
    return Number(value || 0).toLocaleString();
}

function getPercentage(numerator: number, denominator: number): string
{
    if (!denominator) return "0.0%";

    return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

function getBarWidth(value: number, maxValue: number): `${number}%`
{
    if (!maxValue || value <= 0) return "0%";

    return `${Math.min(100, Math.max(0, (value / maxValue) * 100))}%`;
}

async function readResponseJson<T>(response: Response): Promise<T | null>
{
    try {
        return await response.json();
    } catch {
        return null;
    }
}

function getMetricToneStyle(tone: MetricCardProps["tone"])
{
    if (tone === "good") return styles.goodMetricCard;
    if (tone === "warning") return styles.warningMetricCard;
    if (tone === "danger") return styles.dangerMetricCard;

    return styles.defaultMetricCard;
}
//#endregion


//#region LOCAL COMPONENTS
function MetricCard({ label, value, tone = "default" }: MetricCardProps)
{
    return (
        <View style={[styles.metricCard, getMetricToneStyle(tone)]}>
            <Text style={styles.metricLabel}>{label}</Text>
            <Text style={styles.metricValue}>{value}</Text>
        </View>
    );
}

function SummaryBar({ label, value, maxValue, color }: SummaryBarProps)
{
    return (
        <View style={styles.summaryBarContainer}>
            <View style={styles.summaryBarHeader}>
                <Text style={styles.summaryBarLabel}>{label}</Text>
                <Text style={styles.summaryBarValue}>{formatCurrency(value)}</Text>
            </View>

            <View style={styles.summaryBarTrack}>
                <View style={[styles.summaryBarFill, { width: getBarWidth(value, maxValue), backgroundColor: color }]} />
            </View>
        </View>
    );
}

function MonthlyTrendChart({ monthlySummaries, maxMonthlyValue }: MonthlyTrendChartProps)
{
    if (monthlySummaries.length === 0) {
        return (
            <Text style={styles.emptyMonthlyText}>No monthly data could be loaded for this range.</Text>
        );
    }

    return (
        <View style={styles.monthlyTrendContainer}>
            <View style={styles.monthlyLegendContainer}>
                <View style={styles.monthlyLegendItem}>
                    <View style={[styles.monthlyLegendSwatch, { backgroundColor: "#2d6a4f" }]} />
                    <Text style={styles.monthlyLegendText}>Net</Text>
                </View>

                <View style={styles.monthlyLegendItem}>
                    <View style={[styles.monthlyLegendSwatch, { backgroundColor: "#1b4332" }]} />
                    <Text style={styles.monthlyLegendText}>Profit</Text>
                </View>

                <View style={styles.monthlyLegendItem}>
                    <View style={[styles.monthlyLegendSwatch, { backgroundColor: "#7d2323" }]} />
                    <Text style={styles.monthlyLegendText}>Loss</Text>
                </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.monthlyChartCanvas}>
                    {monthlySummaries.map((monthlySummary) => (
                        <View key={`${monthlySummary.startDate}-${monthlySummary.endDate}`} style={styles.monthlyChartGroup}>
                            <View style={styles.monthlyChartBars}>
                                <View style={styles.monthlyVerticalBarSlot}>
                                    <View
                                        style={[
                                            styles.monthlyVerticalBar,
                                            {
                                                height: getBarWidth(monthlySummary.summary.netRevenue, maxMonthlyValue),
                                                backgroundColor: "#2d6a4f",
                                            },
                                        ]}
                                    />
                                </View>

                                <View style={styles.monthlyVerticalBarSlot}>
                                    <View
                                        style={[
                                            styles.monthlyVerticalBar,
                                            {
                                                height: getBarWidth(monthlySummary.summary.profit, maxMonthlyValue),
                                                backgroundColor: "#1b4332",
                                            },
                                        ]}
                                    />
                                </View>

                                <View style={styles.monthlyVerticalBarSlot}>
                                    <View
                                        style={[
                                            styles.monthlyVerticalBar,
                                            {
                                                height: getBarWidth(monthlySummary.summary.totalLoss, maxMonthlyValue),
                                                backgroundColor: "#7d2323",
                                            },
                                        ]}
                                    />
                                </View>
                            </View>

                            <Text style={styles.monthlyChartLabel}>{monthlySummary.label}</Text>
                            <Text style={styles.monthlyChartValue}>{formatCurrency(monthlySummary.summary.netRevenue)}</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>

            <View style={styles.monthlyChartTable}>
                {monthlySummaries.map((monthlySummary) => (
                    <View key={`${monthlySummary.startDate}-${monthlySummary.endDate}-values`} style={styles.monthlyChartTableRow}>
                        <Text style={styles.monthlyChartTableMonth}>{monthlySummary.label}</Text>
                        <Text style={styles.monthlyChartTableValue}>Net {formatCurrency(monthlySummary.summary.netRevenue)}</Text>
                        <Text style={styles.monthlyChartTableValue}>Profit {formatCurrency(monthlySummary.summary.profit)}</Text>
                        <Text style={styles.monthlyChartTableValue}>Loss {formatCurrency(monthlySummary.summary.totalLoss)}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
}
//#endregion


export default function SalesManagerStatistics()
{
    const { isLoading, token, user: authUser } = useAuth();
    const { user, isLoadingUser } = useUser();
    const { showToast } = useToast();
    const { navigateWithWipe, revealWipe } = useTransition();

    const [hasHandledAccess, setHasHandledAccess] = useState(false);
    const [isLoadingSummary, setIsLoadingSummary] = useState(false);
    const [isLoadingMonthlySummary, setIsLoadingMonthlySummary] = useState(false);
    const [financialSummaryResponse, setFinancialSummaryResponse] = useState<FinancialSummaryResponse | null>(null);
    const [monthlySummaries, setMonthlySummaries] = useState<MonthlyFinancialSummary[]>([]);

    const [startDate, setStartDate] = useState(getMonthStartDateString());
    const [endDate, setEndDate] = useState(getTodayDateString());

    const activeUser = user ?? authUser;
    const userRole = activeUser?.role ?? "guest";
    const isSalesManager = userRole === "sales_manager";

    const startDateError = getDateInputError(startDate);
    const endDateError = getDateInputError(endDate);
    const isRangeInvalid = startDateError.length === 0 && endDateError.length === 0 && startDate > endDate;
    const isFetchDisabled = isLoadingSummary || isLoadingMonthlySummary || !isDateRangeValid(startDate, endDate);

    const summary = financialSummaryResponse?.summary;
    const dateRange = financialSummaryResponse?.dateRange;
    const maxBarValue = useMemo(() => {
        if (!summary) return 0;

        return Math.max(
            summary.potentialRevenue,
            summary.grossRevenue,
            summary.netRevenue,
            summary.profit,
            summary.totalLoss,
            summary.discountLoss,
            summary.refundLoss,
        );
    }, [summary]);
    const maxMonthlyValue = useMemo(() => {
        if (monthlySummaries.length === 0) return 0;

        return Math.max(
            ...monthlySummaries.flatMap(monthlySummary => [
                monthlySummary.summary.netRevenue,
                monthlySummary.summary.profit,
                monthlySummary.summary.totalLoss,
            ]),
        );
    }, [monthlySummaries]);

    //#region API FUNCTIONS
    async function fetchFinancialSummaryForRange(targetStartDate: string, targetEndDate: string): Promise<FinancialSummaryResponse | null>
    {
        if (!token) return null;

        const queryParams = new URLSearchParams({
            startDate: targetStartDate,
            endDate: targetEndDate,
        });

        const response = await fetch(`${API_BASE_URL}${getFinancialSummaryApi}?${queryParams.toString()}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
        });

        const responseData = await readResponseJson<FinancialSummaryResponse>(response);

        if (response.ok && responseData) return responseData;

        throw new Error(responseData?.message || "Financial summary could not be fetched");
    }

    async function fetchMonthlySummaries(): Promise<void>
    {
        if (!token) return;

        const monthlyRanges = getMonthRangesInDateRange(startDate, endDate);

        setIsLoadingMonthlySummary(true);

        try {
            const monthlyResults = await Promise.all(
                monthlyRanges.map(async (monthlyRange) => {
                    const responseData = await fetchFinancialSummaryForRange(monthlyRange.startDate, monthlyRange.endDate);

                    if (!responseData) return null;

                    return {
                        label: monthlyRange.label,
                        startDate: monthlyRange.startDate,
                        endDate: monthlyRange.endDate,
                        summary: responseData.summary,
                    };
                })
            );

            setMonthlySummaries(monthlyResults.filter((monthlySummary): monthlySummary is MonthlyFinancialSummary => monthlySummary !== null));
        } catch (error) {
            setMonthlySummaries([]);
            showToast("Monthly graph data could not be fetched", "error");
            console.error("LOG::ERROR::fetchMonthlySummaries", error);
        } finally {
            setIsLoadingMonthlySummary(false);
        }
    }

    async function fetchFinancialSummary(): Promise<void>
    {
        if (!token) return;

        if (!isDateRangeValid(startDate, endDate)) {
            showToast("Select a valid date range", "error");
            return;
        }

        setIsLoadingSummary(true);

        try {
            const responseData = await fetchFinancialSummaryForRange(startDate, endDate);

            if (responseData) {
                setFinancialSummaryResponse(responseData);
                showToast(responseData.message || "Financial summary fetched", "success");
                fetchMonthlySummaries();
            }
            else {
                showToast("Financial summary could not be fetched", "error");
            }
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Something went wrong while fetching financial summary", "error");
            console.error("LOG::ERROR::fetchFinancialSummary", error);
        } finally {
            setIsLoadingSummary(false);
        }
    }
    //#endregion

    //#region BUTTON FUNCTIONS
    function startDateInputChange(text: string): void
    {
        setStartDate(formatDateFilterInput(text));
    }

    function endDateInputChange(text: string): void
    {
        setEndDate(formatDateFilterInput(text));
    }

    function resetCurrentMonthButtonFunction(): void
    {
        setStartDate(getMonthStartDateString());
        setEndDate(getTodayDateString());
    }
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
            fetchFinancialSummary();
        }, [isLoading, isLoadingUser, isSalesManager, userRole, token])
    );

    useFocusEffect(
        useCallback(() => {
            if (hasHandledAccess && isSalesManager && !isLoadingSummary) {
                revealWipe();
            }
        }, [hasHandledAccess, isSalesManager, isLoadingSummary, revealWipe])
    );
    //#endregion

    if (isLoading || isLoadingUser || !hasHandledAccess || !isSalesManager) {
        return null;
    }

    return (
        <View style={styles.mainContainer}>
            <Navbar />

            <ScrollView style={styles.contentContainer} contentContainerStyle={styles.scrollContentContainer}>
                <View style={styles.pageHeader}>
                    <View>
                        <Text style={styles.pageTitle}>Financial Statistics</Text>
                        <Text style={styles.pageSubtitle}>Revenue, loss, and fulfillment performance by order date.</Text>
                    </View>
                </View>

                <View style={styles.filterContainer}>
                    <View style={styles.dateInputContainer}>
                        <Text style={styles.filterLabel}>Start Date</Text>
                        <TextInput
                            style={[styles.filterInput, startDateError.length > 0 && styles.invalidFilterInput]}
                            value={startDate}
                            onChangeText={startDateInputChange}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor="#a09a80"
                            keyboardType="number-pad"
                            maxLength={10}
                        />
                        {startDateError.length > 0 && (
                            <Text style={styles.filterErrorText}>{startDateError}</Text>
                        )}
                    </View>

                    <View style={styles.dateInputContainer}>
                        <Text style={styles.filterLabel}>End Date</Text>
                        <TextInput
                            style={[styles.filterInput, endDateError.length > 0 && styles.invalidFilterInput]}
                            value={endDate}
                            onChangeText={endDateInputChange}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor="#a09a80"
                            keyboardType="number-pad"
                            maxLength={10}
                        />
                        {endDateError.length > 0 && (
                            <Text style={styles.filterErrorText}>{endDateError}</Text>
                        )}
                    </View>

                    <View style={styles.filterButtonContainer}>
                        <WrappedGeneralButton
                            title="Fetch Summary"
                            wrapperStyles={styles.filterButtonWrapper}
                            textStyles={styles.filterButtonText}
                            disabled={isFetchDisabled}
                            onPress={fetchFinancialSummary}
                        />

                        <WrappedGeneralButton
                            title="Current Month"
                            wrapperStyles={styles.secondaryButtonWrapper}
                            textStyles={styles.secondaryButtonText}
                            onPress={resetCurrentMonthButtonFunction}
                        />
                    </View>
                </View>

                {isRangeInvalid && (
                    <Text style={styles.rangeErrorText}>Start date must be before or equal to end date.</Text>
                )}

                {isLoadingSummary ? (
                    <ActivityIndicator size="large" color={Colors.light.greenButtonBackground} style={styles.loadingIndicator} />
                ) : !summary || !dateRange ? (
                    <Text style={styles.emptySummaryText}>Choose a valid date range to load financial statistics.</Text>
                ) : (
                    <>
                        <View style={styles.dateRangeContainer}>
                            <Text style={styles.dateRangeTitle}>Selected Range</Text>
                            <Text style={styles.dateRangeText}>{dateRange.startDate} to {dateRange.endDate}</Text>
                            <Text style={styles.dateRangeMeta}>Backend window: {dateRange.startAt} - {dateRange.endAt}</Text>
                        </View>

                        <View style={styles.metricGrid}>
                            <MetricCard label="Orders" value={formatNumber(summary.orderCount)} />
                            <MetricCard label="Items Sold" value={formatNumber(summary.itemsSold)} />
                            <MetricCard label="Refund Count" value={formatNumber(summary.refundCount)} tone={summary.refundCount > 0 ? "warning" : "good"} />
                            <MetricCard label="Profit" value={formatCurrency(summary.profit)} tone="good" />
                            <MetricCard label="Net Revenue" value={formatCurrency(summary.netRevenue)} tone="good" />
                            <MetricCard label="Total Loss" value={formatCurrency(summary.totalLoss)} tone={summary.totalLoss > 0 ? "danger" : "default"} />
                        </View>

                        <View style={styles.sectionContainer}>
                            <Text style={styles.sectionTitle}>Revenue Shape</Text>
                            <SummaryBar label="Potential Revenue" value={summary.potentialRevenue} maxValue={maxBarValue} color="#606c38" />
                            <SummaryBar label="Gross Revenue" value={summary.grossRevenue} maxValue={maxBarValue} color="#283618" />
                            <SummaryBar label="Net Revenue" value={summary.netRevenue} maxValue={maxBarValue} color="#2d6a4f" />
                            <SummaryBar label="Profit" value={summary.profit} maxValue={maxBarValue} color="#1b4332" />
                        </View>

                        <View style={styles.sectionContainer}>
                            <Text style={styles.sectionTitle}>Loss Breakdown</Text>
                            <SummaryBar label="Discount Loss" value={summary.discountLoss} maxValue={maxBarValue} color="#bc6c25" />
                            <SummaryBar label="Refund Loss" value={summary.refundLoss} maxValue={maxBarValue} color="#7d2323" />
                            <SummaryBar label="Total Loss" value={summary.totalLoss} maxValue={maxBarValue} color="#5d0c2b" />

                            <View style={styles.ratioGrid}>
                                <View style={styles.ratioCard}>
                                    <Text style={styles.ratioLabel}>Discount Loss / Potential</Text>
                                    <Text style={styles.ratioValue}>{getPercentage(summary.discountLoss, summary.potentialRevenue)}</Text>
                                </View>

                                <View style={styles.ratioCard}>
                                    <Text style={styles.ratioLabel}>Refund Loss / Gross</Text>
                                    <Text style={styles.ratioValue}>{getPercentage(summary.refundLoss, summary.grossRevenue)}</Text>
                                </View>

                                <View style={styles.ratioCard}>
                                    <Text style={styles.ratioLabel}>Net / Potential</Text>
                                    <Text style={styles.ratioValue}>{getPercentage(summary.netRevenue, summary.potentialRevenue)}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.sectionContainer}>
                            <View style={styles.sectionHeaderRow}>
                                <Text style={styles.sectionTitle}>Month By Month Trend</Text>
                                <Text style={styles.sectionMetaText}>{monthlySummaries.length} month windows</Text>
                            </View>

                            {isLoadingMonthlySummary ? (
                                <ActivityIndicator size="small" color={Colors.light.greenButtonBackground} style={styles.monthlyLoadingIndicator} />
                            ) : (
                                <MonthlyTrendChart monthlySummaries={monthlySummaries} maxMonthlyValue={maxMonthlyValue} />
                            )}
                        </View>
                    </>
                )}
            </ScrollView>
        </View>
    );
}


//#region STYLES
const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: Colors.light.salesManagerBackground || Colors.light.mainBackground,
    },
    contentContainer: {
        flex: 1,
        width: "100%",
    },
    scrollContentContainer: {
        width: "100%",
        maxWidth: 1100,
        alignSelf: "center",
        padding: 20,
        paddingBottom: 34,
    },
    pageHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 16,
        marginBottom: 18,
    },
    pageTitle: {
        fontFamily: Fonts.bold,
        fontSize: 28,
        color: Colors.light.greenButtonBackground,
    },
    pageSubtitle: {
        marginTop: 4,
        fontFamily: Fonts.regular,
        fontSize: 14,
        color: Colors.light.basePriceDiscountedTextColor,
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
        marginBottom: 10,
    },
    dateInputContainer: {
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
    invalidFilterInput: {
        borderColor: Colors.light.errorText,
    },
    filterErrorText: {
        marginTop: 4,
        fontFamily: Fonts.semibold,
        fontSize: 12,
        color: Colors.light.errorText,
    },
    rangeErrorText: {
        marginBottom: 10,
        fontFamily: Fonts.semibold,
        fontSize: 13,
        color: Colors.light.errorText,
    },
    filterButtonContainer: {
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 10,
    },
    filterButtonWrapper: {
        minWidth: 150,
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
    secondaryButtonWrapper: {
        minWidth: 150,
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.light.greenButtonBackground,
        paddingVertical: 11,
        paddingHorizontal: 14,
    },
    secondaryButtonText: {
        fontFamily: Fonts.semibold,
        fontSize: 14,
        color: Colors.light.greenButtonBackground,
    },

    /* STATES */
    loadingIndicator: {
        marginTop: 50,
    },
    emptySummaryText: {
        marginTop: 40,
        textAlign: "center",
        fontFamily: Fonts.semibold,
        fontSize: 16,
        color: Colors.light.greenButtonBackground,
    },

    /* SUMMARY */
    dateRangeContainer: {
        backgroundColor: Colors.light.softContainerBackground,
        borderRadius: 8,
        padding: 14,
        marginBottom: 16,
    },
    dateRangeTitle: {
        fontFamily: Fonts.bold,
        fontSize: 16,
        color: Colors.light.greenButtonBackground,
    },
    dateRangeText: {
        marginTop: 4,
        fontFamily: Fonts.semibold,
        fontSize: 15,
        color: Colors.light.mainTextColor,
    },
    dateRangeMeta: {
        marginTop: 4,
        fontFamily: Fonts.regular,
        fontSize: 12,
        color: Colors.light.basePriceDiscountedTextColor,
    },
    metricGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        marginBottom: 16,
    },
    metricCard: {
        flex: 1,
        minWidth: 170,
        backgroundColor: "#ffffff",
        borderRadius: 8,
        padding: 14,
        borderLeftWidth: 5,
        borderLeftColor: Colors.light.greenButtonBackground,
    },
    defaultMetricCard: {
        borderLeftColor: Colors.light.greenButtonBackground,
    },
    goodMetricCard: {
        borderLeftColor: "#2d6a4f",
    },
    warningMetricCard: {
        borderLeftColor: "#bc6c25",
    },
    dangerMetricCard: {
        borderLeftColor: Colors.light.deleteButtonBackground,
    },
    metricLabel: {
        marginBottom: 6,
        fontFamily: Fonts.semibold,
        fontSize: 13,
        color: Colors.light.basePriceDiscountedTextColor,
    },
    metricValue: {
        fontFamily: Fonts.bold,
        fontSize: 21,
        color: Colors.light.mainTextColor,
    },
    sectionContainer: {
        backgroundColor: Colors.light.softContainerBackground,
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        marginBottom: 14,
        fontFamily: Fonts.bold,
        fontSize: 18,
        color: Colors.light.greenButtonBackground,
    },
    sectionHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        marginBottom: 14,
    },
    sectionMetaText: {
        fontFamily: Fonts.semibold,
        fontSize: 12,
        color: Colors.light.basePriceDiscountedTextColor,
    },
    summaryBarContainer: {
        marginBottom: 14,
    },
    summaryBarHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 6,
    },
    summaryBarLabel: {
        fontFamily: Fonts.semibold,
        fontSize: 14,
        color: Colors.light.mainTextColor,
    },
    summaryBarValue: {
        fontFamily: Fonts.bold,
        fontSize: 14,
        color: Colors.light.mainTextColor,
    },
    summaryBarTrack: {
        height: 12,
        borderRadius: 6,
        overflow: "hidden",
        backgroundColor: "#ffffff",
    },
    summaryBarFill: {
        height: "100%",
        borderRadius: 6,
    },
    ratioGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        marginTop: 8,
    },
    ratioCard: {
        flex: 1,
        minWidth: 180,
        backgroundColor: "#ffffff",
        borderRadius: 8,
        padding: 12,
    },
    ratioLabel: {
        marginBottom: 4,
        fontFamily: Fonts.semibold,
        fontSize: 12,
        color: Colors.light.basePriceDiscountedTextColor,
    },
    ratioValue: {
        fontFamily: Fonts.bold,
        fontSize: 18,
        color: Colors.light.greenButtonBackground,
    },
    monthlyLoadingIndicator: {
        marginVertical: 20,
    },
    emptyMonthlyText: {
        fontFamily: Fonts.semibold,
        fontSize: 14,
        color: Colors.light.basePriceDiscountedTextColor,
        textAlign: "center",
        marginVertical: 16,
    },
    monthlyTrendContainer: {
        gap: 14,
        backgroundColor: "#ffffff",
        borderRadius: 8,
        padding: 12,
    },
    monthlyLegendContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        flexWrap: "wrap",
    },
    monthlyLegendItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    monthlyLegendSwatch: {
        width: 12,
        height: 12,
        borderRadius: 2,
    },
    monthlyLegendText: {
        fontFamily: Fonts.semibold,
        fontSize: 12,
        color: Colors.light.mainTextColor,
    },
    monthlyChartCanvas: {
        minHeight: 250,
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 14,
        paddingTop: 12,
        paddingBottom: 6,
    },
    monthlyChartGroup: {
        width: 96,
        alignItems: "center",
    },
    monthlyChartBars: {
        height: 170,
        width: "100%",
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "center",
        gap: 6,
        borderBottomWidth: 1,
        borderBottomColor: "#c8bd96",
        paddingHorizontal: 8,
    },
    monthlyVerticalBarSlot: {
        width: 18,
        height: "100%",
        justifyContent: "flex-end",
    },
    monthlyVerticalBar: {
        width: "100%",
        minHeight: 2,
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
    },
    monthlyChartLabel: {
        marginTop: 8,
        fontFamily: Fonts.bold,
        fontSize: 12,
        color: Colors.light.greenButtonBackground,
        textAlign: "center",
    },
    monthlyChartValue: {
        marginTop: 3,
        fontFamily: Fonts.semibold,
        fontSize: 11,
        color: Colors.light.basePriceDiscountedTextColor,
        textAlign: "center",
    },
    monthlyChartTable: {
        gap: 6,
        borderTopWidth: 1,
        borderTopColor: "#efe7cf",
        paddingTop: 10,
    },
    monthlyChartTableRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    monthlyChartTableMonth: {
        width: 72,
        fontFamily: Fonts.bold,
        fontSize: 12,
        color: Colors.light.greenButtonBackground,
    },
    monthlyChartTableValue: {
        fontFamily: Fonts.semibold,
        fontSize: 12,
        color: Colors.light.mainTextColor,
    },
});
//#endregion
