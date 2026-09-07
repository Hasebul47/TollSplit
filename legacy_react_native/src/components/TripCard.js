import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../theme/colors';
import { Typography, Spacing, BorderRadius } from '../theme/typography';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/dateUtils';

export default function TripCard({ trip, travelers, onPress, onDelete, role }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        setExpanded(!expanded);
        onPress && onPress(trip);
      }}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={styles.dateContainer}>
          <View style={styles.dateBadge}>
            <Ionicons name="calendar-outline" size={14} color={Colors.primary} />
            <Text style={styles.dateText}>{formatDate(trip.trip_date)}</Text>
          </View>
        </View>
        <View style={styles.tollBadge}>
          <Text style={styles.tollText}>{formatCurrency(trip.total_toll)}</Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Ionicons name="people-outline" size={16} color={Colors.textMuted} />
          <Text style={styles.detailText}>{trip.traveler_count} travelers</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="person-outline" size={16} color={Colors.accent} />
          <Text style={[styles.detailText, { color: Colors.accent }]}>
            {formatCurrency(trip.per_person_cost)} each
          </Text>
        </View>
      </View>

      {trip.note ? (
        <Text style={styles.note} numberOfLines={expanded ? 5 : 1}>
          {trip.note}
        </Text>
      ) : null}

      {expanded && travelers && travelers.length > 0 && (
        <View style={styles.travelerList}>
          <Text style={styles.travelerTitle}>Travelers:</Text>
          {travelers.map((t, i) => (
            <View key={i} style={styles.travelerRow}>
              <View style={[styles.miniAvatar, { backgroundColor: t.avatar_color || Colors.primary }]}>
                <Text style={styles.miniAvatarText}>{t.member_name?.charAt(0) || '?'}</Text>
              </View>
              <Text style={styles.travelerName}>{t.member_name}</Text>
              <Text style={styles.travelerAmount}>-{formatCurrency(t.cost_share)}</Text>
            </View>
          ))}
        </View>
      )}

      {expanded && onDelete && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(trip)}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={16} color={Colors.danger} />
          <Text style={styles.deleteText}>Delete & Refund</Text>
        </TouchableOpacity>
      )}

      <View style={styles.expandIndicator}>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={Colors.textMuted}
        />
      </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  dateContainer: {
    flex: 1,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  dateText: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  tollBadge: {
    backgroundColor: Colors.primaryGlow,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: `${Colors.primary}30`,
  },
  tollText: {
    ...Typography.bodySemibold,
    color: Colors.primary,
  },
  details: {
    flexDirection: 'row',
    gap: Spacing.xl,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  detailText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  note: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    fontStyle: 'italic',
  },
  travelerList: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  travelerTitle: {
    ...Typography.captionMedium,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  travelerRow: {
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
  travelerName: {
    ...Typography.caption,
    color: Colors.text,
    flex: 1,
  },
  travelerAmount: {
    ...Typography.captionMedium,
    color: Colors.danger,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  deleteText: {
    ...Typography.captionMedium,
    color: Colors.danger,
  },
  expandIndicator: {
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
});
