import React from 'react';
import { NotificationSettingsScreen } from '../src/screens';
import { useAppShell } from '../src/context/AppShellContext';

export default function NotificationSettingsRoute() {
  const { themeMode, onSignOut } = useAppShell();

  return <NotificationSettingsScreen themeMode={themeMode} onSignOut={onSignOut} />;
}
