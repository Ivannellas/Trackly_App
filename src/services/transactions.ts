// Transaction and related data service
import { supabase } from './supabase';
import { Transaction, Category, BudgetLimit, Subscription, SavingsGoal } from '../types';

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

  // Add a new transaction
  async addTransaction(transaction: Omit<Transaction, 'id'>) {
    const { error } = await supabase.from('transactions').insert([transaction]);
    return { error };
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

