import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Shadows } from '../../src/theme/colors';
import { Typography, Spacing, BorderRadius } from '../../src/theme/typography';
import { formatCurrency, getBalanceColor } from '../../src/utils/currency';
import { getToday } from '../../src/utils/dateUtils';
import { getMembers } from '../../src/database/memberDao';
import { createTrip } from '../../src/database/tripDao';
import { getActiveGroupId, getGroupById } from '../../src/database/groupDao';
import { useUser } from '../../src/context/UserContext';

export default function TripScreen() {
  const { role, groupId: ctxGroupId } = useUser();
  const insets = useSafeAreaInsets();
  const [members, setMembers] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [tollAmount, setTollAmount] = useState('80');
  const [tripDate, setTripDate] = useState(getToday());
  const [note, setNote] = useState('');
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const loadData = useCallback(async () => {
    if (!ctxGroupId) return;
    try {
      const [groupData, memberList] = await Promise.all([
        getGroupById(ctxGroupId),
        getMembers(ctxGroupId)
      ]);
      setGroup(groupData);
      setTollAmount(groupData?.default_toll?.toString() || '80');
      setMembers(memberList);
      setSelectedIds(new Set());
      setSuccess(false);
      setLastResult(null);
    } catch (error) {
      console.log('Trip load error:', error);
    }
  }, [ctxGroupId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const toggleMember = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
  };

  const selectAll = () => {
    if (selectedIds.size === members.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(members.map(m => m.id)));
    }
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
  };

  const toll = parseFloat(tollAmount) || 0;
  const travelerCount = selectedIds.size;
  const perPerson = travelerCount > 0 ? Math.round((toll / travelerCount) * 100) / 100 : 0;

  const handleSubmit = async () => {
    if (travelerCount === 0) {
      Alert.alert('Error', 'Please select at least one traveler');
      return;
    }
    if (toll <= 0) {
      Alert.alert('Error', 'Please enter a valid toll amount');
      return;
    }

    Alert.alert(
      'Confirm Trip',
      `Toll: ${formatCurrency(toll)}\nTravelers: ${travelerCount}\nEach pays: ${formatCurrency(perPerson)}\n\nProceed with deduction?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await createTrip(
                ctxGroupId,
                tripDate,
                toll,
                Array.from(selectedIds),
                note.trim()
              );
              setLastResult(result);
              setSuccess(true);
              try {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              } catch (e) {}
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to create trip');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (success && lastResult) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
          </View>
          <Text style={styles.successTitle}>Trip Created!</Text>
          <Text style={styles.successSubtitle}>
            {formatCurrency(toll)} split among {lastResult.travelerCount} travelers
          </Text>
          <View style={styles.successCard}>
            <View style={styles.successRow}>
              <Text style={styles.successLabel}>Toll Amount</Text>
              <Text style={styles.successValue}>{formatCurrency(toll)}</Text>
            </View>
            <View style={styles.successRow}>
              <Text style={styles.successLabel}>Travelers</Text>
              <Text style={styles.successValue}>{lastResult.travelerCount}</Text>
            </View>
            <View style={styles.successRow}>
              <Text style={styles.successLabel}>Per Person</Text>
              <Text style={[styles.successValue, { color: Colors.primary }]}>
                {formatCurrency(lastResult.perPersonCost)}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.newTripButton}
            onPress={() => {
              setSuccess(false);
              setLastResult(null);
              setSelectedIds(new Set());
              setNote('');
              loadData();
            }}
          >
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.newTripText}>Create Another Trip</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 160 + insets.bottom }
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>New Trip</Text>
            <Text style={styles.subtitle}>Select travelers & split the toll</Text>
          </View>

          {/* Toll Input */}
          <View style={styles.tollSection}>
            <Text style={styles.sectionLabel}>Toll Amount (BDT)</Text>
            <View style={styles.tollInputContainer}>
              <Ionicons name="cash-outline" size={24} color={Colors.primary} />
              <TextInput
                style={styles.tollInput}
                value={tollAmount}
                onChangeText={setTollAmount}
                keyboardType="numeric"
                placeholder="80"
                placeholderTextColor={Colors.textMuted}
              />
              <Text style={styles.tollCurrency}>BDT</Text>
            </View>
          </View>

          {/* Date */}
          <View style={styles.dateSection}>
            <Text style={styles.sectionLabel}>Trip Date</Text>
            <View style={styles.dateDisplay}>
              <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
              <TextInput
                style={styles.dateInput}
                value={tripDate}
                onChangeText={setTripDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          </View>

          {/* Live Calculation */}
          {travelerCount > 0 && (
            <View style={styles.calcCard}>
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>
                  {formatCurrency(toll)} ÷ {travelerCount} travelers
                </Text>
              </View>
              <Text style={styles.calcResult}>= {formatCurrency(perPerson)} each</Text>
            </View>
          )}

          {/* Member Selection */}
          <View style={styles.memberSection}>
            <View style={styles.memberHeader}>
              <Text style={styles.sectionLabel}>
                Select Travelers ({travelerCount}/{members.length})
              </Text>
              <TouchableOpacity onPress={selectAll} style={styles.selectAllButton}>
                <Text style={styles.selectAllText}>
                  {selectedIds.size === members.length ? 'Deselect All' : 'Select All'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.memberGrid}>
              {members.map((member) => {
                const selected = selectedIds.has(member.id);
                const initial = member.name.charAt(0).toUpperCase();
                return (
                  <TouchableOpacity
                    key={member.id}
                    style={[
                      styles.memberItem,
                      selected && styles.memberItemSelected,
                    ]}
                    onPress={() => toggleMember(member.id)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.memberAvatar,
                        { backgroundColor: member.avatar_color },
                        selected && styles.memberAvatarSelected,
                      ]}
                    >
                      {selected ? (
                        <Ionicons name="checkmark" size={22} color="#fff" />
                      ) : (
                        <Text style={styles.memberAvatarText}>{initial}</Text>
                      )}
                    </View>
                    <Text style={[styles.memberName, selected && styles.memberNameSelected]} numberOfLines={1}>
                      {member.name}
                    </Text>
                    <Text style={[styles.memberBal, { color: getBalanceColor(member.balance) }]}>
                      {formatCurrency(member.balance)}
                    </Text>
                    {selected && perPerson > 0 && (
                      <Text style={styles.deductLabel}>-{formatCurrency(perPerson)}</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {members.length === 0 && (
              <View style={styles.noMembers}>
                <Ionicons name="people-outline" size={40} color={Colors.textMuted} />
                <Text style={styles.noMembersText}>No members yet. Add members first.</Text>
              </View>
            )}
          </View>

          {/* Note */}
          <View style={styles.noteSection}>
            <Text style={styles.sectionLabel}>Note (optional)</Text>
            <TextInput
              style={styles.noteInput}
              value={note}
              onChangeText={setNote}
              placeholder="e.g., Morning trip, Return trip..."
              placeholderTextColor={Colors.textMuted}
              multiline
            />
          </View>

          <View style={{ height: 160 }} />
        </ScrollView>

        {/* Submit Button - Only for Admin */}
        {role === 'admin' ? (
          <View style={[styles.submitContainer, { bottom: 60 + insets.bottom }]}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (travelerCount === 0 || loading) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={travelerCount === 0 || loading}
            >
              <Ionicons name="car" size={22} color="#fff" />
              <Text style={styles.submitText}>
                {loading ? 'Processing...' : `Split ${formatCurrency(toll)} → ${travelerCount} travelers`}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.submitContainer, { bottom: 60 + insets.bottom, backgroundColor: 'transparent', borderTopWidth: 0 }]}>
            <View style={[styles.submitButton, { backgroundColor: Colors.surfaceElevated }]}>
              <Ionicons name="eye" size={20} color={Colors.textMuted} />
              <Text style={[styles.submitText, { color: Colors.textMuted }]}>View Only Mode</Text>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
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
    marginBottom: Spacing.xxl,
  },
  title: {
    ...Typography.h2,
    color: Colors.text,
  },
  subtitle: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  // Toll
  tollSection: {
    marginBottom: Spacing.xl,
  },
  sectionLabel: {
    ...Typography.captionMedium,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tollInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  tollInput: {
    flex: 1,
    ...Typography.number,
    color: Colors.text,
  },
  tollCurrency: {
    ...Typography.bodyMedium,
    color: Colors.textMuted,
  },
  // Date
  dateSection: {
    marginBottom: Spacing.xl,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  dateInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.text,
  },
  // Calc
  calcCard: {
    backgroundColor: Colors.primaryGlow,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: `${Colors.primary}30`,
    alignItems: 'center',
  },
  calcRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  calcLabel: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },
  calcResult: {
    ...Typography.number,
    color: Colors.primary,
  },
  // Members
  memberSection: {
    marginBottom: Spacing.xl,
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  selectAllButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.full,
  },
  selectAllText: {
    ...Typography.captionMedium,
    color: Colors.primary,
  },
  memberGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  memberItem: {
    width: '47%',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  memberItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryGlow2,
  },
  memberAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  memberAvatarSelected: {
    backgroundColor: `${Colors.primary} !important`,
  },
  memberAvatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  memberName: {
    ...Typography.bodyMedium,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 2,
  },
  memberNameSelected: {
    color: Colors.primaryLight,
  },
  memberBal: {
    ...Typography.caption,
  },
  deductLabel: {
    ...Typography.badge,
    color: Colors.danger,
    marginTop: 4,
    backgroundColor: Colors.dangerBg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  noMembers: {
    alignItems: 'center',
    padding: Spacing.section,
    gap: Spacing.md,
  },
  noMembersText: {
    ...Typography.bodyMedium,
    color: Colors.textMuted,
  },
  // Note
  noteSection: {
    marginBottom: Spacing.xxl,
  },
  noteInput: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    color: Colors.text,
    ...Typography.body,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  // Submit
  submitContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    padding: Spacing.lg,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadows.glow,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.surfaceElevated,
    shadowOpacity: 0,
  },
  submitText: {
    ...Typography.button,
    color: '#fff',
  },
  // Success
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  successIcon: {
    marginBottom: Spacing.xxl,
  },
  successTitle: {
    ...Typography.h2,
    color: Colors.success,
    marginBottom: Spacing.sm,
  },
  successSubtitle: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxl,
    textAlign: 'center',
  },
  successCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xxl,
    width: '100%',
    marginBottom: Spacing.xxl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  successRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  successLabel: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },
  successValue: {
    ...Typography.bodySemibold,
    color: Colors.text,
  },
  newTripButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadows.glow,
  },
  newTripText: {
    ...Typography.button,
    color: '#fff',
  },
});
