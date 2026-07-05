// Add Transaction Screen - Dedicated screen for adding new transactions
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Keyboard,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { sharedStyles, Themes } from '../styles';
import { useTransactions, useCategories, useBudgets } from '../hooks';
import { Theme } from '../types';

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
  const { addTransaction: hookAddTransaction } = useTransactions(userId);
  const { categories } = useCategories(userId);
  const { budgets } = useBudgets();

  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('General');
  const [transDate, setTransDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const [fareAmount, setFareAmount] = useState('15');
  const [lunchAmount, setLunchAmount] = useState('50');

  // Calculate budget status for category
  const getBudgetStatus = () => {
    const limit = budgets[category];
    if (!limit || amount === '') return null;
    const val = parseFloat(amount);
    if (val >= 0) return null; // Only warn for expenses
    const absAmount = Math.abs(val);
    return { limit, amount: absAmount, exceeds: absAmount > limit };
  };

  // Handle add transaction
  const handleAddTransaction = async () => {
    if (!amount || isNaN(Number(amount))) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const val = parseFloat(amount);
    const budgetStatus = getBudgetStatus();

    // Show budget warning if applicable
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
      await hookAddTransaction({
        amount: val,
        note: description,
        category,
        user_id: userId!,
        created_at: transDate.toISOString(),
      } as any);

      Alert.alert('Success', 'Transaction saved!');
      setAmount('');
      setDescription('');
      setCategory('General');
      setTransDate(new Date());
      Keyboard.dismiss();
    } catch (error) {
      Alert.alert('Error', 'Failed to add transaction');
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

        {/* Quick Add Presets */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <Text style={{ fontSize: 12, color: theme.secondaryText, fontWeight: '600', marginBottom: 8 }}>QUICK ADD</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={() => {
                setAmount('-15');
                setCategory('Transport');
                setDescription('Fare');
              }}
              style={{
                flex: 1,
                backgroundColor: theme.card,
                borderRadius: 12,
                padding: 12,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <Text style={{ color: theme.text, fontSize: 12, fontWeight: '700' }}>🚌 Fare</Text>
              <Text style={{ color: theme.accent, fontSize: 14, fontWeight: '700', marginTop: 4 }}>-₱15</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setAmount('-50');
                setCategory('Food');
                setDescription('Lunch');
              }}
              style={{
                flex: 1,
                backgroundColor: theme.card,
                borderRadius: 12,
                padding: 12,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <Text style={{ color: theme.text, fontSize: 12, fontWeight: '700' }}>🍱 Lunch</Text>
              <Text style={{ color: theme.accent, fontSize: 14, fontWeight: '700', marginTop: 4 }}>-₱50</Text>
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
    </SafeAreaView>
  );
};
