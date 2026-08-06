
import React, { useMemo, useState } from 'react';
import {
  Alert,
  StatusBar,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Themes, sharedStyles } from '../styles';
import { useNotificationSettings } from '../context/NotificationSettingsContext';
import { NotificationStyle, requestNotificationPermissions } from '../services/notificationService';

interface NotificationSettingsScreenProps {
  themeMode: 'light' | 'dark';
  onSignOut: () => void;
}

const toTimeDate = (time: string) => {
  const now = new Date();
  const [hourRaw, minuteRaw] = time.split(':');
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);

  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    now.setHours(20, 0, 0, 0);
    return now;
  }

  now.setHours(hour, minute, 0, 0);
  return now;
};

const toTimeString = (date: Date) => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const isValidTimeString = (time: string) => {
  const parts = time.split(':');
  if (parts.length !== 2) return false;

  const hour = Number(parts[0]);
  const minute = Number(parts[1]);

  return Number.isInteger(hour) && Number.isInteger(minute) && hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
};

const getReadableStyleLabel = (style: NotificationStyle) => {
  return style === 'high_priority' ? 'High Priority / Vibrate' : 'Standard Banner';
};

export const NotificationSettingsScreen: React.FC<NotificationSettingsScreenProps> = ({
  themeMode,
  onSignOut,
}) => {
  const theme = Themes[themeMode];
  const router = useRouter();
  const { settings, loading, setNotificationsEnabled, setReminderTime, setNotificationStyle, sendTestNotification } =
    useNotificationSettings();

  const [showTimePicker, setShowTimePicker] = useState(false);

  const selectedTime = useMemo(() => toTimeDate(settings.reminderTime), [settings.reminderTime]);

  const handleToggle = async (value: boolean) => {
    if (!value) {
      await setNotificationsEnabled(false);
      return;
    }

    if (!isValidTimeString(settings.reminderTime)) {
      await setReminderTime('20:00');
    }

    const granted = await requestNotificationPermissions(settings.notificationStyle);
    if (!granted) {
      Alert.alert(
        'Permission Needed',
        'Local notification permission is not granted. You can enable it in your device settings.'
      );
      return;
    }

    const success = await setNotificationsEnabled(true);
    if (!success) {
      Alert.alert('Unable to Enable', 'Could not enable daily reminders right now. Please try again.');
    }
  };

  const handleStylePress = async (style: NotificationStyle) => {
    await setNotificationStyle(style);
  };

  const handleTestNotification = async () => {
    const success = await sendTestNotification();
    if (!success) {
      Alert.alert('Permission Required', 'Please allow notifications first before sending a test.');
      return;
    }

    Alert.alert('Test Sent', 'A test notification was sent to this device.');
  };

  return (
    <SafeAreaView style={[sharedStyles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={themeMode === 'light' ? 'dark-content' : 'light-content'} />

      <View style={[sharedStyles.header, { paddingHorizontal: 20, marginBottom: 24 }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ paddingVertical: 4, paddingRight: 10 }}>
          <Ionicons name="chevron-back" size={24} color={theme.accent} />
        </TouchableOpacity>

        <Text style={[sharedStyles.title, { color: theme.text, flex: 1 }]}>Notifications</Text>

        <TouchableOpacity onPress={onSignOut}>
          <Ionicons name="log-out" size={24} color={theme.accent} />
        </TouchableOpacity>
      </View>

      <View
        style={{
          backgroundColor: theme.card,
          borderRadius: 14,
          padding: 16,
          marginHorizontal: 20,
          marginBottom: 14,
          borderWidth: 1,
          borderColor: theme.border,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ color: theme.text, fontSize: 15, fontWeight: '700' }}>Daily Reminder</Text>
            <Text style={{ color: theme.secondaryText, fontSize: 12, marginTop: 2 }}>
              Receive a reminder every day to log expenses.
            </Text>
          </View>
          <Switch
            value={settings.enabled}
            onValueChange={handleToggle}
            trackColor={{ false: '#9CA3AF', true: '#4F46E5' }}
            thumbColor="#FFFFFF"
            disabled={loading}
          />
        </View>
      </View>

      <TouchableOpacity
        onPress={() => setShowTimePicker(true)}
        disabled={!settings.enabled || loading}
        style={{
          backgroundColor: theme.card,
          borderRadius: 14,
          padding: 16,
          marginHorizontal: 20,
          marginBottom: 14,
          borderWidth: 1,
          borderColor: theme.border,
          opacity: settings.enabled ? 1 : 0.55,
        }}
      >
        <Text style={{ color: theme.text, fontSize: 15, fontWeight: '700' }}>Reminder Time</Text>
        <Text style={{ color: theme.secondaryText, fontSize: 12, marginTop: 4 }}>Local device time</Text>
        <Text style={{ color: theme.accent, fontSize: 18, fontWeight: '700', marginTop: 8 }}>
          {selectedTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
        </Text>
      </TouchableOpacity>

      <View
        style={{
          backgroundColor: theme.card,
          borderRadius: 14,
          padding: 16,
          marginHorizontal: 20,
          marginBottom: 14,
          borderWidth: 1,
          borderColor: theme.border,
        }}
      >
        <Text style={{ color: theme.text, fontSize: 15, fontWeight: '700', marginBottom: 10 }}>
          Notification Mode
        </Text>

        <TouchableOpacity
          onPress={() => handleStylePress('standard')}
          style={{
            borderWidth: 1,
            borderColor: settings.notificationStyle === 'standard' ? theme.accent : theme.border,
            backgroundColor: settings.notificationStyle === 'standard' ? theme.chip : theme.background,
            borderRadius: 12,
            paddingVertical: 10,
            paddingHorizontal: 12,
            marginBottom: 8,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: theme.text, fontWeight: '600' }}>Standard Banner</Text>
          {settings.notificationStyle === 'standard' ? <Ionicons name="checkmark" size={18} color={theme.accent} /> : null}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleStylePress('high_priority')}
          style={{
            borderWidth: 1,
            borderColor: settings.notificationStyle === 'high_priority' ? theme.accent : theme.border,
            backgroundColor: settings.notificationStyle === 'high_priority' ? theme.chip : theme.background,
            borderRadius: 12,
            paddingVertical: 10,
            paddingHorizontal: 12,
            marginBottom: 2,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: theme.text, fontWeight: '600' }}>High Priority / Vibrate</Text>
          {settings.notificationStyle === 'high_priority' ? (
            <Ionicons name="checkmark" size={18} color={theme.accent} />
          ) : null}
        </TouchableOpacity>

        <Text style={{ color: theme.secondaryText, fontSize: 11, marginTop: 10 }}>
          Active mode: {getReadableStyleLabel(settings.notificationStyle)}
        </Text>
      </View>

      <View style={{ marginHorizontal: 20, marginTop: 4 }}>
        <TouchableOpacity
          onPress={handleTestNotification}
          style={{
            backgroundColor: theme.accent,
            borderRadius: 10,
            paddingVertical: 14,
            alignItems: 'center',
            opacity: loading ? 0.7 : 1,
          }}
          disabled={loading}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Send Test Notification</Text>
        </TouchableOpacity>
      </View>

      {showTimePicker ? (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          is24Hour={false}
          onChange={(_, selectedDate) => {
            setShowTimePicker(false);
            if (!selectedDate) {
              return;
            }
            setReminderTime(toTimeString(selectedDate));
          }}
        />
      ) : null}
    </SafeAreaView>
  );
};
