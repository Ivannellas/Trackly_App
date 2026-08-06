import React, { useEffect, useState } from 'react';
import { Alert, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Theme, Profile } from '../types';
import { TransactionService } from '../services';

interface AutoSplitSettingsModalProps {
  visible: boolean;
  userId: string | undefined;
  profile: Profile | null;
  theme: Theme;
  onClose: () => void;
  onSaved: (profile: Profile) => void;
}

const toPercent = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(100, Math.round(parsed))) : 0;
};

export const AutoSplitSettingsModal: React.FC<AutoSplitSettingsModalProps> = ({
  visible,
  userId,
  profile,
  theme,
  onClose,
  onSaved,
}) => {
  const [needs, setNeeds] = useState('50');
  const [wants, setWants] = useState('30');
  const [others, setOthers] = useState('20');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setNeeds(String(profile?.auto_split_needs ?? 50));
    setWants(String(profile?.auto_split_wants ?? 30));
    setOthers(String(profile?.auto_split_others ?? 20));
  }, [profile, visible]);

  const handleSave = async () => {
    if (!userId) {
      Alert.alert('Missing account', 'Please sign in again to save settings.');
      return;
    }

    const needsValue = toPercent(needs);
    const wantsValue = toPercent(wants);
    const othersValue = toPercent(others);

    if (needsValue + wantsValue + othersValue !== 100) {
      Alert.alert('Invalid split', 'Needs %, Wants %, and Others % must add up to 100%.');
      return;
    }

    try {
      setSaving(true);
      const { data, error } = await TransactionService.upsertProfile({
        id: userId,
        auto_split_needs: needsValue,
        auto_split_wants: wantsValue,
        auto_split_others: othersValue,
      });

      if (error) {
        throw error;
      }

      if (data) {
        onSaved(data);
      }

      onClose();
    } catch (error) {
      console.error('Failed to save auto split profile:', error);
      Alert.alert('Save failed', 'Could not update your auto-split settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 20 }}>
        <View style={{ backgroundColor: theme.card, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: theme.border }}>
          <Text style={{ color: theme.text, fontSize: 20, fontWeight: '800', marginBottom: 6 }}>Auto-Split Settings</Text>
          <Text style={{ color: theme.secondaryText, marginBottom: 18 }}>Percentages must total 100% before saving.</Text>

          {[
            { label: 'Needs %', value: needs, setter: setNeeds },
            { label: 'Wants %', value: wants, setter: setWants },
            { label: 'Others %', value: others, setter: setOthers },
          ].map((item) => (
            <View key={item.label} style={{ marginBottom: 14 }}>
              <Text style={{ color: theme.secondaryText, fontSize: 12, fontWeight: '700', marginBottom: 6 }}>{item.label}</Text>
              <TextInput
                value={item.value}
                onChangeText={item.setter}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={theme.secondaryText}
                style={{
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: theme.border,
                  backgroundColor: theme.background,
                  color: theme.text,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 16,
                }}
              />
            </View>
          ))}

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
            <TouchableOpacity onPress={onClose} style={{ flex: 1, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: theme.border, alignItems: 'center' }}>
              <Text style={{ color: theme.text, fontWeight: '700' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              style={{ flex: 1, paddingVertical: 12, borderRadius: 14, backgroundColor: theme.accent, alignItems: 'center', opacity: saving ? 0.65 : 1 }}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>{saving ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
