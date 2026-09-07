import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../theme/colors';
import { Typography, Spacing, BorderRadius } from '../theme/typography';

export default function StatCard({ title, value, icon, iconColor, subtitle, compact = false }) {
  const bgColor = iconColor ? `${iconColor}15` : Colors.primaryGlow;

  if (compact) {
    return (
      <View style={styles.compactCard}>
        <View style={[styles.compactIconBg, { backgroundColor: bgColor }]}>
          <Ionicons name={icon} size={18} color={iconColor || Colors.primary} />
        </View>
        <Text style={styles.compactValue}>{value}</Text>
        <Text style={styles.compactTitle} numberOfLines={1}>{title}</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconBg, { backgroundColor: bgColor }]}>
          <Ionicons name={icon} size={22} color={iconColor || Colors.primary} />
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={styles.value}>{value}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.small,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  title: {
    ...Typography.captionMedium,
    color: Colors.textSecondary,
    flex: 1,
  },
  value: {
    ...Typography.number,
    color: Colors.text,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  // Compact
  compactCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    flex: 1,
    minWidth: 90,
  },
  compactIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  compactValue: {
    ...Typography.numberSmall,
    color: Colors.text,
    marginBottom: 2,
  },
  compactTitle: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
