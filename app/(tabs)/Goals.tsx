import React from 'react';
import { GoalsScreen } from '../../src/screens';
import { useAppShell } from '../../src/context/AppShellContext';

export default function GoalsRoute() {
  const { userId, themeMode, onThemeChange, onSignOut } = useAppShell();

  return (
    <GoalsScreen
      userId={userId}
      themeMode={themeMode}
      onThemeChange={onThemeChange}
      onSignOut={onSignOut}
    />
  );
}
