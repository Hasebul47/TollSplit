import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, SafeAreaView, Alert,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../src/theme/colors';
import { Typography, Spacing, BorderRadius } from '../../src/theme/typography';
import { formatCurrency, getBalanceColor } from '../../src/utils/currency';
import { getRecentTransactions } from '../../src/database/transactionDao';
import { getGroupStats, getActiveGroupId, getGroupById } from '../../src/database/groupDao';
import { getMembers } from '../../src/database/memberDao';
import StatCard from '../../src/components/StatCard';
import TransactionItem from '../../src/components/TransactionItem';
import EmptyState from '../../src/components/EmptyState';
import { useUser } from '../../src/context/UserContext';

export default function DashboardScreen() {
  const { role, groupId, notification, clearNotification } = useUser();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!groupId) {
      setLoading(false);
      return;
    }
    try {
      const [groupData, groupStats, memberList, recent] = await Promise.all([
        getGroupById(groupId),
        getGroupStats(groupId),
        getMembers(groupId),
        getRecentTransactions(groupId, 8)
      ]);

      setGroup(groupData);
      setStats(groupStats);
      setMembers(memberList);
      setTransactions(recent);
    } catch (error) {
      console.log('Dashboard load error:', error);
      Alert.alert('Dashboard Load Error', error.message || String(error));
    } finally {
      setLoading(false);
    }
  }, [groupId]);

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

  const lowBalanceMembers = members.filter(m => m.balance < 100);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 100 + insets.bottom }
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Broadcast Notification */}
        {notification && (
          <View style={styles.notificationBanner}>
            <View style={styles.notificationIcon}>
              <Ionicons name="megaphone" size={20} color="#fff" />
            </View>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>Broadcast Message</Text>
              <Text style={styles.notificationText}>{notification.message}</Text>
            </View>
            <TouchableOpacity onPress={clearNotification} style={styles.notificationClose}>
              <Ionicons name="close" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>TollSplit</Text>
            <Text style={styles.groupName}>{group?.name || 'Loading...'}</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="settings-outline" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceGlow} />
          <Text style={styles.balanceLabel}>Group Balance</Text>
          <Text style={styles.balanceAmount}>
            {formatCurrency(stats?.totalBalance || 0)}
          </Text>
          <View style={styles.balanceStats}>
            <View style={styles.balanceStat}>
              <Ionicons name="arrow-down-circle" size={16} color={Colors.success} />
              <Text style={styles.balanceStatText}>
                {formatCurrency(stats?.totalDeposited || 0)}
              </Text>
              <Text style={styles.balanceStatLabel}>Deposited</Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceStat}>
              <Ionicons name="arrow-up-circle" size={16} color={Colors.danger} />
              <Text style={styles.balanceStatText}>
                {formatCurrency(stats?.totalSpent || 0)}
              </Text>
              <Text style={styles.balanceStatLabel}>Spent</Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <StatCard
            compact
            title="Members"
            value={stats?.memberCount || 0}
            icon="people"
            iconColor={Colors.accent}
          />
          <View style={{ width: Spacing.sm }} />
          <StatCard
            compact
            title="Total Trips"
            value={stats?.tripCount || 0}
            icon="car"
            iconColor={Colors.warning}
          />
          <View style={{ width: Spacing.sm }} />
          <StatCard
            compact
            title="Today"
            value={stats?.todayTrips || 0}
            icon="today"
            iconColor={Colors.success}
          />
        </View>

        {/* Quick Actions - Only for Admin */}
        {role === 'admin' && (
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/trip')}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${Colors.primary}20` }]}>
                <Ionicons name="add" size={24} color={Colors.primary} />
              </View>
              <Text style={styles.actionText}>New Trip</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/members')}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${Colors.accent}20` }]}>
                <Ionicons name="wallet" size={20} color={Colors.accent} />
              </View>
              <Text style={styles.actionText}>Add Deposit</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/members')}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${Colors.success}20` }]}>
                <Ionicons name="person-add" size={20} color={Colors.success} />
              </View>
              <Text style={styles.actionText}>Add Member</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Low Balance Warnings */}
        {lowBalanceMembers.length > 0 && (
          <View style={styles.warningSection}>
            <View style={styles.warningHeader}>
              <Ionicons name="warning" size={18} color={Colors.warning} />
              <Text style={styles.warningTitle}>Low Balance Alert</Text>
            </View>
            {lowBalanceMembers.map(m => (
              <View key={m.id} style={styles.warningItem}>
                <View style={[styles.miniAvatar, { backgroundColor: m.avatar_color }]}>
                  <Text style={styles.miniAvatarText}>{m.name.charAt(0)}</Text>
                </View>
                <Text style={styles.warningName}>{m.name}</Text>
                <Text style={[styles.warningBalance, { color: getBalanceColor(m.balance) }]}>
                  {formatCurrency(m.balance)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => router.push('/history')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {transactions.length > 0 ? (
            <View style={styles.transactionList}>
              {transactions.map((t, i) => (
                <TransactionItem key={t.id || i} transaction={t} />
              ))}
            </View>
          ) : (
            <EmptyState
              icon="receipt-outline"
              title="No transactions yet"
              subtitle="Start by adding members and creating trips"
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingTop: Spacing.section,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  greeting: {
    ...Typography.h1,
    color: Colors.primary,
    marginBottom: 2,
  },
  groupName: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Balance Card
  balanceCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: `${Colors.primary}25`,
    overflow: 'hidden',
    ...Shadows.glow,
  },
  balanceGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primaryGlow,
  },
  balanceLabel: {
    ...Typography.small,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  balanceAmount: {
    ...Typography.numberLarge,
    color: Colors.text,
    marginBottom: Spacing.xl,
  },
  balanceStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceStat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  balanceStatText: {
    ...Typography.bodySemibold,
    color: Colors.text,
  },
  balanceStatLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  balanceDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xl,
  },
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    marginBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  actionText: {
    ...Typography.captionMedium,
    color: Colors.textSecondary,
  },
  // Warning
  warningSection: {
    backgroundColor: Colors.warningBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xxl,
    borderWidth: 1,
    borderColor: `${Colors.warning}30`,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  warningTitle: {
    ...Typography.bodySemibold,
    color: Colors.warning,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  miniAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  miniAvatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  warningName: {
    ...Typography.bodyMedium,
    color: Colors.text,
    flex: 1,
  },
  warningBalance: {
    ...Typography.bodySemibold,
  },
  // Section
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.text,
  },
  seeAll: {
    ...Typography.captionMedium,
    color: Colors.primary,
  },
  // Notification
  notificationBanner: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: `${Colors.primary}30`,
    alignItems: 'center',
    ...Shadows.glow,
  },
  notificationIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    ...Typography.captionBold,
    color: Colors.primary,
    marginBottom: 2,
  },
  notificationText: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  notificationClose: {
    padding: 4,
  },
  transactionList: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
