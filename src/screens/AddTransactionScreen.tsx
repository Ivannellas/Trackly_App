import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Keyboard,
  StatusBar,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native'; // Import useFocusEffect for auto-refresh on screen focus
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { sharedStyles, Themes } from '../styles';
import { useTransactions, useCategories, useBudgets } from '../hooks';
import { LocalStorageService } from '../services/transactions';
import { Theme, Profile, BucketName } from '../types';
import { calculateAutoSplit, formatMoney } from '../utils/budgetHelpers';
import { TransactionService } from '../services';
import { TransferModal } from '../components';

interface AddTransactionScreenProps {
  userId: string | undefined;
  themeMode: 'light' | 'dark';
  onThemeChange: (mode: 'light' | 'dark') => void;
  onSignOut: () => void;
}

export const AddTransactionScreen: React.FC<AddTransactionScreenProps> = ({
  userId,
  themeMode,
  onThemeChange,
  onSignOut,
}) => {
  const theme = Themes[themeMode];
  // Note: Destructure refresh/mutate functions if your hooks provide them (e.g., refreshTransactions)
  const { transactions, addTransaction: hookAddTransaction, fetchTransactions } = useTransactions(userId);
  const { categories } = useCategories(userId);
  const { budgets } = useBudgets(); // Removed refresh since the hook doesn't export it

  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('General');
  const [transDate, setTransDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [transactionKind, setTransactionKind] = useState<'income' | 'expense'>('expense');
  const [bucketMode, setBucketMode] = useState<'manual' | 'auto'>('manual');
  const [bucket, setBucket] = useState<BucketName>('needs');
  const [showOverdraftWarning, setShowOverdraftWarning] = useState(false);
  const [overdraftShortage, setOverdraftShortage] = useState(0);
  const [pendingExpenseValue, setPendingExpenseValue] = useState<number | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferSourceBucket, setTransferSourceBucket] = useState<BucketName>('wants');
  const [transferTargetBucket, setTransferTargetBucket] = useState<BucketName>('needs');

  // Dynamic states for editable presets
  const [fareAmount, setFareAmount] = useState('15');
  const [lunchAmount, setLunchAmount] = useState('50');

  // States to handle the cross-platform Edit Preset Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [editingType, setEditingType] = useState<'fare' | 'lunch' | null>(null);
  const [presetInput, setPresetInput] = useState('');

  // Reusable function to fetch custom local presets
  const loadPresets = useCallback(async () => {
    try {
      const savedPresets = await LocalStorageService.getPresets();
      if (savedPresets) {
        setFareAmount(savedPresets.fare || '15');
        setLunchAmount(savedPresets.lunch || '50');
      }
    } catch (e) {
      console.error("Failed to load presets", e);
    }
  }, []);

  // Auto-refresh presets every time the user navigates back into this view
  useFocusEffect(
    useCallback(() => {
      loadPresets();
    }, [loadPresets])
  );

  useEffect(() => {
    if (!userId) {
      return;
    }

    TransactionService.getProfile(userId)
      .then((savedProfile) => setProfile(savedProfile))
      .catch((error) => console.error('Failed to load profile:', error));
  }, [userId]);

  // Open Custom Modal instead of iOS Prompt
  const handleOpenEditModal = (type: 'fare' | 'lunch') => {
    setEditingType(type);
    setPresetInput(type === 'fare' ? fareAmount : lunchAmount);
    setModalVisible(true);
  };

  // Save Preset from Modal
  const handleSavePreset = async () => {
    if (!presetInput || isNaN(Number(presetInput))) {
      Alert.alert('Error', 'Please enter a valid number');
      return;
    }

    const cleanAmount = Math.abs(parseFloat(presetInput)).toString();
    const updatedFare = editingType === 'fare' ? cleanAmount : fareAmount;
    const updatedLunch = editingType === 'lunch' ? cleanAmount : lunchAmount;

    setFareAmount(updatedFare);
    setLunchAmount(updatedLunch);

    await LocalStorageService.savePresets({ fare: updatedFare, lunch: updatedLunch });

    // Close & Reset Modal states
    setModalVisible(false);
    setEditingType(null);
    setPresetInput('');
  };

  // Calculate budget status for category
  const getBudgetStatus = () => {
    const limit = budgets[category];
    if (!limit || amount === '') return null;
    const val = parseFloat(amount);
    if (val >= 0) return null;
    const absAmount = Math.abs(val);
    return { limit, amount: absAmount, exceeds: absAmount > limit };
  };

  const getBucketPreview = () => {
    if (!amount || isNaN(Number(amount))) {
      return null;
    }

    if (transactionKind !== 'income') {
      return null;
    }

    const currentProfile = profile ?? {
      id: userId || '',
      auto_split_needs: 50,
      auto_split_wants: 30,
      auto_split_others: 20,
    };

    return calculateAutoSplit(
      Math.abs(Number(amount)),
      currentProfile.auto_split_needs,
      currentProfile.auto_split_wants,
      currentProfile.auto_split_others
    );
  };

  const bucketPreview = getBucketPreview();

  const getBucketBalance = (bucketName: BucketName) => {
    return transactions.reduce((sum, transaction) => {
      const transactionBucket = transaction.bucket || 'needs';
      if (transactionBucket !== bucketName) {
        return sum;
      }

      if (transaction.type === 'expense' || transaction.amount < 0) {
        return sum - Math.abs(transaction.amount);
      }

      return sum + Math.abs(transaction.amount);
    }, 0);
  };

  const handleTransferFirst = () => {
    setShowOverdraftWarning(false);
    const alternateBuckets: BucketName[] = ['needs', 'wants', 'others'].filter((bucketName) => bucketName !== bucket) as BucketName[];
    setTransferSourceBucket(alternateBuckets[0] || 'wants');
    setTransferTargetBucket(bucket);
    setShowTransferModal(true);
  };

  const handleAddTransaction = async () => {
    if (!amount || isNaN(Number(amount))) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const val = parseFloat(amount);
    const budgetStatus = getBudgetStatus();

    if (transactionKind === 'expense') {
      const selectedBucketBalance = getBucketBalance(bucket);
      const shortage = Math.max(0, Math.abs(val) - selectedBucketBalance);
      if (shortage > 0) {
        setOverdraftShortage(shortage);
        setPendingExpenseValue(val);
        setShowOverdraftWarning(true);
        return;
      }
    }

    if (budgetStatus?.exceeds) {
      Alert.alert('Budget Warning', `This expense exceeds your ₱${budgetStatus.limit} limit for ${category}. Proceed?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save Anyway',
          onPress: async () => {
            await saveTransaction(val);
          },
        },
      ]);
      return;
    }

    await saveTransaction(val);
  };

  const saveTransaction = async (val: number) => {
    try {
      setLoading(true);
      const created_at = transDate.toISOString();

      if (transactionKind === 'income' && bucketMode === 'auto') {
        const currentProfile = profile ?? {
          id: userId!,
          auto_split_needs: 50,
          auto_split_wants: 30,
          auto_split_others: 20,
        };

        const splits = calculateAutoSplit(
          Math.abs(val),
          currentProfile.auto_split_needs,
          currentProfile.auto_split_wants,
          currentProfile.auto_split_others
        );

        const { error } = await TransactionService.createAutoSplitIncome({
          userId: userId!,
          amount: Math.abs(val),
          note: description,
          category,
          created_at,
          splits,
        });

        if (error) {
          throw error;
        }
      } else {
        await hookAddTransaction({
          amount: transactionKind === 'expense' ? -Math.abs(val) : Math.abs(val),
          note: description,
          category,
          user_id: userId!,
          created_at,
          bucket,
          type: transactionKind,
          group_id: null,
        } as any);
      }

      // This refreshes the local hook cache immediately on the current screen
      if (typeof fetchTransactions === 'function') {
        await fetchTransactions();
      }

      Alert.alert('Success', 'Transaction saved!');
      setAmount('');
      setDescription('');
      setCategory('General');
      setTransDate(new Date());
      setTransactionKind('expense');
      setBucketMode('manual');
      setBucket('needs');
      Keyboard.dismiss();
    } catch (error: any) {
      console.error('Auto-Split Insert Error:', error);
      Alert.alert('Error', error?.message || error?.details || 'Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[sharedStyles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={themeMode === 'light' ? 'dark-content' : 'light-content'} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Header */}
        <View style={[sharedStyles.header, { paddingHorizontal: 20, marginBottom: 24 }]}>
          <Text style={[sharedStyles.title, { color: theme.text }]}>Add Transaction</Text>
          <TouchableOpacity onPress={onSignOut}>
            <Ionicons name="log-out" size={24} color={theme.accent} />
          </TouchableOpacity>
        </View>

        {/* Transaction Type */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <Text style={{ fontSize: 12, color: theme.secondaryText, fontWeight: '600', marginBottom: 8 }}>TYPE</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {([
              { label: 'Expense', value: 'expense' as const },
              { label: 'Income', value: 'income' as const },
            ] as const).map((item) => (
              <TouchableOpacity
                key={item.value}
                onPress={() => setTransactionKind(item.value)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: 'center',
                  backgroundColor: transactionKind === item.value ? theme.accent : theme.card,
                }}
              >
                <Text style={{ color: transactionKind === item.value ? '#fff' : theme.text, fontWeight: '700' }}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Amount Input */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <Text style={{ fontSize: 12, color: theme.secondaryText, fontWeight: '600', marginBottom: 8 }}>AMOUNT</Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: theme.input,
              borderRadius: 12,
              paddingHorizontal: 16,
              borderWidth: 1.5,
              borderColor: theme.border,
            }}
          >
            <Text style={{ fontSize: 24, color: theme.accent, fontWeight: '700' }}>₱</Text>
            <TextInput
              style={{
                flex: 1,
                fontSize: 28,
                color: theme.text,
                fontWeight: '700',
                paddingVertical: 16,
                paddingHorizontal: 12,
              }}
              placeholder="0"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              placeholderTextColor={theme.secondaryText}
            />
          </View>
        </View>

        {transactionKind === 'income' && (
          <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
            <Text style={{ fontSize: 12, color: theme.secondaryText, fontWeight: '600', marginBottom: 8 }}>INCOME MODE</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              {([
                { label: 'Manual Bucket Select', value: 'manual' as const },
                { label: 'Auto-Split', value: 'auto' as const },
              ] as const).map((item) => (
                <TouchableOpacity
                  key={item.value}
                  onPress={() => setBucketMode(item.value)}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: 'center',
                    backgroundColor: bucketMode === item.value ? theme.accent : theme.card,
                  }}
                >
                  <Text style={{ color: bucketMode === item.value ? '#fff' : theme.text, fontWeight: '700', textAlign: 'center' }}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {bucketMode === 'manual' ? (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(['needs', 'wants', 'others'] as BucketName[]).map((bucketName) => (
                  <TouchableOpacity
                    key={bucketName}
                    onPress={() => setBucket(bucketName)}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 12,
                      alignItems: 'center',
                      backgroundColor: bucket === bucketName ? theme.accent : theme.card,
                    }}
                  >
                    <Text style={{ color: bucket === bucketName ? '#fff' : theme.text, fontWeight: '700', textTransform: 'capitalize' }}>{bucketName}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : bucketPreview ? (
              <View style={{ backgroundColor: theme.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: theme.border }}>
                <Text style={{ color: theme.text, fontWeight: '700', marginBottom: 6 }}>Auto-split preview</Text>
                <Text style={{ color: theme.secondaryText, fontSize: 12 }}>
                  Needs ₱{formatMoney(bucketPreview.needs)} · Wants ₱{formatMoney(bucketPreview.wants)} · Others ₱{formatMoney(bucketPreview.others)}
                </Text>
              </View>
            ) : null}
          </View>
        )}

        {transactionKind === 'expense' && (
          <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
            <Text style={{ fontSize: 12, color: theme.secondaryText, fontWeight: '600', marginBottom: 8 }}>BUCKET</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(['needs', 'wants', 'others'] as BucketName[]).map((bucketName) => (
                <TouchableOpacity
                  key={bucketName}
                  onPress={() => setBucket(bucketName)}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: 'center',
                    backgroundColor: bucket === bucketName ? theme.accent : theme.card,
                  }}
                >
                  <Text style={{ color: bucket === bucketName ? '#fff' : theme.text, fontWeight: '700', textTransform: 'capitalize' }}>{bucketName}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Category */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <Text style={{ fontSize: 12, color: theme.secondaryText, fontWeight: '600', marginBottom: 8 }}>CATEGORY</Text>
          <View style={[sharedStyles.pickerContainer, { backgroundColor: theme.input, borderColor: theme.border }]}>
            <Picker selectedValue={category} onValueChange={(v) => setCategory(v)} style={{ color: theme.text }}>
              {categories.map((cat) => (
                <Picker.Item key={cat} label={cat} value={cat} color={themeMode === 'dark' ? '#fff' : '#000'} />
              ))}
            </Picker>
          </View>
          {budgets[category] && (
            <Text style={{ fontSize: 11, color: theme.accent, marginTop: 8 }}>📊 Budget limit: ₱{budgets[category]}</Text>
          )}
        </View>

        {/* Date Picker */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <Text style={{ fontSize: 12, color: theme.secondaryText, fontWeight: '600', marginBottom: 8 }}>DATE</Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={{
              backgroundColor: theme.card,
              borderRadius: 12,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <Ionicons name="calendar" size={20} color={theme.accent} style={{ marginRight: 12 }} />
            <Text style={{ color: theme.text, fontSize: 16, fontWeight: '600' }}>{transDate.toLocaleDateString()}</Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={transDate}
            mode="date"
            onChange={(e, d) => {
              setShowDatePicker(false);
              if (d) setTransDate(d);
            }}
          />
        )}

        {/* Description/Note */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <Text style={{ fontSize: 12, color: theme.secondaryText, fontWeight: '600', marginBottom: 8 }}>NOTE (Optional)</Text>
          <TextInput
            style={[
              sharedStyles.input,
              { backgroundColor: theme.input, color: theme.text, borderColor: theme.border, minHeight: 80 },
            ]}
            placeholder="Add description..."
            value={description}
            onChangeText={setDescription}
            placeholderTextColor={theme.secondaryText}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Quick Add Presets Section */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 12, color: theme.secondaryText, fontWeight: '600' }}>QUICK ADD (Hold to Edit)</Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            {/* Fare Button */}
            <TouchableOpacity
              onPress={() => {
                setAmount(`-${fareAmount}`);
                setCategory('Transport');
                setDescription('Fare');
              }}
              onLongPress={() => handleOpenEditModal('fare')}
              style={{
                flex: 1,
                backgroundColor: theme.card,
                borderRadius: 12,
                padding: 12,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: theme.text, fontSize: 12, fontWeight: '700' }}>🚌 Fare</Text>
                <Ionicons name="pencil" size={12} color={theme.secondaryText} style={{ opacity: 0.5 }} />
              </View>
              <Text style={{ color: theme.accent, fontSize: 14, fontWeight: '700', marginTop: 4 }}>-₱{fareAmount}</Text>
            </TouchableOpacity>

            {/* Lunch Button */}
            <TouchableOpacity
              onPress={() => {
                setAmount(`-${lunchAmount}`);
                setCategory('Food');
                setDescription('Lunch');
              }}
              onLongPress={() => handleOpenEditModal('lunch')}
              style={{
                flex: 1,
                backgroundColor: theme.card,
                borderRadius: 12,
                padding: 12,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: theme.text, fontSize: 12, fontWeight: '700' }}>🍱 Lunch</Text>
                <Ionicons name="pencil" size={12} color={theme.secondaryText} style={{ opacity: 0.5 }} />
              </View>
              <Text style={{ color: theme.accent, fontSize: 14, fontWeight: '700', marginTop: 4 }}>-₱{lunchAmount}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Save Button */}
        <View style={{ paddingHorizontal: 20 }}>
          <TouchableOpacity
            onPress={handleAddTransaction}
            disabled={loading}
            style={[
              sharedStyles.button,
              { backgroundColor: theme.accent, opacity: loading ? 0.6 : 1 },
            ]}
          >
            <Text style={sharedStyles.buttonText}>{loading ? 'SAVING...' : 'ADD TRANSACTION'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Cross-Platform Custom Edit Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={sharedStyles.modalOverlay}>
          <View style={[sharedStyles.modalContent, { backgroundColor: theme.background }]}>
            <Text style={[sharedStyles.modalTitle, { color: theme.text }]}>
              Edit {editingType === 'fare' ? 'Fare' : 'Lunch'} Preset
            </Text>

            <TextInput
              style={[
                sharedStyles.input,
                {
                  backgroundColor: theme.input,
                  color: theme.text,
                  borderColor: theme.border,
                  fontSize: 18,
                  padding: 12,
                  textAlign: 'center',
                  marginBottom: 20
                }
              ]}
              keyboardType="numeric"
              value={presetInput}
              onChangeText={setPresetInput}
              autoFocus={true}
            />

            <View style={sharedStyles.modalButtons}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={{ color: theme.secondaryText, fontWeight: '600', fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSavePreset}>
                <Text style={{ color: theme.accent, fontWeight: '700', fontSize: 16 }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <TransferModal
        visible={showTransferModal}
        userId={userId}
        theme={theme}
        initialAmount={overdraftShortage}
        initialSourceBucket={transferSourceBucket}
        initialTargetBucket={transferTargetBucket}
        onClose={() => {
          setShowTransferModal(false);
          setPendingExpenseValue(null);
        }}
        onCompleted={async () => {
          setShowTransferModal(false);
          if (pendingExpenseValue !== null) {
            await saveTransaction(pendingExpenseValue);
          }
        }}
      />

      <Modal visible={showOverdraftWarning} transparent animationType="fade" onRequestClose={() => setShowOverdraftWarning(false)}>
        <View style={sharedStyles.modalOverlay}>
          <View style={[sharedStyles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[sharedStyles.modalTitle, { color: theme.text }]}>Overdraft Warning</Text>
            <Text style={{ color: theme.secondaryText, marginBottom: 20 }}>
              This expense exceeds the {bucket} bucket by ₱{overdraftShortage.toFixed(2)}.
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end' }}>
              <TouchableOpacity onPress={() => setShowOverdraftWarning(false)}>
                <Text style={{ color: theme.secondaryText, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  setShowOverdraftWarning(false);
                  if (pendingExpenseValue !== null) {
                    await saveTransaction(pendingExpenseValue);
                  }
                }}
              >
                <Text style={{ color: theme.accent, fontWeight: '700' }}>Proceed Anyway</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleTransferFirst}>
                <Text style={{ color: theme.accent, fontWeight: '700' }}>Transfer First</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};