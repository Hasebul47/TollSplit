import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../theme/colors';
import { Typography, Spacing, BorderRadius } from '../theme/typography';
import { formatCurrency, getBalanceColor } from '../utils/currency';

export default function MemberCard({ member, onPress, onDeposit, compact = false }) {
  const initial = member.name ? member.name.charAt(0).toUpperCase() : '?';
  const balanceColor = getBalanceColor(member.balance);

  if (compact) {
    return (
      <TouchableOpacity
        style={styles.compactCard}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={[styles.avatar, { backgroundColor: member.avatar_color || Colors.primary }]}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={styles.compactInfo}>
          <Text style={styles.compactName} numberOfLines={1}>{member.name}</Text>
          <Text style={[styles.compactBalance, { color: balanceColor }]}>
            {formatCurrency(member.balance)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.row}>
        <View style={[styles.avatar, { backgroundColor: member.avatar_color || Colors.primary }]}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{member.name}</Text>
          {member.phone ? (
            <Text style={styles.phone}>{member.phone}</Text>
          ) : null}
        </View>
        <View style={styles.balanceContainer}>
          <Text style={[styles.balance, { color: balanceColor }]}>
            {formatCurrency(member.balance)}
          </Text>
          <View style={[styles.statusDot, { backgroundColor: balanceColor }]} />
        </View>
      </View>
      {onDeposit && (
        <TouchableOpacity
          style={styles.depositButton}
          onPress={() => onDeposit(member)}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle-outline" size={16} color={Colors.primary} />
          <Text style={styles.depositText}>Add Deposit</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.small,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...Typography.h4,
    color: '#fff',
    fontWeight: '800',
  },
  info: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  name: {
    ...Typography.bodySemibold,
    color: Colors.text,
  },
  phone: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 2,
  },
  balanceContainer: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  balance: {
    ...Typography.numberSmall,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  depositButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.xs,
  },
  depositText: {
    ...Typography.captionMedium,
    color: Colors.primary,
  },
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  compactInfo: {
    flex: 1,
    marginLeft: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compactName: {
    ...Typography.bodyMedium,
    color: Colors.text,
    flex: 1,
  },
  compactBalance: {
    ...Typography.bodySemibold,
  },
});
