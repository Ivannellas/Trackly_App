import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

type NotificationModule = typeof import('expo-notifications');

type NotificationSlotId = 'morning' | 'midday' | 'afternoon' | 'evening' | 'night';

interface NotificationSlot {
  id: NotificationSlotId;
  hour: number;
  minute: number;
  body: string;
}

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const AUTO_NOTIFICATION_STORAGE_KEY = '@trackly_auto_notification_ids';
const AUTO_NOTIFICATION_SKIP_KEY = '@trackly_auto_notification_skip';
const AUTO_CHANNEL_ID = 'trackly-auto-reminders';

const SLOTS: NotificationSlot[] = [
  {
    id: 'morning',
    hour: 8,
    minute: 30,
    // body: 'Good morning! Grabbed breakfast or coffee? Track your expenses to start the day right.',
    body: 'Good morning! Track your expenses to start the day right.',
  },
  {
    id: 'midday',
    hour: 12,
    minute: 30,
    // body: 'Good afternoon! Hope you enjoyed lunch. Take a quick moment to track your expenses.',
    body: 'Good afternoon! Nagkaon kana lab? Take a quick moment to track your expenses.',
  },
  {
    id: 'afternoon',
    hour: 16,
    minute: 30,
    body: 'Good day! Afternoon snack? Keep your budget updated by tracking your expenses.',
  },
  {
    id: 'evening',
    hour: 19,
    minute: 30,
    body: "Good evening! Finishing up dinner? Don't forget to track your evening expenses.",
  },
  {
    id: 'night',
    hour: 21,
    minute: 30,
    body: "Good night! Ready to wrap up the day? Let's review and track your daily expenses.",
  },
];

const getNotifications = (): NotificationModule | null => {
  if (Platform.OS === 'web') {
    return null;
  }

  return require('expo-notifications');
};

const getSlotDate = (baseDate: Date, slot: NotificationSlot) => {
  const nextDate = new Date(baseDate);
  nextDate.setHours(slot.hour, slot.minute, 0, 0);
  return nextDate;
};

const getNextSlot = (referenceDate: Date) => {
  return SLOTS.find((slot) => {
    const slotDate = getSlotDate(referenceDate, slot);
    const diffMinutes = (slotDate.getTime() - referenceDate.getTime()) / 60000;
    return diffMinutes > 0 && diffMinutes <= 60;
  });
};

const ensureHandler = (Notifications: NotificationModule) => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldSetBadge: false,
      shouldPlaySound: true,
    }),
  });
};

const ensureAndroidChannel = async (Notifications: NotificationModule) => {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(AUTO_CHANNEL_ID, {
    name: 'Trackly expense reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 220, 160, 220],
    enableVibrate: true,
    sound: 'default',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
};

const requestPermissionSilently = async (Notifications: NotificationModule) => {
  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === 'granted';
};

const loadStoredNotificationIds = async () => {
  const raw = await AsyncStorage.getItem(AUTO_NOTIFICATION_STORAGE_KEY);
  if (!raw) {
    return {} as Partial<Record<NotificationSlotId, string>>;
  }

  try {
    return JSON.parse(raw) as Partial<Record<NotificationSlotId, string>>;
  } catch {
    return {} as Partial<Record<NotificationSlotId, string>>;
  }
};

const saveStoredNotificationIds = async (ids: Partial<Record<NotificationSlotId, string>>) => {
  await AsyncStorage.setItem(AUTO_NOTIFICATION_STORAGE_KEY, JSON.stringify(ids));
};

const loadSkipState = async () => {
  const raw = await AsyncStorage.getItem(AUTO_NOTIFICATION_SKIP_KEY);
  if (!raw) {
    return {} as Partial<Record<NotificationSlotId, string>>;
  }

  try {
    return JSON.parse(raw) as Partial<Record<NotificationSlotId, string>>;
  } catch {
    return {} as Partial<Record<NotificationSlotId, string>>;
  }
};

const saveSkipState = async (skipState: Partial<Record<NotificationSlotId, string>>) => {
  await AsyncStorage.setItem(AUTO_NOTIFICATION_SKIP_KEY, JSON.stringify(skipState));
};

const scheduleSlot = async (Notifications: NotificationModule, slot: NotificationSlot, when: Date) => {
  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Trackly reminder',
      body: slot.body,
      sound: true,
      ...(Platform.OS === 'android' ? { channelId: AUTO_CHANNEL_ID } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: when,
    },
  });
};

const scheduleDailySlot = async (Notifications: NotificationModule, slot: NotificationSlot) => {
  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Trackly reminder',
      body: slot.body,
      sound: true,
      ...(Platform.OS === 'android' ? { channelId: AUTO_CHANNEL_ID } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: slot.hour,
      minute: slot.minute,
    },
  });
};

export async function initAutoNotifications(): Promise<boolean> {
  if (isExpoGo) {
    console.warn('Skipping notification initialization: Expo Go does not support native notifications.');
    return false;
  }

  const Notifications = getNotifications();
  if (!Notifications) {
    return false;
  }

  ensureHandler(Notifications);

  const granted = await requestPermissionSilently(Notifications);
  if (!granted) {
    return false;
  }

  await ensureAndroidChannel(Notifications);
  await Notifications.cancelAllScheduledNotificationsAsync();

  const skipState = await loadSkipState();
  const nextIds: Partial<Record<NotificationSlotId, string>> = {};

  for (const slot of SLOTS) {
    const skipDate = skipState[slot.id];
    const shouldSkipToday = skipDate === new Date().toDateString();

    if (shouldSkipToday) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextDate = getSlotDate(tomorrow, slot);
      nextIds[slot.id] = await scheduleSlot(Notifications, slot, nextDate);
      continue;
    }

    nextIds[slot.id] = await scheduleDailySlot(Notifications, slot);
  }

  await saveStoredNotificationIds(nextIds);
  await saveSkipState({});

  return true;
}

export async function onExpenseAdded(expenseDate: string | Date = new Date()): Promise<void> {
  if (isExpoGo) return;

  const Notifications = getNotifications();
  if (!Notifications) {
    return;
  }

  const expenseMoment = expenseDate instanceof Date ? expenseDate : new Date(expenseDate);
  if (Number.isNaN(expenseMoment.getTime())) {
    return;
  }

  const nextSlot = getNextSlot(expenseMoment);
  if (!nextSlot) {
    return;
  }

  const storedIds = await loadStoredNotificationIds();
  const notificationId = storedIds[nextSlot.id];
  if (!notificationId) {
    return;
  }

  await Notifications.cancelScheduledNotificationAsync(notificationId);

  const tomorrow = new Date(expenseMoment);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const resumedNotificationId = await scheduleSlot(Notifications, nextSlot, getSlotDate(tomorrow, nextSlot));

  const updatedIds = {
    ...storedIds,
    [nextSlot.id]: resumedNotificationId,
  };

  await saveStoredNotificationIds(updatedIds);
  await saveSkipState({
    [nextSlot.id]: expenseMoment.toDateString(),
  });
}