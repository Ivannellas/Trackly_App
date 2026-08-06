// Main App component - orchestrates authentication, theme, and navigation
import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import { Slot } from 'expo-router';
import * as Updates from 'expo-updates'; // Import expo-updates
import { AuthService, BiometricService } from './services';
import { AuthScreen } from './screens/AuthScreen';
import { Themes } from './styles';
import { Session } from './types';
import { Alert } from 'react-native';
import { AppShellProvider } from './context/AppShellContext';
import { NotificationSettingsProvider } from './context/NotificationSettingsContext';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  const theme = Themes[themeMode];

  // Initialize auth state
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      // Get current session
      const currentSession = await AuthService.getSession();
      setSession(currentSession);

      // Listen for auth state changes
      const {
        data: { subscription },
      } = AuthService.onAuthStateChange((newSession) => {
        setSession(newSession);
      });

      return () => {
        subscription?.unsubscribe();
      };
    } catch (error) {
      console.error('Error initializing auth:', error);
    }
  };

  // Biometric authentication check
  useEffect(() => {
    if (session) {
      checkBiometricStatus();
    }
  }, [session]);

  // AUTOMATIC UPDATE CHECKER (Triggers only after app is unlocked)
  useEffect(() => {
    if (isUnlocked) {
      handleAppUpdates();
    }
  }, [isUnlocked]);

  

  const handleAppUpdates = async () => {
    // Prevent running in local development mode
    if (__DEV__) return;

    try {
      const update = await Updates.checkForUpdateAsync();
      
      if (update.isAvailable) {
        Alert.alert(
          'New Update Available!',
          'Trackly has a new version with improvements and new features. Would you like to apply it now?',
          [
            { text: 'Later', style: 'cancel' },
            {
              text: 'Update Now',
              onPress: async () => {
                await Updates.fetchUpdateAsync(); // Downloads the update bundle
                await Updates.reloadAsync();      // Reloads the app instantly
              },
            },
          ]
        );
      }
    } catch (error) {
      console.log("Error checking for updates: ", error);
    }
  };

  const handleAuthentication = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        setIsUnlocked(true);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Unlock Budget Tracker' });
      if (result.success) {
        setIsUnlocked(true);
      } else {
        Alert.alert('Locked', 'Authentication failed.', [{ text: 'Retry', onPress: handleAuthentication }]);
      }
    } catch (error) {
      console.error('Error in biometric auth:', error);
      setIsUnlocked(true);
    }
  };

  const checkBiometricStatus = async () => {
    try {
      const isEnabled = await BiometricService.isBiometricEnabled();

      if (isEnabled) {
        await handleAuthentication();
      } else {
        const snoozedDate = await BiometricService.getSnoozedDate();
        const today = new Date().toDateString();

        if (snoozedDate === today) {
          setIsUnlocked(true);
        } else {
          Alert.alert('Security', 'Protect with Biometrics?', [
            { text: 'Not Now', onPress: () => setIsUnlocked(true) },
            {
              text: 'No more today',
              onPress: async () => {
                await BiometricService.setSnoozedDate(new Date());
                setIsUnlocked(true);
              },
            },
            {
              text: 'Enable',
              onPress: async () => {
                await BiometricService.setBiometricEnabled(true);
                await handleAuthentication();
              },
            },
          ]);
        }
      }
    } catch (error) {
      console.error('Error checking biometric status:', error);
      setIsUnlocked(true);
    } finally {
      setLoading(false);
    }
  };

  // Sign out handler
  const handleSignOut = async () => {
    try {
      await AuthService.signOut();
      setIsUnlocked(false);
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  // Show auth screen if not authenticated
  if (!session) {
    return (
      <SafeAreaProvider>
        <AuthScreen />
      </SafeAreaProvider>
    );
  }

  // Show loading or locked screen
  if (loading || !isUnlocked) {
    return <View style={{ flex: 1, backgroundColor: theme.background }} />;
  }

  // Show main app with navigation
  return (
    <SafeAreaProvider>
      <NotificationSettingsProvider>
        <AppShellProvider
          value={{
            userId: session?.user?.id,
            themeMode,
            onThemeChange: setThemeMode,
            onSignOut: handleSignOut,
          }}
        >
          <Slot />
        </AppShellProvider>
      </NotificationSettingsProvider>
    </SafeAreaProvider>
  );
}