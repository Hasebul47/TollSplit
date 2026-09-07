import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../theme/colors';
import { Typography, Spacing, BorderRadius } from '../theme/typography';
import { useUser } from '../context/UserContext';

export default function BannedScreen() {
  const { deviceId } = useUser();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="ban-outline" size={64} color={Colors.danger} />
        </View>

        <Text style={styles.title}>Access Denied</Text>
        
        <Text style={styles.description}>
          This device has been restricted from accessing TollSplit by the administrator. 
          If you believe this is a mistake, please contact your administrator.
        </Text>

        <View style={styles.deviceInfoCard}>
          <Text style={styles.deviceInfoLabel}>Your Device ID (Send to admin to unban):</Text>
          <Text style={styles.deviceIdText} selectable={true}>
            {deviceId || 'Retrieving...'}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: Spacing.xxl,
    alignItems: 'center',
    width: '90%',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.dangerBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
    borderWidth: 1,
    borderColor: `${Colors.danger}30`,
    ...Shadows.glow,
    shadowColor: Colors.danger,
  },
  title: {
    ...Typography.h2,
    color: Colors.danger,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xxxl,
  },
  deviceInfoCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  deviceInfoLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  deviceIdText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    color: Colors.primaryLight,
    fontWeight: '700',
    fontSize: 14,
    textAlign: 'center',
  },
});
