import React, { useEffect, useState } from 'react';
import { Alert, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Theme, BucketName } from '../types';
import { TransactionService } from '../services';

interface TransferModalProps {
  visible: boolean;
  userId: string | undefined;
  theme: Theme;
  initialAmount?: number;
  initialSourceBucket?: BucketName;
  initialTargetBucket?: BucketName;
  onClose: () => void;
  onCompleted?: () => void;
}

const bucketOptions: { label: string; value: BucketName }[] = [
  { label: 'Needs', value: 'needs' },
  { label: 'Wants', value: 'wants' },
  { label: 'Others', value: 'others' },
];

export const TransferModal: React.FC<TransferModalProps> = ({
  visible,
  userId,
  theme,
  initialAmount,
  initialSourceBucket,
  initialTargetBucket,
  onClose,
  onCompleted,
}) => {
  const [sourceBucket, setSourceBucket] = useState<BucketName>('needs');
  const [targetBucket, setTargetBucket] = useState<BucketName>('wants');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('Bucket transfer');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setSourceBucket(initialSourceBucket ?? 'needs');
    setTargetBucket(initialTargetBucket ?? 'wants');
    setAmount(initialAmount ? String(initialAmount) : '');
    setNote('Bucket transfer');
  }, [visible, initialAmount, initialSourceBucket, initialTargetBucket]);

  const handleSave = async () => {
    if (!userId) {
      Alert.alert('Missing account', 'Please sign in again to transfer funds.');
      return;
    }

    const parsedAmount = Math.abs(Number(amount));
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Invalid amount', 'Enter a transfer amount greater than zero.');
      return;
    }

    if (sourceBucket === targetBucket) {
      Alert.alert('Invalid transfer', 'Source and target buckets must be different.');
      return;
    }

    try {
      setSaving(true);
      const { error } = await TransactionService.createTransfer({
        userId,
        amount: parsedAmount,
        sourceBucket,
        targetBucket,
        note,
        created_at: new Date().toISOString(),
      });

      if (error) {
        throw error;
      }

      onCompleted?.();
      onClose();
    } catch (error) {
      console.error('Failed to create transfer:', error);
      Alert.alert('Transfer failed', 'Could not save the transfer.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 20 }}>
        <View style={{ backgroundColor: theme.card, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: theme.border }}>
          <Text style={{ color: theme.text, fontSize: 20, fontWeight: '800', marginBottom: 6 }}>Transfer Between Buckets</Text>
          <Text style={{ color: theme.secondaryText, marginBottom: 18 }}>Move money from one bucket to another.</Text>

          <View style={{ marginBottom: 14 }}>
            <Text style={{ color: theme.secondaryText, fontSize: 12, fontWeight: '700', marginBottom: 6 }}>SOURCE BUCKET</Text>
            <View style={{ borderRadius: 14, borderWidth: 1, borderColor: theme.border, overflow: 'hidden', backgroundColor: theme.background }}>
              <Picker selectedValue={sourceBucket} onValueChange={(value) => setSourceBucket(value)} style={{ color: theme.text }}>
                {bucketOptions.map((bucket) => (
                  <Picker.Item key={bucket.value} label={bucket.label} value={bucket.value} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={{ marginBottom: 14 }}>
            <Text style={{ color: theme.secondaryText, fontSize: 12, fontWeight: '700', marginBottom: 6 }}>TARGET BUCKET</Text>
            <View style={{ borderRadius: 14, borderWidth: 1, borderColor: theme.border, overflow: 'hidden', backgroundColor: theme.background }}>
              <Picker selectedValue={targetBucket} onValueChange={(value) => setTargetBucket(value)} style={{ color: theme.text }}>
                {bucketOptions.map((bucket) => (
                  <Picker.Item key={bucket.value} label={bucket.label} value={bucket.value} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={{ marginBottom: 14 }}>
            <Text style={{ color: theme.secondaryText, fontSize: 12, fontWeight: '700', marginBottom: 6 }}>AMOUNT</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor={theme.secondaryText}
              style={{ borderRadius: 14, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.background, color: theme.text, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 }}
            />
          </View>

          <View style={{ marginBottom: 14 }}>
            <Text style={{ color: theme.secondaryText, fontSize: 12, fontWeight: '700', marginBottom: 6 }}>NOTE</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Transfer note"
              placeholderTextColor={theme.secondaryText}
              style={{ borderRadius: 14, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.background, color: theme.text, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 }}
            />
          </View>

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
            <TouchableOpacity onPress={onClose} style={{ flex: 1, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: theme.border, alignItems: 'center' }}>
              <Text style={{ color: theme.text, fontWeight: '700' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              style={{ flex: 1, paddingVertical: 12, borderRadius: 14, backgroundColor: theme.accent, alignItems: 'center', opacity: saving ? 0.65 : 1 }}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>{saving ? 'Saving...' : 'Transfer'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
