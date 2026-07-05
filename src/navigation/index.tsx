// Bottom Tab Navigation - Professional 4-tab interface for Budget Tracker
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import {
  DashboardScreen,
  TransactionScreen,
  AddTransactionScreen,
  GoalsScreen,
} from '../screens';
import { Theme } from '../types';

const Tab = createBottomTabNavigator();

interface NavigationProps {
  userId: string | undefined;
  themeMode: 'light' | 'dark';
  onThemeChange: (mode: 'light' | 'dark') => void;
  onSignOut: () => void;
  theme: Theme;
}

export const AppNavigator: React.FC<NavigationProps> = ({
  userId,
  themeMode,
  onThemeChange,
  onSignOut,
  theme,
}) => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          // Icon configuration for each tab
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap = 'home-outline';

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'History') {
              iconName = focused ? 'list' : 'list-outline';
            } else if (route.name === 'Add') {
              iconName = focused ? 'add-circle' : 'add-circle-outline';
            } else if (route.name === 'Goals') {
              iconName = focused ? 'wallet' : 'wallet-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          // Professional color scheme
          tabBarActiveTintColor: theme.accent,
          tabBarInactiveTintColor: theme.secondaryText,
          // Tab bar styling
          tabBarStyle: {
            backgroundColor: theme.card,
            borderTopColor: theme.border,
            borderTopWidth: 1,
            paddingBottom: 4,
            paddingTop: 4,
            height: 56,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
            marginTop: 2,
          },
          // Hide header since screens have their own headers
          headerShown: false,
        })}
      >
        {/* Home Tab - Dashboard */}
        <Tab.Screen
          name="Home"
          options={{ title: 'Home' }}
          children={() => (
            <DashboardScreen
              userId={userId}
              themeMode={themeMode}
              onThemeChange={onThemeChange}
              onSignOut={onSignOut}
            />
          )}
        />

        {/* History Tab - Transaction List */}
        <Tab.Screen
          name="History"
          options={{ title: 'History' }}
          children={() => (
            <TransactionScreen
              userId={userId}
              themeMode={themeMode}
              onThemeChange={onThemeChange}
              onSignOut={onSignOut}
            />
          )}
        />

        {/* Add Tab - New Transaction */}
        <Tab.Screen
          name="Add"
          options={{ title: 'Add' }}
          children={() => (
            <AddTransactionScreen
              userId={userId}
              themeMode={themeMode}
              onThemeChange={onThemeChange}
              onSignOut={onSignOut}
            />
          )}
        />

        {/* Goals Tab - Savings Goals & Bills */}
        <Tab.Screen
          name="Goals"
          options={{ title: 'Goals' }}
          children={() => (
            <GoalsScreen
              userId={userId}
              themeMode={themeMode}
              onThemeChange={onThemeChange}
              onSignOut={onSignOut}
            />
          )}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

