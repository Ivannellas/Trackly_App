
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  NotificationStyle,
  cancelDailyReminder,
  configureForegroundNotificationBehavior,
  requestNotificationPermissions,
  scheduleDailyReminder,
  sendTestNotification as sendLocalTestNotification,
} from '../services/notificationService';

interface NotificationSettings {
  enabled: boolean;
  reminderTime: string;
  notificationStyle: NotificationStyle;
}

interface NotificationSettingsContextValue {
  settings: NotificationSettings;
  loading: boolean;
  setNotificationsEnabled: (enabled: boolean) => Promise<boolean>;
  setReminderTime: (time: string) => Promise<void>;
  setNotificationStyle: (style: NotificationStyle) => Promise<void>;
  sendTestNotification: () => Promise<boolean>;
}

const NOTIFICATION_SETTINGS_KEY = '@notification_settings';

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: false,
  reminderTime: '20:00',
  notificationStyle: 'standard',
};

const NotificationSettingsContext = createContext<NotificationSettingsContextValue | null>(null);

const parseReminderTime = (time: string) => {
  const [rawHour, rawMinute] = time.split(':');
  const hour = Number(rawHour);
  const minute = Number(rawMinute);

  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    return { hour: 20, minute: 0 };
  }

  return {
    hour: Math.min(Math.max(hour, 0), 23),
    minute: Math.min(Math.max(minute, 0), 59),
  };
};

const persistSettings = async (settings: NotificationSettings) => {
  await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
};

const scheduleFromSettings = async (settings: NotificationSettings) => {
  const { hour, minute } = parseReminderTime(settings.reminderTime);
  await cancelDailyReminder();
  await scheduleDailyReminder(hour, minute, settings.notificationStyle);
};

export const NotificationSettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const saved = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
        if (!saved) {
          return;
        }

        const parsed = JSON.parse(saved) as Partial<NotificationSettings>;
        setSettings({
          enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : DEFAULT_SETTINGS.enabled,
          reminderTime:
            typeof parsed.reminderTime === 'string' ? parsed.reminderTime : DEFAULT_SETTINGS.reminderTime,
          notificationStyle:
            parsed.notificationStyle === 'high_priority' || parsed.notificationStyle === 'standard'
              ? parsed.notificationStyle
              : DEFAULT_SETTINGS.notificationStyle,
        });
      } catch (error) {
        console.error('Error loading notification settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  useEffect(() => {
    configureForegroundNotificationBehavior();
  }, []);

  const setNotificationsEnabled = async (enabled: boolean) => {
    try {
      if (enabled) {
        const granted = await requestNotificationPermissions(settings.notificationStyle);
        if (!granted) {
          return false;
        }

        const nextSettings = { ...settings, enabled: true };
        await scheduleFromSettings(nextSettings);
        setSettings(nextSettings);
        await persistSettings(nextSettings);
        return true;
      }

      await cancelDailyReminder();
      const nextSettings = { ...settings, enabled: false };
      setSettings(nextSettings);
      await persistSettings(nextSettings);
      return true;
    } catch (error) {
      console.error('Error updating notification toggle:', error);
      return false;
    }
  };

  const setReminderTime = async (time: string) => {
    try {
      const nextSettings = { ...settings, reminderTime: time };
      if (nextSettings.enabled) {
        const granted = await requestNotificationPermissions(nextSettings.notificationStyle);
        if (!granted) {
          return;
        }
        await scheduleFromSettings(nextSettings);
      }

      setSettings(nextSettings);
      await persistSettings(nextSettings);
    } catch (error) {
      console.error('Error updating reminder time:', error);
    }
  };

  const setNotificationStyle = async (style: NotificationStyle) => {
    try {
      const nextSettings = { ...settings, notificationStyle: style };
      configureForegroundNotificationBehavior(style);

      if (nextSettings.enabled) {
        await scheduleFromSettings(nextSettings);
      }

      setSettings(nextSettings);
      await persistSettings(nextSettings);
    } catch (error) {
      console.error('Error updating notification style:', error);
    }
  };

  const sendTestNotification = async () => {
    try {
      const granted = await requestNotificationPermissions(settings.notificationStyle);
      if (!granted) {
        return false;
      }

      await sendLocalTestNotification(settings.notificationStyle);
      return true;
    } catch (error) {
      console.error('Error sending test notification:', error);
      return false;
    }
  };

  const value = useMemo(
    () => ({
      settings,
      loading,
      setNotificationsEnabled,
      setReminderTime,
      setNotificationStyle,
      sendTestNotification,
    }),
    [settings, loading]
  );

  return <NotificationSettingsContext.Provider value={value}>{children}</NotificationSettingsContext.Provider>;
};

export const useNotificationSettings = () => {
  const context = useContext(NotificationSettingsContext);
  if (!context) {
    throw new Error('useNotificationSettings must be used within NotificationSettingsProvider');
  }
  return context;
};
