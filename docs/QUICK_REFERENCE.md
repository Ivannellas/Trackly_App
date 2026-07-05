# Quick Reference - Budget Tracker Refactoring

## 📍 File Location Guide

### Need to find something? Use this table:

| Feature | Original Location | New Location |
|---------|------------------|--------------|
| **Authentication** | App.tsx (lines 126-158) | `src/screens/AuthScreen.tsx` + `src/services/auth.ts` |
| **Biometric auth** | App.tsx (lines 126-158) | `src/services/transactions.ts` (BiometricService) |
| **Themes** | App.tsx (lines 15-19) | `src/styles/index.ts` (Themes object) |
| **Add Transaction** | App.tsx (lines 298-320) | `src/screens/DashboardScreen.tsx` (addTransactionHandler) |
| **Delete Transaction** | App.tsx (lines 83-107) | `src/screens/DashboardScreen.tsx` (handleDeleteTransaction) |
| **Budget Management** | App.tsx (lines 179-186) | `src/hooks/index.ts` (useBudgets) |
| **Savings Goals** | App.tsx (lines 188-267) | `src/hooks/index.ts` (useSavingsGoals) |
| **Subscriptions** | App.tsx (lines 322-340) | `src/hooks/index.ts` (useSubscriptions) |
| **Charts** | App.tsx (lines 350-399) | `src/screens/DashboardScreen.tsx` (getChartData, getPieChartData) |
| **Categories** | App.tsx (lines 169-177) | `src/hooks/index.ts` (useCategories) |
| **Styles** | App.tsx (lines 860-885) | `src/styles/index.ts` (sharedStyles) |
| **Types** | App.tsx (inline types) | `src/types/index.ts` (All interfaces) |
| **Supabase Client** | supabase.ts | `src/services/supabase.ts` |
| **Balance Calc** | App.tsx (line 406) | `src/hooks/index.ts` (useTransactions) |
| **Income/Expense** | App.tsx (lines 405-408) | `src/hooks/index.ts` (useIncomeExpense) |

---

## 🧩 Component Usage Examples

### Using BalanceCard
```typescript
import { BalanceCard } from '@/components';

<BalanceCard balance={totalBalance} />
```

### Using BudgetBox
```typescript
import { BudgetBox } from '@/components';

<BudgetBox 
  title="RTX 4060"
  current={500}
  target={2000}
  theme={theme}
  progressPercent={25}
  secondaryText="Click to Add Funds"
/>
```

### Using Custom Hook
```typescript
import { useTransactions } from '@/hooks';

const { transactions, addTransaction, deleteTransaction } = useTransactions(userId);

await addTransaction({
  amount: -50,
  note: 'Lunch',
  category: 'Food',
  user_id: userId,
  created_at: new Date().toISOString(),
});
```

### Using Service
```typescript
import { AuthService } from '@/services';

const { error } = await AuthService.signInWithEmail(email, password);
if (error) Alert.alert('Error', error.message);
```

---

## 🔍 How to Debug

### Issue: "Component not found"
**Solution**: Check `src/components/index.ts` for available exports
```bash
# View available components
cat src/components/index.ts
```

### Issue: "Hook not found"
**Solution**: Check `src/hooks/index.ts` for available hooks
```bash
# View available hooks
cat src/hooks/index.ts
```

### Issue: "Service not working"
**Solution**: Check `src/services/index.ts` and relevant service files
```bash
# View available services
cat src/services/index.ts
```

### Issue: "Type error"
**Solution**: Check `src/types/index.ts` for type definitions
```bash
# View available types
cat src/types/index.ts
```

### Issue: "Styling not working"
**Solution**: Check `src/styles/index.ts` for theme and styles
```bash
# View themes and styles
cat src/styles/index.ts
```

---

## 🚀 Running the App

```bash
# Install dependencies (if not already done)
npm install

# Start the dev server
npm start
# or
expo start

# Platform options:
# i = iOS simulator
# a = Android emulator
# w = Web browser
# r = Reload
# q = Quit
```

---

## 📚 Import Patterns

### From Components
```typescript
import { BalanceCard, StatCard, BudgetBox, TransactionItem, GenericModal } from '@/components';
// or individual
import { BalanceCard } from '@/components';
```

### From Hooks
```typescript
import { useTransactions, useBudgets, useSavingsGoals } from '@/hooks';
```

### From Services
```typescript
import { AuthService, supabase, TransactionService, LocalStorageService } from '@/services';
```

### From Styles
```typescript
import { Themes, sharedStyles, screenWidth, chartColors } from '@/styles';
```

### From Types
```typescript
import { Transaction, SavingsGoal, Theme, BudgetStatus } from '@/types';
```

---

## 📋 State Management Cheat Sheet

### Transactions
```typescript
const { 
  transactions,      // Array of all transactions
  loading,           // Loading state
  fetchTransactions, // Refetch function
  addTransaction,    // Add new transaction
  deleteTransaction  // Delete transaction
} = useTransactions(userId);
```

### Budgets
```typescript
const { 
  budgets,    // Object: { category: limit }
  saveBudget  // Save/update budgets
} = useBudgets();
```

### Savings Goals
```typescript
const { 
  goals,      // Array of goals
  addGoal,    // Create new goal
  updateGoal, // Update goals
  removeGoal  // Delete goal
} = useSavingsGoals();
```

### Budget Status
```typescript
const budgetStatus = useBudgetStatus(
  'Food',           // category
  transactions,     // all transactions
  budgets,          // budget limits
  selectedDate      // current date
);
// Returns: { spent, limit, percent, color } or null
```

---

## 🎨 Theme Usage

### Accessing Theme Colors
```typescript
import { Themes } from '@/styles';

const theme = Themes['light']; // or 'dark'

// Available colors:
theme.background       // Background color
theme.text            // Main text color
theme.card            // Card background
theme.accent          // Primary accent color
theme.input           // Input field background
theme.border          // Border color
theme.secondaryText   // Secondary text color
```

### Using Styles
```typescript
import { sharedStyles } from '@/styles';

<View style={sharedStyles.button}>
  <Text style={sharedStyles.buttonText}>Click Me</Text>
</View>
```

---

## 🔄 Feature Checklist

All original features preserved:

- ✅ Sign In / Sign Up
- ✅ Biometric Authentication
- ✅ Dark/Light Theme Toggle
- ✅ Add/Delete Transactions
- ✅ Filter by Category
- ✅ Search Transactions
- ✅ Create Categories
- ✅ Set Budget Limits
- ✅ Budget Warnings
- ✅ Savings Goals
- ✅ Add Funds to Goals
- ✅ Recurring Subscriptions
- ✅ Quick Add Presets
- ✅ Daily/Weekly/Monthly Charts
- ✅ Spending Distribution (Pie)
- ✅ Income/Expense Stats
- ✅ Current Balance Display
- ✅ Transaction History
- ✅ Month Navigation
- ✅ Date Picker for Transactions

---

## 📦 Exports from Each Module

### `src/components/index.ts`
```typescript
export { BalanceCard }
export { StatCard }
export { BudgetBox }
export { TransactionItem }
export { GenericModal, ModalTextInput }
export { ChartHeader }
```

### `src/services/index.ts`
```typescript
export { supabase }
export { AuthService }
export { TransactionService, LocalStorageService, BiometricService }
```

### `src/hooks/index.ts`
```typescript
export { useTransactions }
export { useCategories }
export { useBudgets }
export { useSubscriptions }
export { useSavingsGoals }
export { useBudgetStatus }
export { useIncomeExpense }
```

### `src/types/index.ts`
```typescript
export interface Transaction
export interface Category
export interface BudgetLimit
export interface SavingsGoal
export interface Subscription
export interface BudgetStatus
export interface User
export interface Session
export interface Theme
export type ThemeMode
```

### `src/styles/index.ts`
```typescript
export const screenWidth
export const screenHeight
export const Themes
export const sharedStyles
export const chartColors
```

---

## 🎯 Common Tasks

### Add a new screen
1. Create `src/screens/MyScreen.tsx`
2. Export from `src/screens/index.ts`
3. Add to `src/navigation/index.ts` AppNavigator

### Add a new component
1. Create `src/components/MyComponent.tsx`
2. Export from `src/components/index.ts`
3. Use in screens

### Add a new hook
1. Add to `src/hooks/index.ts`
2. Export from file
3. Use in screens/components

### Add a new service
1. Create `src/services/myservice.ts`
2. Export from `src/services/index.ts`
3. Use in hooks/screens

---

## ✅ Verification Checklist

Before going live, ensure:

- ✅ No TypeScript errors (`npm run type-check`)
- ✅ App starts without crashes
- ✅ Authentication works
- ✅ All transactions display
- ✅ Charts render correctly
- ✅ Theme toggle works
- ✅ Modals open/close properly
- ✅ Budgets save correctly
- ✅ Savings goals work
- ✅ Subscriptions display

---

## 📞 Quick Links

| Need | File |
|------|------|
| Architecture Overview | `REFACTORING_GUIDE.md` |
| Code Location Mapping | `CODE_MAPPING.md` |
| High-Level Summary | `REFACTORING_SUMMARY.md` |
| Quick Reference | **This file** |

---

**Status**: ✅ Ready to Use
**Version**: 1.0
**Last Updated**: April 12, 2026
