import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { UserProvider, useUser } from '../src/context/UserContext';
import { Colors } from '../src/theme/colors';
import BannedScreen from '../src/components/BannedScreen';

function AppContent() {
  const { isBanned } = useUser();

  if (isBanned) {
    return <BannedScreen />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <UserProvider>
        <StatusBar style="light" backgroundColor={Colors.background} />
        <AppContent />
      </UserProvider>
    </SafeAreaProvider>
  );
}
