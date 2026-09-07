import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { Typography, Spacing, BorderRadius } from '../theme/typography';
import { formatCurrency } from '../utils/currency';
import { getRelativeTime, formatDateTime } from '../utils/dateUtils';

const TYPE_CONFIG = {
  deposit: {
    icon: 'arrow-down-circle',
    color: Colors.success,
    bgColor: Colors.successBg,
    prefix: '+',
  },
  toll_deduction: {
    icon: 'car-outline',
    color: Colors.danger,
    bgColor: Colors.dangerBg,
    prefix: '-',
  },
  trip: {
    icon: 'car-outline',
    color: Colors.danger,
    bgColor: Colors.dangerBg,
    prefix: '-',
  },
  refund: {
    icon: 'return-up-back',
    color: Colors.info,
    bgColor: Colors.infoBg,
    prefix: '+',
  },
  deduction: {
    icon: 'arrow-up-circle',
    color: Colors.danger,
    bgColor: Colors.dangerBg,
    prefix: '-',
  },
};

export default function TransactionItem({ transaction }) {
  const config = TYPE_CONFIG[transaction.type] || TYPE_CONFIG.deposit;

  return (
    <View style={styles.container}>
      <View style={[styles.iconBg, { backgroundColor: config.bgColor }]}>
        <Ionicons name={config.icon} size={20} color={config.color} />
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{transaction.member_name || 'Member'}</Text>
        <Text style={styles.description} numberOfLines={1}>
          {transaction.description || transaction.note || (transaction.type === 'deposit' ? 'Member deposit' : 'Trip deduction')}
        </Text>
        <View style={styles.timeRow}>
          <Text style={styles.time}>{getRelativeTime(transaction.created_at)}</Text>
          <Text style={styles.dot}> • </Text>
          <Text style={styles.time}>{formatDateTime(transaction.created_at)}</Text>
        </View>
      </View>
      <Text style={[styles.amount, { color: config.color }]}>
        {config.prefix}{formatCurrency(transaction.amount)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  name: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  description: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 1,
  },
  time: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 2,
    fontSize: 11,
  },
  amount: {
    ...Typography.bodySemibold,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  dot: {
    color: Colors.textMuted,
    fontSize: 10,
  },
});
