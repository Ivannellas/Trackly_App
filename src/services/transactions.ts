// Transaction and related data service
import { supabase } from './supabase';
import { Transaction, Category, BudgetLimit, Subscription, SavingsGoal, Profile, BucketName } from '../types';
import { onExpenseAdded } from './notificationService';
import { createGroupId } from '../utils/budgetHelpers';

const toPositiveAmount = (value: number) => Math.abs(Number(value) || 0);

export const TransactionService = {
  // Fetch all transactions for a user
  async getTransactions(userId: string) {
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return data as Transaction[];
  },

  async addTransactions(transactions: Omit<Transaction, 'id'>[]) {
    const { data, error } = await supabase.from('transactions').insert(transactions).select('*');
    return { data: data as Transaction[] | null, error };
  },

  // Add a new transaction
  async addTransaction(transaction: Omit<Transaction, 'id'>) {
    const { error } = await supabase.from('transactions').insert([transaction]);
    if (!error && transaction.type === 'expense') {
      await onExpenseAdded(transaction.created_at);
    }
    return { error };
  },
  
  

  async createAutoSplitIncome(input: {
    userId: string;
    amount: number;
    note: string;
    category: string;
    created_at: string;
    splits: Record<BucketName, number>;
  }) {
    try {
      const groupId = createGroupId();

      const entries = (['needs', 'wants', 'others'] as BucketName[])
        .map((bucket) => {
          const splitVal = Number(input.splits[bucket]) || 0;
          const finalAmount = typeof toPositiveAmount === 'function'
            ? toPositiveAmount(splitVal)
            : Math.abs(splitVal);

          return {
            amount: finalAmount,
            note: input.note ? `${input.note} (${bucket})` : `Auto-split: ${bucket}`,
            category: input.category || 'General',
            user_id: input.userId,
            created_at: input.created_at,
            bucket,
            type: 'income' as const,
            group_id: groupId,
          };
        })
        // Filter out zero-amount splits if database rejects 0-value transactions
        .filter((entry) => entry.amount > 0);

      if (entries.length === 0) {
        return { error: new Error('Total auto-split amount must be greater than zero.') };
      }

      // Ensure addTransactions returns { data, error } or handle exceptions directly
      const result = await this.addTransactions(entries);
      return result || { error: null };
    } catch (error) {
      console.error('Error in createAutoSplitIncome:', error);
      return { error };
    }
  },

  async createTransfer(input: {
    userId: string;
    amount: number;
    sourceBucket: BucketName;
    targetBucket: BucketName;
    note: string;
    created_at: string;
  }) {
    const groupId = createGroupId();
    const amount = toPositiveAmount(input.amount);

    return this.addTransactions([
      {
        amount: -amount,
        note: input.note,
        category: 'Transfer',
        user_id: input.userId,
        created_at: input.created_at,
        bucket: input.sourceBucket,
        type: 'transfer',
        group_id: groupId,
      },
      {
        amount,
        note: input.note,
        category: 'Transfer',
        user_id: input.userId,
        created_at: input.created_at,
        bucket: input.targetBucket,
        type: 'transfer',
        group_id: groupId,
      },
    ]);
  },

  async getProfile(userId: string) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error) {
      throw error;
    }

    return (data as Profile | null) ?? null;
  },

  async upsertProfile(profile: Profile) {
    const payload = {
      id: profile.id,
      auto_split_needs: Number(profile.auto_split_needs),
      auto_split_wants: Number(profile.auto_split_wants),
      auto_split_others: Number(profile.auto_split_others),
    };

    const { data, error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' }).select('*').single();
    return { data: data as Profile | null, error };
  },

  // Delete a transaction
  async deleteTransaction(transactionId: string) {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId);
    return { error };
  },

  // Fetch all categories for a user
  async getCategories(userId: string) {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId);
    return data as Category[];
  },

  // Add a new category
  async addCategory(name: string, userId: string) {
    const { error, data } = await supabase
      .from('categories')
      .insert([{ name: name.trim(), user_id: userId }]);
    return { error, data };
  },
};

// Local storage service for budgets, subscriptions, and savings goals
export const LocalStorageService = {
  // Budget limits
  BUDGET_KEY: '@category_budgets',

  async saveBudgets(budgets: BudgetLimit) {
    const AsyncStorage = await import('@react-native-async-storage/async-storage').then(m => m.default);
    await AsyncStorage.setItem(this.BUDGET_KEY, JSON.stringify(budgets));
  },

  async getBudgets() {
    const AsyncStorage = await import('@react-native-async-storage/async-storage').then(m => m.default);
    const saved = await AsyncStorage.getItem(this.BUDGET_KEY);
    return saved ? JSON.parse(saved) : {};
  },

  // Subscriptions
  SUBS_KEY: '@recurring_subscriptions',

  async saveSubscriptions(subscriptions: Subscription[]) {
    const AsyncStorage = await import('@react-native-async-storage/async-storage').then(m => m.default);
    await AsyncStorage.setItem(this.SUBS_KEY, JSON.stringify(subscriptions));
  },

  async getSubscriptions() {
    const AsyncStorage = await import('@react-native-async-storage/async-storage').then(m => m.default);
    const saved = await AsyncStorage.getItem(this.SUBS_KEY);
    return saved ? JSON.parse(saved) : [];
  },

  // Savings goals
  SAVINGS_KEY: '@savings_goals',

  async saveSavingsGoals(goals: SavingsGoal[]) {
    const AsyncStorage = await import('@react-native-async-storage/async-storage').then(m => m.default);
    await AsyncStorage.setItem(this.SAVINGS_KEY, JSON.stringify(goals));
  },

  async getSavingsGoals() {
    const AsyncStorage = await import('@react-native-async-storage/async-storage').then(m => m.default);
    const saved = await AsyncStorage.getItem(this.SAVINGS_KEY);
    return saved ? JSON.parse(saved) : [];
  },

  // Add this inside the LocalStorageService object in your transactions.ts file:

  PRESETS_KEY: '@quick_add_presets',

  async savePresets(presets: { fare: string; lunch: string }) {
    const AsyncStorage = await import('@react-native-async-storage/async-storage').then(m => m.default);
    await AsyncStorage.setItem(this.PRESETS_KEY, JSON.stringify(presets));
  },

  async getPresets() {
    const AsyncStorage = await import('@react-native-async-storage/async-storage').then(m => m.default);
    const saved = await AsyncStorage.getItem(this.PRESETS_KEY);
    return saved ? JSON.parse(saved) : { fare: '15', lunch: '50' }; // fallback to your current defaults
  },

  async getBucketSummary(userId: string) {
    const { data, error } = await supabase.from('transactions').select('*').eq('user_id', userId);
    if (error) {
      throw error;
    }

    return data as Transaction[];
  },
};

// Biometric authentication service
export const BiometricService = {
  BIOMETRIC_PREF_KEY: '@biometric_enabled',
  SNOOZE_KEY: '@snooze_biometric_date',

  async setBiometricEnabled(enabled: boolean) {
    const AsyncStorage = await import('@react-native-async-storage/async-storage').then(m => m.default);
    await AsyncStorage.setItem(this.BIOMETRIC_PREF_KEY, enabled ? 'true' : 'false');
  },

  async isBiometricEnabled() {
    const AsyncStorage = await import('@react-native-async-storage/async-storage').then(m => m.default);
    const isEnabled = await AsyncStorage.getItem(this.BIOMETRIC_PREF_KEY);
    return isEnabled === 'true';
  },

  async setSnoozedDate(date: Date) {
    const AsyncStorage = await import('@react-native-async-storage/async-storage').then(m => m.default);
    await AsyncStorage.setItem(this.SNOOZE_KEY, date.toDateString());
  },

  async getSnoozedDate() {
    const AsyncStorage = await import('@react-native-async-storage/async-storage').then(m => m.default);
    return await AsyncStorage.getItem(this.SNOOZE_KEY);
  },
};

