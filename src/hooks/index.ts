// Custom hooks for the Budget Tracker app

import { useEffect, useState } from 'react';
import { TransactionService, LocalStorageService } from '../services';
import { Transaction, Category, BudgetLimit, Subscription, SavingsGoal } from '../types';

const toSafeNumber = (value: unknown, fallback = 0) => {
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num : fallback;
};

// Hook to fetch and manage transactions
export const useTransactions = (userId: string | undefined) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTransactions = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const data = await TransactionService.getTransactions(userId);
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [userId]);

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    try {
      setLoading(true);
      await TransactionService.addTransaction(transaction);
      await fetchTransactions();
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteTransaction = async (transactionId: string) => {
    try {
      setLoading(true);
      await TransactionService.deleteTransaction(transactionId);
      await fetchTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    transactions,
    loading,
    fetchTransactions,
    addTransaction,
    deleteTransaction,
  };
};

// Hook to fetch and manage categories
export const useCategories = (userId: string | undefined) => {
  const [categories, setCategories] = useState<string[]>(['General', 'Food', 'Transport', 'Salary']);

  const fetchCategories = async () => {
    if (!userId) return;
    try {
      const data = await TransactionService.getCategories(userId);
      const uniqueCategories = Array.from(
        new Set(['General', 'Food', 'Transport', 'Salary', ...(data || []).map((c) => c.name)])
      ) as string[];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [userId]);

  const addCategory = async (name: string) => {
    if (!userId) return;
    try {
      await TransactionService.addCategory(name, userId);
      await fetchCategories();
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  };

  return {
    categories,
    fetchCategories,
    addCategory,
  };
};

// Hook to manage category budgets
export const useBudgets = () => {
  const [budgets, setBudgets] = useState<BudgetLimit>({});

  useEffect(() => {
    // Load budgets on mount
    LocalStorageService.getBudgets().then(setBudgets);
  }, []);

  const saveBudget = async (budgets: BudgetLimit) => {
    await LocalStorageService.saveBudgets(budgets);
    setBudgets(budgets);
  };

  return {
    budgets,
    saveBudget,
  };
};

// Hook to manage subscriptions
export const useSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  useEffect(() => {
    // Load subscriptions on mount
    LocalStorageService.getSubscriptions().then((data) => {
      const normalized = (data || []).map((item: any) => ({
        id: String(item?.id ?? Date.now().toString()),
        name: String(item?.name ?? 'Unnamed Bill'),
        amount: toSafeNumber(item?.amount, 0),
        category: String(item?.category ?? 'Subscriptions'),
        paid: Boolean(item?.paid),
      })) as Subscription[];
      setSubscriptions(normalized);
    });
  }, []);

  const addSubscription = async (subscription: Subscription) => {
    const updated = [...subscriptions, subscription];
    await LocalStorageService.saveSubscriptions(updated);
    setSubscriptions(updated);
  };

  const removeSubscription = async (subscriptionId: string) => {
    const updated = subscriptions.filter((s) => s.id !== subscriptionId);
    await LocalStorageService.saveSubscriptions(updated);
    setSubscriptions(updated);
  };

  const updateSubscription = async (subscriptionId: string, updates: Partial<Subscription>) => {
    const updated = subscriptions.map((subscription) =>
      subscription.id === subscriptionId ? { ...subscription, ...updates } : subscription
    );
    await LocalStorageService.saveSubscriptions(updated);
    setSubscriptions(updated);
  };

  return {
    subscriptions,
    addSubscription,
    removeSubscription,
    updateSubscription,
  };
};

// Hook to manage savings goals
export const useSavingsGoals = () => {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);

  useEffect(() => {
    // Load goals on mount
    LocalStorageService.getSavingsGoals().then((data) => {
      const normalized = (data || []).map((item: any) => ({
        id: String(item?.id ?? Date.now().toString()),
        name: String(item?.name ?? 'Unnamed Goal'),
        target: toSafeNumber(item?.target, 0),
        saved: toSafeNumber(item?.saved, 0),
      })) as SavingsGoal[];
      setGoals(normalized);
    });
  }, []);

  const addGoal = async (goal: SavingsGoal) => {
    const updated = [...goals, goal];
    await LocalStorageService.saveSavingsGoals(updated);
    setGoals(updated);
  };

  const updateGoal = async (updatedGoals: SavingsGoal[]) => {
    await LocalStorageService.saveSavingsGoals(updatedGoals);
    setGoals(updatedGoals);
  };

  const removeGoal = async (goalId: string) => {
    const updated = goals.filter((g) => g.id !== goalId);
    await LocalStorageService.saveSavingsGoals(updated);
    setGoals(updated);
  };

  return {
    goals,
    addGoal,
    updateGoal,
    removeGoal,
  };
};

// Hook to calculate budget status for a category
export const useBudgetStatus = (category: string, transactions: Transaction[], budgets: BudgetLimit, selectedDate: Date) => {
  const transactionsThisMonth = transactions.filter((t) => {
    const tDate = new Date(t.created_at);
    return tDate.getMonth() === selectedDate.getMonth() && tDate.getFullYear() === selectedDate.getFullYear();
  });

  const limit = budgets[category];
  if (!limit) return null;

  const spent = Math.abs(
    transactionsThisMonth
      .filter((t) => t.category === category && t.amount < 0)
      .reduce((s, t) => s + t.amount, 0)
  );

  const percent = (spent / limit) * 100;
  let color = '#10B981'; // Green
  if (percent >= 100) color = '#EF4444'; // Red
  else if (percent >= 80) color = '#F59E0B'; // Amber

  return { spent, limit, percent, color };
};

// Hook to calculate total income and expense
export const useIncomeExpense = (transactions: Transaction[], selectedDate: Date) => {
  const transactionsThisMonth = transactions.filter((t) => {
    const tDate = new Date(t.created_at);
    return tDate.getMonth() === selectedDate.getMonth() && tDate.getFullYear() === selectedDate.getFullYear();
  });

  const totalIncome = transactionsThisMonth.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactionsThisMonth
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return { totalIncome, totalExpense };
};
