import React from 'react';
import { DashboardScreen } from '../../src/screens';
import { useAppShell } from '../../src/context/AppShellContext';

export default function HomeRoute() {
  const { userId, themeMode, onThemeChange, onSignOut } = useAppShell();

  return (
    <DashboardScreen
      userId={userId}
      themeMode={themeMode}
      onThemeChange={onThemeChange}
      onSignOut={onSignOut}
    />
  );
}
