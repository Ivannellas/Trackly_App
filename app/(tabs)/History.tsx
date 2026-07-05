import React from 'react';
import { TransactionScreen } from '../../src/screens';
import { useAppShell } from '../../src/context/AppShellContext';

export default function HistoryRoute() {
  const { userId, themeMode, onThemeChange, onSignOut } = useAppShell();

  return (
    <TransactionScreen
      userId={userId}
      themeMode={themeMode}
      onThemeChange={onThemeChange}
      onSignOut={onSignOut}
    />
  );
}
