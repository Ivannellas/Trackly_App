import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

// Check if running inside Expo Go client app
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Safe dynamic loader
const getNotifications = () => {
  if (isExpoGo) {
    return null;
  }
  return require('expo-notifications');
};

export type NotificationStyle = 'standard' | 'high_priority';

const STANDARD_CHANNEL_ID = 'trackly-standard';
const HIGH_PRIORITY_CHANNEL_ID = 'trackly-high-priority';

const getChannelIdForStyle = (style: NotificationStyle) => {
  return style === 'high_priority' ? HIGH_PRIORITY_CHANNEL_ID : STANDARD_CHANNEL_ID;
};

const ensureAndroidChannels = async () => {
  if (Platform.OS !== 'android') return;

  const Notifications = getNotifications();
  if (!Notifications) return;

  await Notifications.setNotificationChannelAsync(STANDARD_CHANNEL_ID, {
    name: 'Trackly Standard Reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 180],
    enableVibrate: true,
    sound: 'default',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });

  await Notifications.setNotificationChannelAsync(HIGH_PRIORITY_CHANNEL_ID, {
    name: 'Trackly High Priority Reminders',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 180, 250],
    enableVibrate: true,
    sound: 'default',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
};

export const configureForegroundNotificationBehavior = (style: NotificationStyle = 'standard') => {
  const Notifications = getNotifications();
  if (!Notifications) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldSetBadge: true,
      shouldPlaySound: style === 'high_priority',
    }),
  });
};

export async function requestNotificationPermissions(style: NotificationStyle = 'standard'): Promise<boolean> {
  const Notifications = getNotifications();
  if (!Notifications) return false;

  configureForegroundNotificationBehavior(style);

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return false;

  await ensureAndroidChannels();
  return true;
}

export async function scheduleDailyReminder(
  hour: number,
  minute: number,
  style: NotificationStyle = 'standard'
): Promise<string> {
  const Notifications = getNotifications();
  if (!Notifications) return '';

  const selectedHour = Math.min(Math.max(hour, 0), 23);
  const selectedMinute = Math.min(Math.max(minute, 0), 59);

  await ensureAndroidChannels();
  await Notifications.cancelAllScheduledNotificationsAsync();

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Trackly Daily Reminder',
      body: "Don't forget to log your daily expenses!",
      sound: true,
      priority:
        style === 'high_priority'
          ? Notifications.AndroidNotificationPriority.MAX
          : Notifications.AndroidNotificationPriority.DEFAULT,
      ...(Platform.OS === 'android' ? { channelId: getChannelIdForStyle(style) } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: selectedHour,
      minute: selectedMinute,
    },
  });

  return notificationId;
}

export async function cancelDailyReminder(): Promise<void> {
  const Notifications = getNotifications();
  if (!Notifications) return;

  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function sendTestNotification(style: NotificationStyle = 'standard'): Promise<void> {
  const Notifications = getNotifications();
  if (!Notifications) return;

  await ensureAndroidChannels();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Trackly Test Notification',
      body: 'Local notifications are working correctly!',
      sound: true,
      priority:
        style === 'high_priority'
          ? Notifications.AndroidNotificationPriority.MAX
          : Notifications.AndroidNotificationPriority.DEFAULT,
      ...(Platform.OS === 'android' ? { channelId: getChannelIdForStyle(style) } : {}),
    },
    trigger: null,
  });
}