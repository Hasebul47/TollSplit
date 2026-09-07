import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, SafeAreaView, Alert, TextInput, Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/theme/colors';
import { Typography, Spacing, BorderRadius } from '../../src/theme/typography';
import { formatCurrency } from '../../src/utils/currency';
import { getTransactions } from '../../src/database/transactionDao';
import { getTrips, deleteTrip, getReportByDateRange } from '../../src/database/tripDao';
import { getActiveGroupId } from '../../src/database/groupDao';
import { getCurrentMonth, getCurrentYear, getMonthName, getToday } from '../../src/utils/dateUtils';
import TripCard from '../../src/components/TripCard';
import TransactionItem from '../../src/components/TransactionItem';
import EmptyState from '../../src/components/EmptyState';
import { useUser } from '../../src/context/UserContext';
import AdminPasswordModal from '../../src/components/AdminPasswordModal';

export default function HistoryScreen() {
  const { role, groupId } = useUser();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('trips');
  const [trips, setTrips] = useState([]);
  const [tripTravelersMap, setTripTravelersMap] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // Month report states
  const [report, setReport] = useState(null);
  const [reportMonth, setReportMonth] = useState(getCurrentMonth());
  const [reportYear, setReportYear] = useState(getCurrentYear());

  // Date Range report states
  const [reportMode, setReportMode] = useState('month'); // 'month' or 'custom'
  const today = getToday();
  const initialStart = `${today.substring(0, 8)}01`;
  const [startDateInput, setStartDateInput] = useState(initialStart);
  const [endDateInput, setEndDateInput] = useState(today);
  const [reportStartDate, setReportStartDate] = useState(initialStart);
  const [reportEndDate, setReportEndDate] = useState(today);
  const [deleteAction, setDeleteAction] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const reportPromise = reportMode === 'month'
        ? getReportByDateRange(
            groupId,
            `${reportYear}-${reportMonth.toString().padStart(2, '0')}-01`,
            new Date(reportYear, reportMonth, 0).toISOString().split('T')[0]
          )
        : getReportByDateRange(groupId, reportStartDate, reportEndDate);

      const [tripList, txList, reportData] = await Promise.all([
        getTrips(groupId, 50),
        getTransactions(groupId, 100),
        reportPromise
      ]);

      setTrips(tripList);
      setTransactions(txList);
      setReport(reportData);
    } catch (error) {
      console.log('History load error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [groupId, reportMonth, reportYear, reportMode, reportStartDate, reportEndDate]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDeleteTrip = (trip) => {
    const formattedDate = trip.trip_date || trip.date || 'unknown date';
    setDeleteAction({
      title: 'Delete Trip',
      message: `Delete trip on ${formattedDate}?\nAll ${trip.traveler_count} travelers will be refunded ${formatCurrency(trip.per_person_cost)} each.`,
      confirmText: 'Delete & Refund',
      onConfirm: async () => {
        try {
          await deleteTrip(trip.id);
          await loadData();
          Alert.alert('Success', 'Trip deleted and travelers refunded');
        } catch (error) {
          Alert.alert('Error', 'Failed to delete trip');
        }
      }
    });
  };

  const changeMonth = (delta) => {
    let m = reportMonth + delta;
    let y = reportYear;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setReportMonth(m);
    setReportYear(y);
  };

  const handleApplyFilter = () => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDateInput) || !dateRegex.test(endDateInput)) {
      Alert.alert('Error', 'Please enter dates in YYYY-MM-DD format');
      return;
    }
    setReportStartDate(startDateInput);
    setReportEndDate(endDateInput);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {['trips', 'transactions', 'report'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'trips' ? 'Trips' : tab === 'transactions' ? 'All Transactions' : 'Monthly'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 100 + insets.bottom }
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Trips Tab */}
        {activeTab === 'trips' && (
          <>
            {trips.length === 0 ? (
              <EmptyState icon="car-outline" title="No trips yet" subtitle="Create your first trip from the New Trip tab" />
            ) : (
              trips.map(trip => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  travelers={trip.members || []}
                  onDelete={role === 'admin' ? handleDeleteTrip : null}
                />
              ))
            )}
          </>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <>
            {transactions.length === 0 ? (
              <EmptyState icon="receipt-outline" title="No transactions yet" subtitle="Deposits and toll deductions will appear here" />
            ) : (
              <View style={styles.transactionList}>
                {transactions.map((t, i) => (
                  <TransactionItem key={t.id || i} transaction={t} />
                ))}
              </View>
            )}
          </>
        )}

        {/* Monthly Report Tab */}
        {activeTab === 'report' && (
          <>
            {/* Report Mode Selector */}
            <View style={styles.modeToggleContainer}>
              <TouchableOpacity
                style={[styles.modeToggleBtn, reportMode === 'month' && styles.modeToggleBtnActive]}
                onPress={() => setReportMode('month')}
              >
                <Text style={[styles.modeToggleText, reportMode === 'month' && styles.modeToggleTextActive]}>
                  Calendar Month
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeToggleBtn, reportMode === 'custom' && styles.modeToggleBtnActive]}
                onPress={() => setReportMode('custom')}
              >
                <Text style={[styles.modeToggleText, reportMode === 'custom' && styles.modeToggleTextActive]}>
                  Custom Range
                </Text>
              </TouchableOpacity>
            </View>

            {/* Calendar Month Selector */}
            {reportMode === 'month' && (
              <View style={styles.monthSelector}>
                <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthArrow}>
                  <Ionicons name="chevron-back" size={24} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.monthText}>
                  {getMonthName(reportMonth)} {reportYear}
                </Text>
                <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthArrow}>
                  <Ionicons name="chevron-forward" size={24} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            )}

            {/* Custom Range Selector */}
            {reportMode === 'custom' && (
              <View style={styles.customRangeContainer}>
                <View style={styles.dateInputsRow}>
                  <View style={styles.dateInputWrapper}>
                    <Text style={styles.dateInputLabel}>Start Date</Text>
                    <View style={styles.dateDisplay}>
                      <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
                      <TextInput
                        style={styles.dateInput}
                        value={startDateInput}
                        onChangeText={setStartDateInput}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={Colors.textMuted}
                      />
                    </View>
                  </View>
                  <View style={styles.dateInputWrapper}>
                    <Text style={styles.dateInputLabel}>End Date</Text>
                    <View style={styles.dateDisplay}>
                      <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
                      <TextInput
                        style={styles.dateInput}
                        value={endDateInput}
                        onChangeText={setEndDateInput}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={Colors.textMuted}
                      />
                    </View>
                  </View>
                </View>
                <TouchableOpacity style={styles.applyFilterButton} onPress={handleApplyFilter}>
                  <Ionicons name="funnel-outline" size={16} color="#fff" />
                  <Text style={styles.applyFilterText}>Generate Report</Text>
                </TouchableOpacity>
              </View>
            )}

            {report && (
              <>
                {/* Summary Cards */}
                <View style={styles.reportSummary}>
                  <View style={styles.reportCard}>
                    <Ionicons name="car" size={24} color={Colors.warning} />
                    <Text style={styles.reportCardValue}>{report.tripCount}</Text>
                    <Text style={styles.reportCardLabel}>Trips</Text>
                  </View>
                  <View style={styles.reportCard}>
                    <Ionicons name="cash" size={24} color={Colors.danger} />
                    <Text style={styles.reportCardValue}>{formatCurrency(report.totalToll)}</Text>
                    <Text style={styles.reportCardLabel}>Total Toll</Text>
                  </View>
                </View>

                {/* Member Spending */}
                <Text style={styles.reportSectionTitle}>Member Spending</Text>
                {report.memberSpending && report.memberSpending.map((ms, i) => {
                  const maxSpend = Math.max(...report.memberSpending.map(x => x.total_spent), 1);
                  const barWidth = (ms.total_spent / maxSpend) * 100;
                  return (
                    <View key={ms.id || i} style={styles.spendingRow}>
                      <View style={styles.spendingInfo}>
                        <View style={[styles.spendingAvatar, { backgroundColor: ms.avatar_color || Colors.primary }]}>
                          <Text style={styles.spendingAvatarText}>{ms.name?.charAt(0)}</Text>
                        </View>
                        <View style={styles.spendingDetails}>
                          <Text style={styles.spendingName}>{ms.name}</Text>
                          <Text style={styles.spendingTrips}>{ms.trip_count} trips</Text>
                        </View>
                        <Text style={styles.spendingAmount}>{formatCurrency(ms.total_spent)}</Text>
                      </View>
                      <View style={styles.barContainer}>
                        <View style={[styles.bar, { width: `${barWidth}%` }]} />
                      </View>
                    </View>
                  );
                })}

                {report.memberSpending?.length === 0 && (
                  <Text style={styles.noDataText}>No data for this period</Text>
                )}
              </>
            )}
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
      <AdminPasswordModal
        visible={deleteAction !== null}
        title={deleteAction?.title}
        message={deleteAction?.message}
        confirmText={deleteAction?.confirmText}
        onConfirm={async () => {
          const action = deleteAction;
          setDeleteAction(null);
          if (action && action.onConfirm) {
            await action.onConfirm();
          }
        }}
        onCancel={() => setDeleteAction(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.section,
    paddingBottom: Spacing.md,
  },
  title: {
    ...Typography.h2,
    color: Colors.text,
  },
  // Tabs
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    ...Typography.captionMedium,
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: '#fff',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingTop: 0,
    paddingBottom: 100,
  },
  // Transactions
  transactionList: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  // Monthly Report
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  monthArrow: {
    padding: Spacing.sm,
  },
  monthText: {
    ...Typography.h4,
    color: Colors.text,
  },
  // Mode Toggle
  modeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    padding: 3,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modeToggleBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  modeToggleBtnActive: {
    backgroundColor: Colors.primary,
  },
  modeToggleText: {
    ...Typography.captionMedium,
    color: Colors.textSecondary,
  },
  modeToggleTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  // Custom Date Range
  customRangeContainer: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  dateInputsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  dateInputWrapper: {
    flex: 1,
  },
  dateInputLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  dateInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    padding: 0,
  },
  applyFilterButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  applyFilterText: {
    ...Typography.buttonSmall,
    color: '#fff',
  },
  reportSummary: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  reportCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  reportCardValue: {
    ...Typography.numberSmall,
    color: Colors.text,
  },
  reportCardLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  reportSectionTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  spendingRow: {
    marginBottom: Spacing.lg,
  },
  spendingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  spendingAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  spendingAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  spendingDetails: {
    flex: 1,
  },
  spendingName: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  spendingTrips: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  spendingAmount: {
    ...Typography.bodySemibold,
    color: Colors.primary,
  },
  barContainer: {
    height: 6,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  noDataText: {
    ...Typography.bodyMedium,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.section,
  },
});
