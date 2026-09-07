import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../theme/colors';
import { Typography, Spacing, BorderRadius } from '../theme/typography';

export default function AdminPasswordModal({ visible, title, message, confirmText, onConfirm, onCancel }) {
  const [password, setPassword] = useState('');

  const handleVerify = () => {
    if (password === 'Neber007') {
      setPassword('');
      onConfirm();
    } else {
      Alert.alert('Error', 'Incorrect admin password');
      setPassword('');
    }
  };

  const handleCancel = () => {
    setPassword('');
    onCancel();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalKeyboardAvoiding}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.headerTitleContainer}>
                <Ionicons name="shield-checkmark-outline" size={24} color={Colors.primary} style={styles.shieldIcon} />
                <Text style={styles.modalTitle}>{title || 'Admin Password Required'}</Text>
              </View>
              <TouchableOpacity onPress={handleCancel} activeOpacity={0.7}>
                <Ionicons name="close-circle" size={28} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {message ? <Text style={styles.modalMessage}>{message}</Text> : null}

            <Text style={styles.inputLabel}>Enter Admin Password to proceed</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
              autoFocus
              onSubmitEditing={handleVerify}
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} activeOpacity={0.7}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleVerify} activeOpacity={0.7}>
                <Text style={styles.confirmButtonText}>{confirmText || 'Confirm'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalKeyboardAvoiding: {
    width: '100%',
    maxWidth: 400,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    borderWidth: 1,
    borderColor: `${Colors.primary}30`,
    ...Shadows.glow,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  shieldIcon: {
    marginRight: 4,
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  modalMessage: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  inputLabel: {
    ...Typography.captionMedium,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    color: Colors.text,
    ...Typography.body,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    ...Typography.button,
    color: Colors.text,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: Colors.danger,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.medium,
  },
  confirmButtonText: {
    ...Typography.button,
    color: '#fff',
  },
});
