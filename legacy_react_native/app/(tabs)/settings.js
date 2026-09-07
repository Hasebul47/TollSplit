import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, Alert, SafeAreaView, KeyboardAvoidingView, Platform,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../src/theme/colors';
import { Typography, Spacing, BorderRadius } from '../../src/theme/typography';
import {
  getGroups, addGroup, updateGroup, deleteGroup,
  getActiveGroupId, getGroupById,
} from '../../src/database/groupDao';
import { resetDatabase } from '../../src/database/database';
import { useUser } from '../../src/context/UserContext';
import { sendNotification } from '../../src/database/notificationDao';
import { getDevices, updateDeviceBanStatus, deleteDevice } from '../../src/database/deviceDao';
import AdminPasswordModal from '../../src/components/AdminPasswordModal';

export default function SettingsScreen() {
  const { role, updateRole, groupId, updateGroupId, deviceUserName, updateDeviceUserName } = useUser();
  const insets = useSafeAreaInsets();
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);

  // Group Modal
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editGroupId, setEditGroupId] = useState(null);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [groupToll, setGroupToll] = useState('80');
  const [groupDeposit, setGroupDeposit] = useState('300');

  // Password Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingRole, setPendingRole] = useState(null);
  const [deleteAction, setDeleteAction] = useState(null);
  const [passwordInput, setPasswordInput] = useState('');

  // Notification Modal
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [notifMessage, setNotifMessage] = useState('');
  const [sendingNotif, setSendingNotif] = useState(false);

  // Devices Modal
  const [showDevicesModal, setShowDevicesModal] = useState(false);
  const [devicesList, setDevicesList] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(false);

  // Device settings
  const [myDeviceName, setMyDeviceName] = useState(deviceUserName || '');

  // Admin password remember me
  const [rememberPassword, setRememberPassword] = useState(false);
  const [rememberedAdmin, setRememberedAdmin] = useState(false);

  useEffect(() => {
    setMyDeviceName(deviceUserName);
  }, [deviceUserName]);

  useEffect(() => {
    AsyncStorage.getItem('rememberAdminPassword').then(val => {
      if (val === 'true') {
        setRememberedAdmin(true);
      }
    });
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [gList, gData] = await Promise.all([
        getGroups(),
        getGroupById(groupId)
      ]);
      setGroups(gList);
      setActiveGroup(gData);
    } catch (error) {
      console.log('Settings load error:', error);
    }
  }, [groupId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleAddGroup = () => {
    setIsEditing(false);
    setGroupName('');
    setGroupDesc('');
    setGroupToll('80');
    setGroupDeposit('300');
    setShowGroupModal(true);
  };

  const handleEditGroup = (group) => {
    setIsEditing(true);
    setEditGroupId(group.id);
    setGroupName(group.name);
    setGroupDesc(group.description || '');
    setGroupToll(group.default_toll?.toString() || '80');
    setGroupDeposit(group.default_deposit?.toString() || '300');
    setShowGroupModal(true);
  };

  const handleSaveGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }
    try {
      const toll = parseFloat(groupToll) || 80;
      const deposit = parseFloat(groupDeposit) || 300;

      if (isEditing) {
        await updateGroup(editGroupId, groupName.trim(), groupDesc.trim(), toll, deposit);
      } else {
        const newId = await addGroup(groupName.trim(), groupDesc.trim(), toll, deposit);
        await updateGroupId(newId);
      }
      setShowGroupModal(false);
      await loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to save group');
    }
  };

  const handleSwitchGroup = async (id) => {
    await updateGroupId(id);
    const gData = await getGroupById(id);
    setActiveGroup(gData);
    Alert.alert('Group Switched', `Active group: ${gData.name}`);
  };

  const handleDeleteGroup = (group) => {
    if (groups.length <= 1) {
      Alert.alert('Error', 'Cannot delete the last group');
      return;
    }
    setDeleteAction({
      title: 'Delete Group',
      message: `Delete "${group.name}"? All data in this group will be hidden.`,
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          await deleteGroup(group.id);
          if (groupId === group.id) {
            const remaining = groups.filter(g => g.id !== group.id);
            if (remaining.length > 0) {
              await updateGroupId(remaining[0].id);
            }
          }
          await loadData();
          Alert.alert('Success', 'Group deleted');
        } catch (error) {
          Alert.alert('Error', 'Failed to delete group');
        }
      }
    });
  };

  const handleResetData = () => {
    if (role !== 'admin') {
      Alert.alert('Restricted', 'Only Admins can reset data.');
      return;
    }
    setDeleteAction({
      title: 'Reset All Data',
      message: 'This will DELETE ALL data including members, trips, and transactions. This cannot be undone!',
      confirmText: 'Delete Everything',
      onConfirm: async () => {
        try {
          await resetDatabase();
          await loadData();
          Alert.alert('Done', 'All data has been reset');
        } catch (error) {
          Alert.alert('Error', 'Failed to reset database');
        }
      }
    });
  };

  const handleRoleChange = async (newRole) => {
    if (newRole === 'admin') {
      const isSaved = await AsyncStorage.getItem('rememberAdminPassword');
      if (isSaved === 'true') {
        updateRole('admin');
        Alert.alert('Success', 'Admin mode enabled (Remembered)');
      } else {
        setPendingRole('admin');
        setPasswordInput('');
        setRememberPassword(false);
        setShowPasswordModal(true);
      }
    } else {
      updateRole('viewer');
    }
  };

  const verifyPassword = async () => {
    if (passwordInput === 'Neber007') {
      updateRole('admin');
      if (rememberPassword) {
        await AsyncStorage.setItem('rememberAdminPassword', 'true');
        setRememberedAdmin(true);
      }
      setShowPasswordModal(false);
      Alert.alert('Success', 'Admin mode enabled');
    } else {
      Alert.alert('Error', 'Incorrect password');
    }
  };

  const handleForgetPassword = async () => {
    Alert.alert(
      'Clear Saved Password',
      'Are you sure you want to clear the saved admin password on this device?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('rememberAdminPassword');
            setRememberedAdmin(false);
            Alert.alert('Success', 'Saved admin password cleared');
          }
        }
      ]
    );
  };

  const handleSendNotification = async () => {
    if (!notifMessage.trim()) return;
    setSendingNotif(true);
    try {
      await sendNotification(notifMessage.trim());
      setShowNotifModal(false);
      setNotifMessage('');
      Alert.alert('Success', 'Notification sent to all users');
    } catch (error) {
      Alert.alert('Error', 'Failed to send notification');
    } finally {
      setSendingNotif(false);
    }
  };

  const loadDevices = async () => {
    setLoadingDevices(true);
    try {
      const devList = await getDevices();
      setDevicesList(devList);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch device list');
    } finally {
      setLoadingDevices(false);
    }
  };

  const openDevicesModal = () => {
    setShowDevicesModal(true);
    loadDevices();
  };

  const handleToggleBanDevice = async (device) => {
    const actionText = device.isBanned ? 'unban' : 'ban';
    Alert.alert(
      `${device.isBanned ? 'Unban' : 'Ban'} Device`,
      `Are you sure you want to ${actionText} device:\n${device.id}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateDeviceBanStatus(device.id, !device.isBanned);
              await loadDevices();
            } catch (error) {
              Alert.alert('Error', `Failed to ${actionText} device`);
            }
          }
        }
      ]
    );
  };

  const handleSaveDeviceName = async () => {
    if (!myDeviceName.trim()) {
      Alert.alert('Error', 'Please enter a device name');
      return;
    }
    try {
      await updateDeviceUserName(myDeviceName.trim());
      Alert.alert('Success', 'Device name updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update device name');
    }
  };

  const handleRemoveDevice = (device) => {
    setDeleteAction({
      title: 'Remove Device',
      message: `Are you sure you want to remove device:\n${device.id}?\n\nIf this user active again then again show in device list.`,
      confirmText: 'Remove',
      onConfirm: async () => {
        try {
          await deleteDevice(device.id);
          await loadDevices();
          Alert.alert('Success', 'Device removed successfully');
        } catch (error) {
          Alert.alert('Error', 'Failed to remove device');
        }
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 100 + insets.bottom }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Settings</Text>

        {/* Active Group Info */}
        {activeGroup && (
          <View style={styles.activeGroupCard}>
            <View style={styles.activeGroupGlow} />
            <Text style={styles.activeGroupLabel}>ACTIVE GROUP</Text>
            <Text style={styles.activeGroupName}>{activeGroup.name}</Text>
            {activeGroup.description ? (
              <Text style={styles.activeGroupDesc}>{activeGroup.description}</Text>
            ) : null}
            <View style={styles.activeGroupStats}>
              <View style={styles.activeGroupStat}>
                <Text style={styles.activeGroupStatValue}>{activeGroup.default_toll} BDT</Text>
                <Text style={styles.activeGroupStatLabel}>Default Toll</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.activeGroupStat}>
                <Text style={styles.activeGroupStatValue}>{activeGroup.default_deposit} BDT</Text>
                <Text style={styles.activeGroupStatLabel}>Default Deposit</Text>
              </View>
            </View>
            {role === 'admin' && (
              <TouchableOpacity
                style={styles.editActiveButton}
                onPress={() => handleEditGroup(activeGroup)}
              >
                <Ionicons name="create-outline" size={16} color={Colors.primary} />
                <Text style={styles.editActiveText}>Edit Settings</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Groups Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Groups</Text>
            {role === 'admin' && (
              <TouchableOpacity style={styles.addGroupButton} onPress={handleAddGroup}>
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.addGroupText}>New Group</Text>
              </TouchableOpacity>
            )}
          </View>

          {groups.map(group => (
            <TouchableOpacity
              key={group.id}
              style={[
                styles.groupItem,
                group.id === groupId && styles.groupItemActive,
              ]}
              onPress={() => handleSwitchGroup(group.id)}
              activeOpacity={0.7}
            >
              <View style={styles.groupItemRow}>
                <View style={[
                  styles.radioOuter,
                  group.id === groupId && styles.radioOuterActive,
                ]}>
                  {group.id === groupId && <View style={styles.radioInner} />}
                </View>
                <View style={styles.groupInfo}>
                  <Text style={styles.groupItemName}>{group.name}</Text>
                  <Text style={styles.groupItemMeta}>
                    Toll: {group.default_toll} BDT • Deposit: {group.default_deposit} BDT
                  </Text>
                </View>
                {role === 'admin' && (
                  <View style={styles.groupActions}>
                    <TouchableOpacity
                      style={styles.groupActionBtn}
                      onPress={() => handleEditGroup(group)}
                    >
                      <Ionicons name="create-outline" size={18} color={Colors.accent} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.groupActionBtn}
                      onPress={() => handleDeleteGroup(group)}
                    >
                      <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.aboutCard}>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>App</Text>
              <Text style={styles.aboutValue}>TollSplit v1.1.0</Text>
            </View>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>Storage</Text>
              <Text style={styles.aboutValue}>Cloud Firebase</Text>
            </View>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>Data</Text>
              <Text style={styles.aboutValue}>Real-time Sync</Text>
            </View>
          </View>
        </View>

        {/* Danger Zone */}
        {role === 'admin' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: Colors.danger }]}>Danger Zone</Text>
            <TouchableOpacity style={styles.dangerButton} onPress={handleResetData}>
              <Ionicons name="nuclear-outline" size={22} color={Colors.danger} />
              <View style={styles.dangerInfo}>
                <Text style={styles.dangerTitle}>Reset All Data</Text>
                <Text style={styles.dangerSubtitle}>Delete everything and start fresh</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Device Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Device Settings</Text>
          <View style={styles.aboutCard}>
            <Text style={styles.inputLabel}>This Device's Name</Text>
            <View style={styles.deviceNameInputRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginTop: 0 }]}
                value={myDeviceName}
                onChangeText={setMyDeviceName}
                placeholder="Enter your name"
                placeholderTextColor={Colors.textMuted}
              />
              <TouchableOpacity style={styles.saveDeviceNameBtn} onPress={handleSaveDeviceName}>
                <Text style={styles.saveDeviceNameText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* User Role Setting */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Access</Text>
          <View style={styles.aboutCard}>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>App Mode</Text>
              <View style={styles.roleToggle}>
                <TouchableOpacity 
                  style={[styles.roleBtn, role === 'viewer' && styles.roleBtnActive]}
                  onPress={() => handleRoleChange('viewer')}
                >
                  <Text style={[styles.roleBtnText, role === 'viewer' && styles.roleBtnTextActive]}>Viewer</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.roleBtn, role === 'admin' && styles.roleBtnActive]}
                  onPress={() => handleRoleChange('admin')}
                >
                  <Text style={[styles.roleBtnText, role === 'admin' && styles.roleBtnTextActive]}>Admin</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.roleHint}>
              {role === 'admin' 
                ? 'Full access: You can add trips and manage members.' 
                : 'View only: You can only see the data. Editing is disabled.'}
            </Text>
            {role === 'admin' && rememberedAdmin && (
              <TouchableOpacity 
                style={styles.forgetPasswordBtn} 
                onPress={handleForgetPassword}
              >
                <Text style={styles.forgetPasswordText}>Forget Admin Password on this device</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Admin Features */}
        {role === 'admin' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Admin Controls</Text>
            <View style={{ gap: Spacing.md }}>
              <TouchableOpacity 
                style={styles.adminActionBtn} 
                onPress={() => setShowNotifModal(true)}
              >
                <View style={[styles.actionIcon, { backgroundColor: `${Colors.primary}20` }]}>
                  <Ionicons name="megaphone" size={20} color={Colors.primary} />
                </View>
                <View style={styles.actionInfo}>
                  <Text style={styles.actionTitle}>Broadcast Message</Text>
                  <Text style={styles.actionSubtitle}>Send a notification to all viewers</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.adminActionBtn} 
                onPress={openDevicesModal}
              >
                <View style={[styles.actionIcon, { backgroundColor: `${Colors.accent}20` }]}>
                  <Ionicons name="hardware-chip-outline" size={20} color={Colors.accent} />
                </View>
                <View style={styles.actionInfo}>
                  <Text style={styles.actionTitle}>Manage Devices</Text>
                  <Text style={styles.actionSubtitle}>Ban or unban devices using the app</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        )}



        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 Developed by Kazi Hasebul Islam</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Group Modal */}
      <Modal visible={showGroupModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {isEditing ? 'Edit Group' : 'New Group'}
                </Text>
                <TouchableOpacity onPress={() => setShowGroupModal(false)}>
                  <Ionicons name="close-circle" size={28} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Group Name *</Text>
              <TextInput
                style={styles.input}
                value={groupName}
                onChangeText={setGroupName}
                placeholder="e.g., Morning Commute"
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={styles.input}
                value={groupDesc}
                onChangeText={setGroupDesc}
                placeholder="Optional description"
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={styles.inputLabel}>Default Toll Amount (BDT)</Text>
              <TextInput
                style={styles.input}
                value={groupToll}
                onChangeText={setGroupToll}
                placeholder="80"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Default Deposit Amount (BDT)</Text>
              <TextInput
                style={styles.input}
                value={groupDeposit}
                onChangeText={setGroupDeposit}
                placeholder="300"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
              />

              <TouchableOpacity style={styles.submitButton} onPress={handleSaveGroup}>
                <Text style={styles.submitButtonText}>
                  {isEditing ? 'Save Changes' : 'Create Group'}
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Password Modal */}
      <Modal visible={showPasswordModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { borderRadius: BorderRadius.xl, marginBottom: 'auto', marginTop: '30%', marginHorizontal: 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enter Admin Password</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <Ionicons name="close-circle" size={28} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              value={passwordInput}
              onChangeText={setPasswordInput}
              placeholder="Enter password"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
              autoFocus
            />

            <View style={styles.rememberMeRow}>
              <Text style={styles.rememberMeLabel}>Remember Admin Password</Text>
              <Switch
                value={rememberPassword}
                onValueChange={setRememberPassword}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={rememberPassword ? Colors.primaryLight : Colors.textMuted}
              />
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={verifyPassword}>
              <Text style={styles.submitButtonText}>Verify</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Notification Modal */}
      <Modal visible={showNotifModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Broadcast Message</Text>
                <TouchableOpacity onPress={() => setShowNotifModal(false)}>
                  <Ionicons name="close-circle" size={28} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.inputLabel}>Message</Text>
              <TextInput
                style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                value={notifMessage}
                onChangeText={setNotifMessage}
                placeholder="Type your message here..."
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={4}
              />

              <TouchableOpacity 
                style={[styles.submitButton, sendingNotif && { opacity: 0.7 }]} 
                onPress={handleSendNotification}
                disabled={sendingNotif}
              >
                <Text style={styles.submitButtonText}>
                  {sendingNotif ? 'Sending...' : 'Send to All Users'}
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Devices Management Modal */}
      <Modal visible={showDevicesModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Registered Devices</Text>
                  <Text style={styles.modalSubtitle}>Total active: {devicesList.length}</Text>
                </View>
                <TouchableOpacity onPress={() => setShowDevicesModal(false)}>
                  <Ionicons name="close-circle" size={28} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView 
                style={styles.devicesScroll}
                contentContainerStyle={{ paddingBottom: Spacing.xxl }}
                showsVerticalScrollIndicator={false}
              >
                {devicesList.map((device) => {
                  return (
                    <View key={device.id} style={styles.deviceRow}>
                      <View style={styles.deviceDetails}>
                        <View style={styles.deviceHeaderRow}>
                          <Ionicons 
                            name={device.os === 'ios' ? 'logo-apple' : 'logo-android'} 
                            size={18} 
                            color={Colors.textSecondary} 
                          />
                          <Text style={styles.deviceModelText}>
                            {device.userName || 'Unknown User'}
                          </Text>
                        </View>
                        <Text style={styles.deviceInfoSubtext}>
                          Model: {device.os === 'ios' ? 'iOS' : 'Android'} (v{device.osVersion || 'unknown'})
                        </Text>
                        <Text style={styles.deviceIdSubtext} numberOfLines={1}>ID: {device.id}</Text>
                        <Text style={styles.deviceActiveText}>
                          Active: {device.lastActive ? new Date(device.lastActive).toLocaleString() : 'Never'}
                        </Text>
                      </View>
                      
                      <View style={styles.deviceActionsRow}>
                        <TouchableOpacity
                          style={[
                            styles.banToggleBtn,
                            device.isBanned ? styles.unbanBtn : styles.banBtn
                          ]}
                          onPress={() => handleToggleBanDevice(device)}
                        >
                          <Text style={styles.banToggleText}>
                            {device.isBanned ? 'Unban' : 'Ban'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.removeDeviceBtn}
                          onPress={() => handleRemoveDevice(device)}
                        >
                          <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
                {devicesList.length === 0 && (
                  <Text style={styles.noDevicesText}>No registered devices found.</Text>
                )}
              </ScrollView>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingTop: Spacing.section,
    paddingBottom: 100,
  },
  title: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.xxl,
  },
  // Active Group
  activeGroupCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    marginBottom: Spacing.xxl,
    borderWidth: 1,
    borderColor: `${Colors.primary}25`,
    overflow: 'hidden',
    ...Shadows.glow,
  },
  activeGroupGlow: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primaryGlow,
  },
  activeGroupLabel: {
    ...Typography.small,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  activeGroupName: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: 4,
  },
  activeGroupDesc: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: Spacing.lg,
  },
  activeGroupStats: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
  },
  activeGroupStat: {
    flex: 1,
    alignItems: 'center',
  },
  activeGroupStatValue: {
    ...Typography.numberSmall,
    color: Colors.text,
    marginBottom: 2,
  },
  activeGroupStatLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  editActiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  editActiveText: {
    ...Typography.captionMedium,
    color: Colors.primary,
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
  addGroupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  addGroupText: {
    ...Typography.captionMedium,
    color: '#fff',
  },
  // Group Item
  groupItem: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  groupItemActive: {
    borderColor: `${Colors.primary}50`,
    backgroundColor: Colors.primaryGlow2,
  },
  groupItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  radioOuterActive: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  groupInfo: {
    flex: 1,
  },
  groupItemName: {
    ...Typography.bodySemibold,
    color: Colors.text,
  },
  groupItemMeta: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 2,
  },
  groupActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  groupActionBtn: {
    padding: Spacing.sm,
  },
  // About
  aboutCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  aboutLabel: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },
  aboutValue: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  // Admin Action
  adminActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    ...Typography.bodySemibold,
    color: Colors.text,
  },
  actionSubtitle: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  // Danger
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dangerBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: `${Colors.danger}30`,
    gap: Spacing.md,
  },
  dangerInfo: {
    flex: 1,
  },
  dangerTitle: {
    ...Typography.bodySemibold,
    color: Colors.danger,
  },
  dangerSubtitle: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 2,
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
    ...Shadows.medium,
  },
  submitButtonText: {
    ...Typography.button,
    color: '#fff',
  },
  // Footer
  footer: {
    marginTop: Spacing.xl,
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  footerText: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 12,
  },
  // Role Toggle
  roleToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    padding: 2,
  },
  roleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
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
  roleHint: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: Spacing.md,
    fontStyle: 'italic',
  },
  // Devices Management styles
  modalSubtitle: {
    ...Typography.captionMedium,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  devicesScroll: {
    maxHeight: 380,
    marginTop: Spacing.md,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  deviceDetails: {
    flex: 1,
    marginRight: Spacing.md,
    gap: 2,
  },
  deviceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  deviceModelText: {
    ...Typography.bodySemibold,
    color: Colors.text,
  },
  deviceIdSubtext: {
    ...Typography.small,
    fontSize: 10,
    color: Colors.textMuted,
  },
  deviceActiveText: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  banToggleBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  banBtn: {
    backgroundColor: Colors.dangerBg,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  unbanBtn: {
    backgroundColor: Colors.successBg,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  banToggleText: {
    ...Typography.buttonSmall,
    color: Colors.text,
  },
  noDevicesText: {
    ...Typography.bodyMedium,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },
  deviceNameInputRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  saveDeviceNameBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xl,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveDeviceNameText: {
    ...Typography.buttonSmall,
    color: '#fff',
  },
  deviceInfoSubtext: {
    ...Typography.captionMedium,
    color: Colors.textSecondary,
  },
  deviceActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  removeDeviceBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dangerBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${Colors.danger}30`,
  },
  rememberMeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  rememberMeLabel: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },
  forgetPasswordBtn: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.xs,
    alignSelf: 'center',
  },
  forgetPasswordText: {
    ...Typography.captionMedium,
    color: Colors.danger,
    textDecorationLine: 'underline',
  },
});
