// TypeScript interfaces and types for the Budget Tracker app

export type BucketName = 'needs' | 'wants' | 'others';
export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  amount: number;
  note: string;
  category: string;
  user_id: string;
  created_at: string;
  bucket: BucketName;
  type: TransactionType;
  group_id?: string | null;
}

export interface Profile {
  id: string;
  auto_split_needs: number;
  auto_split_wants: number;
  auto_split_others: number;
}

export interface Category {
  id: string;
  name: string;
  user_id: string;
}

export interface BudgetLimit {
  [key: string]: number; // category: limit amount
}

export interface SavingsGoal {
  id: string;
  name: string;
  target: number;
  saved: number;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  category: string;
  paid: boolean;
}

export interface BudgetStatus {
  spent: number;
  limit: number;
  percent: number;
  color: string;
}

export interface User {
  id: string;
  email?: string;
}

export interface Session {
  user: User;
  access_token: string;
}

export interface Theme {
  background: string;
  text: string;
  card: string;
  accent: string;
  input: string;
  border: string;
  secondaryText: string;
  chip: string;
  chipBorder: string;
}

export type ThemeMode = 'light' | 'dark';
