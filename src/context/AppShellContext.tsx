import React, { createContext, useContext } from 'react';

interface AppShellContextValue {
  userId: string | undefined;
  themeMode: 'light' | 'dark';
  onThemeChange: (mode: 'light' | 'dark') => void;
  onSignOut: () => void;
}

const AppShellContext = createContext<AppShellContextValue | null>(null);

export const AppShellProvider = ({
  value,
  children,
}: {
  value: AppShellContextValue;
  children: React.ReactNode;
}) => {
  return <AppShellContext.Provider value={value}>{children}</AppShellContext.Provider>;
};

export const useAppShell = () => {
  const context = useContext(AppShellContext);
  if (!context) {
    throw new Error('useAppShell must be used within AppShellProvider');
  }
  return context;
};
