# Architecture Diagram

## Overall Application Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         index.ts (Entry)                        │
│              registerRootComponent(App from src/App)            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                         src/App.tsx                             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ State: session, themeMode, isUnlocked                     │ │
│  │                                                            │ │
│  │ Logic:                                                     │ │
│  │ • initializeAuth() - Setup auth state                    │ │
│  │ • handleAuthentication() - Biometric auth               │ │
│  │ • checkBiometricStatus() - Security prompts             │ │
│  │ • handleSignOut() - Sign out handler                    │ │
│  │                                                            │ │
│  │ Decisions:                                                 │ │
│  │ if (!session) → AuthScreen                               │ │
│  │ if (!isUnlocked) → Blank screen (loading)                │ │
│  │ else → AppNavigator                                       │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────┬────────────────────────────────────┘
                             │
                 ┌───────────┴───────────┐
                 │                       │
      ┌──────────▼──────────┐  ┌────────▼──────────┐
      │   AuthScreen        │  │  AppNavigator     │
      │   (Sign In/Up)      │  │  (Bottom Tabs)    │
      └────────────────────┘  └────────┬──────────┘
                                       │
                                       ▼
                          ┌──────────────────────┐
                          │ DashboardScreen      │
                          │ (Main UI)            │
                          └──────────┬───────────┘
                                     │
                ┌────────────────────┼────────────────────┐
                │                    │                    │
                ▼                    ▼                    ▼
         ┌────────────┐      ┌──────────────┐    ┌──────────────┐
         │Components  │      │Hooks         │    │Services      │
         ├────────────┤      ├──────────────┤    ├──────────────┤
         │BalanceCard│      │useTransact.  │    │AuthService   │
         │StatCard   │      │useCategories │    │TransactionSrv│
         │BudgetBox  │      │useBudgets    │    │LocalStorage  │
         │TransItem  │      │useSubs       │    │BiometricSrv  │
         │GenericMdl │      │useSavingsGoal│    │supabase      │
         │ChartHdr   │      │useBudgetStat │    └──────────────┘
         └────────────┘      │useIncomeExp │
                             └──────────────┘
                                    │
                                    ▼
                          ┌──────────────────────┐
                          │ Supabase Database    │
                          │                      │
                          │ • transactions       │
                          │ • categories         │
                          │ • auth               │
                          └──────────────────────┘
```

---

## State Management Hierarchy

```
App.tsx
├── [session] → Session state
│   ├── Used by: DashboardScreen, AppNavigator
│   └── Source: AuthService.onAuthStateChange()
│
├── [themeMode] → Theme selection (light/dark)
│   ├── Used by: All components via theme prop
│   └── Passed to: DashboardScreen, AppNavigator
│
└── [isUnlocked] → Biometric lock state
    ├── Set by: handleAuthentication(), checkBiometricStatus()
    └── Used by: Conditional rendering

DashboardScreen.tsx
├── Transaction Form State
│   ├── [amount] → Transaction amount
│   ├── [description] → Transaction note
│   ├── [category] → Selected category
│   ├── [transDate] → Transaction date
│   └── [showDatePicker] → Date picker visibility
│
├── UI Modal States
│   ├── [isModalVisible] → New category modal
│   ├── [budgetModalVisible] → Set budget modal
│   ├── [subModalVisible] → Add subscription modal
│   ├── [goalModalVisible] → Create goal modal
│   └── [fundModalVisible] → Add funds to goal modal
│
├── Filter/View State
│   ├── [searchQuery] → Transaction search
│   ├── [selectedDate] → Current month
│   ├── [chartView] → Chart view type (Daily/Weekly/Monthly)
│   └── [category] → Filter category
│
└── Hook States (Data)
    ├── transactions → useTransactions()
    ├── categories → useCategories()
    ├── budgets → useBudgets()
    ├── subscriptions → useSubscriptions()
    └── goals → useSavingsGoals()
```

---

## Component Tree (Detailed)

```
App
├── AuthScreen (when !session)
│   ├── TextInput (email)
│   ├── TextInput (password)
│   ├── TouchableOpacity (Sign In)
│   └── TouchableOpacity (Register)
│
└── SafeAreaProvider
    └── AppNavigator (BottomTabNavigator)
        └── Dashboard Tab
            └── DashboardScreen
                ├── StatusBar
                ├── FlatList (Transactions)
                │   ├── ListHeaderComponent
                │   │   ├── Header (Title + Theme Toggle + Sign Out)
                │   │   ├── SearchInput
                │   │   ├── BalanceCard
                │   │   ├── StatCard (Income)
                │   │   ├── StatCard (Expense)
                │   │   ├── Savings Goals Section
                │   │   │   ├── BudgetBox (each goal)
                │   │   │   └── TouchableOpacity (+ NEW GOAL)
                │   │   ├── Budget Limit Display
                │   │   │   └── BudgetBox (if set)
                │   │   ├── Subscriptions Section
                │   │   │   ├── ScrollView
                │   │   │   └── TouchableOpacity (each sub)
                │   │   ├── Month Selector
                │   │   ├── Bar Chart
                │   │   │   └── ChartHeader
                │   │   ├── Pie Chart
                │   │   ├── Transaction Form
                │   │   │   ├── TextInput (amount)
                │   │   │   ├── TouchableOpacity (date)
                │   │   │   ├── Picker (category)
                │   │   │   ├── TextInput (note)
                │   │   │   ├── Category Chips
                │   │   │   ├── Quick Add Buttons
                │   │   │   └── SAVE TRANSACTION button
                │   │   └── List Title
                │   │
                │   └── renderItem
                │       └── TransactionItem
                │           ├── Note text
                │           ├── Category text
                │           └── Amount (colored)
                │
                ├── Modal (Add Funds)
                │   ├── GenericModal
                │   │   ├── ModalTextInput (amount)
                │   │   ├── Cancel button
                │   │   └── Add Funds button
                │
                ├── Modal (New Goal)
                │   ├── GenericModal
                │   │   ├── ModalTextInput (goal name)
                │   │   ├── ModalTextInput (target amount)
                │   │   ├── ModalTextInput (initial savings)
                │   │   ├── Cancel button
                │   │   └── Create Goal button
                │
                ├── Modal (Add Subscription)
                │   ├── GenericModal
                │   │   ├── ModalTextInput (name)
                │   │   ├── ModalTextInput (amount)
                │   │   ├── Picker (category)
                │   │   ├── Cancel button
                │   │   └── Save Bill button
                │
                ├── Modal (Set Budget)
                │   ├── GenericModal
                │   │   ├── ModalTextInput (amount)
                │   │   ├── Cancel button
                │   │   └── Save Limit button
                │
                ├── Modal (New Category)
                │   ├── GenericModal
                │   │   ├── ModalTextInput (name)
                │   │   ├── Cancel button
                │   │   └── Save button
                │
                └── DateTimePicker
                    └── Date selection
```

---

## Data Flow Diagram

```
User Action
    ↓
DashboardScreen Handler
    ↓
Hook Method (e.g., useTransactions)
    ↓
Service Method (e.g., TransactionService)
    ↓
Database/Storage
    │
    ├─ Supabase (transactions, categories)
    │   └─ Network request
    │
    └─ AsyncStorage (budgets, goals, subscriptions)
        └─ Local storage
    ↓
State Update
    ↓
Component Re-render
    ↓
UI Update
```

---

## Function Call Chain Example

### Adding a Transaction:

```
User Input (amount, description, category, date)
    ↓
[FORM STATE UPDATED]
    amount, description, category, transDate
    ↓
User clicks "SAVE TRANSACTION"
    ↓
addTransactionHandler() called
    ├─ getBudgetStatusForCategory() → Check budget
    │   └─ Return: { spent, limit, percent, color }
    │
    ├─ If over budget → Show Alert
    │   └─ User confirms "Save Anyway"
    │
    └─ proceedWithSave()
        ├─ setLoading(true)
        │
        ├─ await hookAddTransaction({...})
        │   └─ TransactionService.addTransaction()
        │       └─ supabase.from('transactions').insert()
        │
        ├─ await fetchTransactions()
        │   └─ TransactionService.getTransactions()
        │       └─ Update [transactions] state
        │
        ├─ setAmount('') → Clear form
        ├─ setDescription('')
        ├─ Keyboard.dismiss()
        │
        └─ setLoading(false)
            ↓
FlatList re-renders with new transaction
```

---

## Service Interaction Diagram

```
┌──────────────────────────────────────────────────────────┐
│                    DashboardScreen                       │
│                      (UI Layer)                          │
└──────────────────────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│useTransactions│  │useBudgets    │  │useSavingsGoal│
│(Hooks Layer) │  │(Hooks Layer) │  │(Hooks Layer) │
└──────────────┘  └──────────────┘  └──────────────┘
        │                │                │
        └────────────────┼────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│Transaction   │  │LocalStorage  │  │BiometricSrv  │
│Service       │  │Service       │  │Service       │
│(API Layer)   │  │(Storage API) │  │(Auth Layer)  │
└──────────────┘  └──────────────┘  └──────────────┘
        │                │                │
        ▼                ▼                ▼
    [Supabase]     [AsyncStorage]    [SecureStore]
```

---

## File Dependency Graph

```
index.ts
    ↓
src/App.tsx
    ├─ src/screens/AuthScreen.tsx
    │   └─ src/services/auth.ts
    │       └─ src/services/supabase.ts
    │
    ├─ src/navigation/index.ts
    │   ├─ src/screens/DashboardScreen.tsx
    │   │   ├─ src/components/*.tsx
    │   │   ├─ src/hooks/index.ts
    │   │   │   ├─ src/services/transactions.ts
    │   │   │   │   └─ src/services/supabase.ts
    │   │   │   └─ src/types/index.ts
    │   │   ├─ src/services/index.ts
    │   │   ├─ src/styles/index.ts
    │   │   └─ src/types/index.ts
    │   │
    │   ├─ src/styles/index.ts
    │   └─ src/types/index.ts
    │
    └─ src/services/index.ts
        ├─ src/services/auth.ts
        ├─ src/services/supabase.ts
        └─ src/services/transactions.ts
```

---

## External Dependencies

```
React Native Ecosystem
├─ react-native
├─ react-native-safe-area-context
├─ react-native-screens
├─ react (@react-navigation/native)
│
Navigation
├─ @react-navigation/bottom-tabs
└─ @react-navigation/native
│
UI Components
├─ react-native-chart-kit (BarChart, PieChart)
├─ react-native-svg (Chart rendering)
├─ @react-native-picker/picker (Category/Expense selector)
│
Date & Time
├─ @react-native-community/datetimepicker
│
Authentication & Security
├─ @supabase/supabase-js (Database & Auth)
├─ expo-local-authentication (Biometric auth)
│
Storage
├─ @react-native-async-storage/async-storage (Local storage)
│
Icons
└─ @expo/vector-icons (Tab icons)
```

---

## Performance Considerations

```
Optimizations Already in Place:
├─ FlatList (virtualization) for transactions
├─ Memoization via hooks
├─ Local hook state prevents unnecessary renders
├─ Transaction filtering computed inline
└─ Chart data cached in state

Potential Future Optimizations:
├─ React.memo() on components
├─ useCallback() for handlers
├─ useMemo() for expensive calculations
├─ Pagination for large transaction lists
└─ Debounced search input
```

---

## Security Flow

```
User Opens App
    ↓
App.tsx initializes
    ├─ Check if authenticated (AuthService.getSession())
    │   ├─ No session → Show AuthScreen
    │   └─ Has session → Continue
    │
    ├─ Check biometric setting (BiometricService.isBiometricEnabled())
    │   ├─ Enabled → Prompt for biometric
    │   │   ├─ Success → setIsUnlocked(true)
    │   │   └─ Failure → Retry or cancel
    │   │
    │   ├─ Disabled → Check snooze date
    │   │   ├─ Snoozed today → setIsUnlocked(true)
    │   │   └─ Not snoozed → Show security prompt
    │   │       ├─ "Not Now" → setIsUnlocked(true)
    │   │       ├─ "No more today" → Snooze + setIsUnlocked(true)
    │   │       └─ "Enable" → Enable + Prompt biometric
    │
    └─ Show Dashboard
        ├─ User can view/add transactions
        ├─ User can sign out
        │   └─ AuthService.signOut()
        └─ Session ends
```

---

**Generated**: April 12, 2026  
**Status**: ✅ Complete Architecture  
**Scale**: ~2,500 lines across 16 modular files
