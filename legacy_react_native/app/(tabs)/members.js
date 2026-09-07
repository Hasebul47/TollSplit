import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, Alert, RefreshControl, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../src/theme/colors';
import { Typography, Spacing, BorderRadius } from '../../src/theme/typography';
import { formatCurrency, getBalanceColor } from '../../src/utils/currency';
import {
  getMembers, addMember, addDeposit, updateMember,
  deactivateMember, getMemberStats,
} from '../../src/database/memberDao';
import { getActiveGroupId, getGroupById } from '../../src/database/groupDao';
import EmptyState from '../../src/components/EmptyState';
import { useUser } from '../../src/context/UserContext';
import AdminPasswordModal from '../../src/components/AdminPasswordModal';

export default function MembersScreen() {
  const { role, groupId: ctxGroupId } = useUser();
  const insets = useSafeAreaInsets();
  const [members, setMembers] = useState([]);
  const [group, setGroup] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Add Member Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newDeposit, setNewDeposit] = useState('');

  // Deposit Modal
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositMember, setDepositMember] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositNote, setDepositNote] = useState('');
  const [depositType, setDepositType] = useState('deposit');

  // Edit Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // Member Detail Modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailMember, setDetailMember] = useState(null);
  const [memberStats, setMemberStats] = useState(null);
  const [deleteAction, setDeleteAction] = useState(null);

  const loadData = useCallback(async () => {
    if (!ctxGroupId) return;
    try {
      const [groupData, memberList] = await Promise.all([
        getGroupById(ctxGroupId),
        getMembers(ctxGroupId)
      ]);
      setGroup(groupData);
      setMembers(memberList);
    } catch (error) {
      console.log('Members load error:', error);
    }
  }, [ctxGroupId]);

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

  const handleAddMember = async () => {
    if (!newName.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }
    try {
      const deposit = parseFloat(newDeposit) || 0;
      await addMember(ctxGroupId, newName.trim(), newPhone.trim(), deposit);
      setShowAddModal(false);
      setNewName('');
      setNewPhone('');
      setNewDeposit('');
      await loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to add member');
    }
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    try {
      await addDeposit(ctxGroupId, depositMember.id, amount, depositNote.trim(), depositType);
      setShowDepositModal(false);
      setDepositAmount('');
      setDepositNote('');
      setDepositType('deposit');
      setDepositMember(null);
      await loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to process transaction');
    }
  };

  const handleEdit = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }
    try {
      await updateMember(editMember.id, editName.trim(), editPhone.trim());
      setShowEditModal(false);
      await loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to update member');
    }
  };

  const handleDeactivate = (member) => {
    setDeleteAction({
      title: 'Deactivate Member',
      message: `Are you sure you want to deactivate ${member.name}? Their balance will be preserved.`,
      confirmText: 'Deactivate',
      onConfirm: async () => {
        try {
          await deactivateMember(member.id);
          await loadData();
          Alert.alert('Success', 'Member deactivated successfully');
        } catch (error) {
          Alert.alert('Error', 'Failed to deactivate member');
        }
      }
    });
  };

  const openDetail = async (member) => {
    setDetailMember(member);
    const stats = await getMemberStats(member.id);
    setMemberStats(stats);
    setShowDetailModal(true);
  };

  const openDeposit = (member) => {
    setDepositMember(member);
    setDepositAmount(group?.default_deposit?.toString() || '300');
    setShowDepositModal(true);
  };

  const openEdit = (member) => {
    setEditMember(member);
    setEditName(member.name);
    setEditPhone(member.phone || '');
    setShowEditModal(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Members</Text>
        {role === 'admin' && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              setNewDeposit(group?.default_deposit?.toString() || '300');
              setShowAddModal(true);
            }}
          >
            <Ionicons name="person-add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        )}
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
        {/* Summary Bar */}
        <View style={styles.summaryBar}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{members.length}</Text>
            <Text style={styles.summaryLabel}>Active</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {formatCurrency(members.reduce((s, m) => s + m.balance, 0))}
            </Text>
            <Text style={styles.summaryLabel}>Total Balance</Text>
          </View>
        </View>

        {members.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title="No members yet"
            subtitle='Tap "Add" to add your first group member'
          />
        ) : (
          members.map((member) => {
            const initial = member.name.charAt(0).toUpperCase();
            const balanceColor = getBalanceColor(member.balance);
            return (
              <TouchableOpacity
                key={member.id}
                style={styles.memberCard}
                onPress={() => openDetail(member)}
                activeOpacity={0.7}
              >
                <View style={styles.memberRow}>
                  <View style={[styles.avatar, { backgroundColor: member.avatar_color || Colors.primary }]}>
                    <Text style={styles.avatarText}>{initial}</Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    {member.phone ? <Text style={styles.memberPhone}>{member.phone}</Text> : null}
                  </View>
                  <View style={styles.memberBalance}>
                    <Text style={[styles.balanceText, { color: balanceColor }]}>
                      {formatCurrency(member.balance)}
                    </Text>
                    <View style={[styles.balanceDot, { backgroundColor: balanceColor }]} />
                  </View>
                </View>
                {role === 'admin' && (
                  <View style={styles.memberActions}>
                    <TouchableOpacity
                      style={styles.memberAction}
                      onPress={() => openDeposit(member)}
                    >
                      <Ionicons name="add-circle-outline" size={16} color={Colors.success} />
                      <Text style={[styles.memberActionText, { color: Colors.success }]}>Deposit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.memberAction}
                      onPress={() => openEdit(member)}
                    >
                      <Ionicons name="create-outline" size={16} color={Colors.accent} />
                      <Text style={[styles.memberActionText, { color: Colors.accent }]}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.memberAction}
                      onPress={() => handleDeactivate(member)}
                    >
                      <Ionicons name="person-remove-outline" size={16} color={Colors.danger} />
                      <Text style={[styles.memberActionText, { color: Colors.danger }]}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add Member Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Member</Text>
                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                  <Ionicons name="close-circle" size={28} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Name *</Text>
              <TextInput
                style={styles.input}
                value={newName}
                onChangeText={setNewName}
                placeholder="Enter member name"
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={styles.inputLabel}>Phone</Text>
              <TextInput
                style={styles.input}
                value={newPhone}
                onChangeText={setNewPhone}
                placeholder="Phone number (optional)"
                placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad"
              />

              <Text style={styles.inputLabel}>Initial Deposit (BDT)</Text>
              <TextInput
                style={styles.input}
                value={newDeposit}
                onChangeText={setNewDeposit}
                placeholder="0"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
              />

              <TouchableOpacity style={styles.submitButton} onPress={handleAddMember}>
                <Text style={styles.submitButtonText}>Add Member</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Deposit Modal */}
      <Modal visible={showDepositModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {depositType === 'deposit' ? 'Add Money' : 'Deduct Money'}
                </Text>
                <TouchableOpacity onPress={() => setShowDepositModal(false)}>
                  <Ionicons name="close-circle" size={28} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.roleToggle}>
                <TouchableOpacity
                  style={[styles.roleBtn, depositType === 'deposit' && styles.roleBtnActive]}
                  onPress={() => setDepositType('deposit')}
                >
                  <Text style={[styles.roleBtnText, depositType === 'deposit' && styles.roleBtnTextActive]}>Deposit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleBtn, depositType === 'deduction' && styles.roleBtnActive, depositType === 'deduction' && { backgroundColor: Colors.danger }]}
                  onPress={() => setDepositType('deduction')}
                >
                  <Text style={[styles.roleBtnText, depositType === 'deduction' && styles.roleBtnTextActive]}>Deduction</Text>
                </TouchableOpacity>
              </View>

              {depositMember && (
                <View style={styles.depositInfo}>
                  <View style={[styles.smallAvatar, { backgroundColor: depositMember.avatar_color }]}>
                    <Text style={styles.smallAvatarText}>{depositMember.name.charAt(0)}</Text>
                  </View>
                  <Text style={styles.depositMemberName}>{depositMember.name}</Text>
                  <Text style={[styles.depositCurrentBalance, { color: getBalanceColor(depositMember.balance) }]}>
                    Current: {formatCurrency(depositMember.balance)}
                  </Text>
                </View>
              )}

              <Text style={styles.inputLabel}>Amount (BDT) *</Text>
              <TextInput
                style={styles.input}
                value={depositAmount}
                onChangeText={setDepositAmount}
                placeholder="300"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Note</Text>
              <TextInput
                style={styles.input}
                value={depositNote}
                onChangeText={setDepositNote}
                placeholder={depositType === 'deposit' ? 'e.g. Weekly deposit' : 'e.g. Error correction'}
                placeholderTextColor={Colors.textMuted}
              />

              <TouchableOpacity 
                style={[styles.submitButton, { backgroundColor: depositType === 'deposit' ? Colors.success : Colors.danger }]} 
                onPress={handleDeposit}
              >
                <Ionicons name={depositType === 'deposit' ? "arrow-down-circle" : "arrow-up-circle"} size={20} color="#fff" />
                <Text style={styles.submitButtonText}>
                  {depositType === 'deposit' ? 'Confirm Deposit' : 'Confirm Deduction'}
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Member</Text>
                <TouchableOpacity onPress={() => setShowEditModal(false)}>
                  <Ionicons name="close-circle" size={28} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Name *</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter name"
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={styles.inputLabel}>Phone</Text>
              <TextInput
                style={styles.input}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="Phone number"
                placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad"
              />

              <TouchableOpacity style={[styles.submitButton, { backgroundColor: Colors.accent }]} onPress={handleEdit}>
                <Text style={styles.submitButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Detail Modal */}
      <Modal visible={showDetailModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Member Details</Text>
                <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                  <Ionicons name="close-circle" size={28} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>

              {detailMember && (
                <>
                  <View style={styles.detailHeader}>
                    <View style={[styles.bigAvatar, { backgroundColor: detailMember.avatar_color }]}>
                      <Text style={styles.bigAvatarText}>{detailMember.name.charAt(0)}</Text>
                    </View>
                    <Text style={styles.detailName}>{detailMember.name}</Text>
                    {detailMember.phone ? (
                      <Text style={styles.detailPhone}>{detailMember.phone}</Text>
                    ) : null}
                  </View>

                  <View style={styles.detailStats}>
                    <View style={styles.detailStat}>
                      <Text style={[styles.detailStatValue, { color: getBalanceColor(detailMember.balance) }]}>
                        {formatCurrency(detailMember.balance)}
                      </Text>
                      <Text style={styles.detailStatLabel}>Balance</Text>
                    </View>
                    <View style={styles.detailStat}>
                      <Text style={styles.detailStatValue}>{formatCurrency(memberStats?.totalDeposits || 0)}</Text>
                      <Text style={styles.detailStatLabel}>Deposited</Text>
                    </View>
                    <View style={styles.detailStat}>
                      <Text style={styles.detailStatValue}>{formatCurrency(memberStats?.totalSpent || 0)}</Text>
                      <Text style={styles.detailStatLabel}>Spent</Text>
                    </View>
                    <View style={styles.detailStat}>
                      <Text style={styles.detailStatValue}>{memberStats?.tripCount || 0}</Text>
                      <Text style={styles.detailStatLabel}>Trips</Text>
                    </View>
                  </View>
                </>
              )}

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowDetailModal(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.section,
    paddingBottom: Spacing.lg,
  },
  title: {
    ...Typography.h2,
    color: Colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
    ...Shadows.medium,
  },
  addButtonText: {
    ...Typography.buttonSmall,
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
  // Summary
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    ...Typography.numberSmall,
    color: Colors.text,
    marginBottom: 2,
  },
  summaryLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
  // Member Card
  memberCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.small,
  },
  memberRow: {
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
  memberInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  memberName: {
    ...Typography.bodySemibold,
    color: Colors.text,
  },
  memberPhone: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 2,
  },
  memberBalance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  balanceText: {
    ...Typography.numberSmall,
  },
  balanceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  memberActions: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    justifyContent: 'space-around',
  },
  memberAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  memberActionText: {
    ...Typography.captionMedium,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    maxHeight: '85%',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    padding: Spacing.xxl,
    paddingBottom: Spacing.section,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  inputLabel: {
    ...Typography.captionMedium,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  input: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    color: Colors.text,
    ...Typography.body,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.xxl,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadows.medium,
  },
  submitButtonText: {
    ...Typography.button,
    color: '#fff',
  },
  // Deposit info
  depositInfo: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.md,
  },
  smallAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  smallAvatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  depositMemberName: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: 4,
  },
  depositCurrentBalance: {
    ...Typography.bodyMedium,
  },
  // Detail Modal
  detailHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  bigAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  bigAvatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  detailName: {
    ...Typography.h3,
    color: Colors.text,
  },
  detailPhone: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 4,
  },
  detailStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  detailStat: {
    flex: 1,
    minWidth: '40%',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  detailStatValue: {
    ...Typography.numberSmall,
    color: Colors.text,
    marginBottom: 4,
  },
  detailStatLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  closeButton: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  closeButtonText: {
    ...Typography.button,
    color: Colors.textSecondary,
  },
  // Toggle
  roleToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    padding: 2,
    marginBottom: Spacing.lg,
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  roleBtnActive: {
    backgroundColor: Colors.primary,
  },
  roleBtnText: {
    ...Typography.captionMedium,
    color: Colors.textSecondary,
  },
  roleBtnTextActive: {
    color: '#fff',
  },
});
