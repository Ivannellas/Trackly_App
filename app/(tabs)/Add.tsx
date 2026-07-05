import React from 'react';
import { AddTransactionScreen } from '../../src/screens';
import { useAppShell } from '../../src/context/AppShellContext';

export default function AddRoute() {
  const { userId, themeMode, onThemeChange, onSignOut } = useAppShell();

  return (
    <AddTransactionScreen
      userId={userId}
      themeMode={themeMode}
      onThemeChange={onThemeChange}
      onSignOut={onSignOut}
    />
  );
}
