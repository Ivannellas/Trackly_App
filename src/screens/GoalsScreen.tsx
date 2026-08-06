// Goals Screen - Manage Savings Goals and Recurring Bills
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { sharedStyles, Themes } from '../styles';
import { useSavingsGoals, useSubscriptions } from '../hooks';
import { GenericModal, ModalTextInput } from '../components';
import { TransactionService } from '../services';

interface GoalsScreenProps {
  userId: string | undefined;
  themeMode: 'light' | 'dark';
  onThemeChange: (mode: 'light' | 'dark') => void;
  onSignOut: () => void;
}

export const GoalsScreen: React.FC<GoalsScreenProps> = ({
  userId,
  themeMode,
  onThemeChange,
  onSignOut,
}) => {
  const theme = Themes[themeMode];
  const router = useRouter();
  const { goals, addGoal, updateGoal, removeGoal } = useSavingsGoals();
  const { subscriptions, addSubscription, removeSubscription, updateSubscription } = useSubscriptions();

  const safeNumber = (value: unknown, fallback = 0) => {
    const num = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(num) ? num : fallback;
  };

  const [goalModalVisible, setGoalModalVisible] = useState<boolean>(false);
  const [goalName, setGoalName] = useState<string>('');
  const [goalTarget, setGoalTarget] = useState<string>('');
  const [goalSaved, setGoalSaved] = useState<string>('');

  const [updateGoalModalVisible, setUpdateGoalModalVisible] = useState<boolean>(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [goalEditedTarget, setGoalEditedTarget] = useState<string>('');
  const [goalAddAmount, setGoalAddAmount] = useState<string>('');
  const [isEditingTarget, setIsEditingTarget] = useState<boolean>(false);

  const [subModalVisible, setSubModalVisible] = useState<boolean>(false);
  const [subName, setSubName] = useState<string>('');
  const [subAmount, setSubAmount] = useState<string>('');
  const [billDetailModalVisible, setBillDetailModalVisible] = useState<boolean>(false);
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [billEditedAmount, setBillEditedAmount] = useState<string>('');

  const selectedGoal = goals.find((goal) => goal.id === selectedGoalId);
  const selectedBill = subscriptions.find((sub) => sub.id === selectedBillId);

  const openUpdateGoalModal = (goalId: string) => {
    const goal = goals.find((item) => item.id === goalId);
    setSelectedGoalId(goalId);
    setGoalEditedTarget(goal ? safeNumber(goal.target, 0).toString() : '');
    setGoalAddAmount('');
    setIsEditingTarget(false);
    setUpdateGoalModalVisible(true);
  };

  const handleSaveGoalUpdate = async () => {
    if (!selectedGoal) {
      setUpdateGoalModalVisible(false);
      setSelectedGoalId(null);
      return;
    }

    const editedTarget = parseFloat(goalEditedTarget);
    if (!Number.isFinite(editedTarget) || editedTarget <= 0) {
      Alert.alert('Error', 'Please enter a valid target amount greater than 0');
      return;
    }

    const amountToAdd = goalAddAmount.trim() === '' ? 0 : parseFloat(goalAddAmount);
    if (!Number.isFinite(amountToAdd) || amountToAdd < 0) {
      Alert.alert('Error', 'Please enter a valid amount to add (0 or more)');
      return;
    }

    const updatedGoals = goals.map((goal) => {
      if (goal.id !== selectedGoal.id) return goal;
      return {
        ...goal,
        target: editedTarget,
        saved: safeNumber(goal.saved, 0) + amountToAdd,
      };
    });

    await updateGoal(updatedGoals);

    setUpdateGoalModalVisible(false);
    setSelectedGoalId(null);
    setGoalEditedTarget('');
    setGoalAddAmount('');
    setIsEditingTarget(false);
    Alert.alert('Success', `Updated "${selectedGoal.name}"`);
  };

  // Save goal
  const handleSaveGoal = async () => {
    if (!goalName || !goalTarget) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const target = parseFloat(goalTarget);
    const saved = parseFloat(goalSaved || '0');

    if (!Number.isFinite(target) || target <= 0) {
      Alert.alert('Error', 'Please enter a valid target amount greater than 0');
      return;
    }

    if (!Number.isFinite(saved) || saved < 0) {
      Alert.alert('Error', 'Please enter a valid current savings amount (0 or more)');
      return;
    }

    const newGoal = {
      id: Date.now().toString(),
      name: goalName,
      target,
      saved,
    };

    await addGoal(newGoal);
    setGoalModalVisible(false);
    setGoalName('');
    setGoalTarget('');
    setGoalSaved('');
    Alert.alert('Success', 'Goal created!');
  };

  // Save subscription
  const handleSaveSubscription = async () => {
    if (!subName || !subAmount) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const amount = parseFloat(subAmount);
    if (!Number.isFinite(amount) || amount < 0) {
      Alert.alert('Error', 'Please enter a valid monthly amount (0 or more)');
      return;
    }

    const newSub = {
      id: Date.now().toString(),
      name: subName,
      amount,
      category: 'Subscriptions',
      paid: false,
    };

    await addSubscription(newSub);
    setSubModalVisible(false);
    setSubName('');
    setSubAmount('');
    Alert.alert('Success', 'Bill added!');
  };

  const openBillDetailModal = (billId: string) => {
    const bill = subscriptions.find((item) => item.id === billId);
    setSelectedBillId(billId);
    setBillEditedAmount(bill ? safeNumber(bill.amount, 0).toString() : '');
    setBillDetailModalVisible(true);
  };

  const handleSaveBillEdit = async () => {
    if (!selectedBill) {
      setBillDetailModalVisible(false);
      setSelectedBillId(null);
      return;
    }

    const editedAmount = parseFloat(billEditedAmount);
    if (!Number.isFinite(editedAmount) || editedAmount < 0) {
      Alert.alert('Error', 'Please enter a valid amount (0 or more)');
      return;
    }

    await updateSubscription(selectedBill.id, { amount: editedAmount });
    setBillDetailModalVisible(false);
    setSelectedBillId(null);
    setBillEditedAmount('');
    Alert.alert('Success', `Updated ${selectedBill.name}`);
  };

  const handlePayBill = async () => {
    if (!selectedBill) {
      setBillDetailModalVisible(false);
      setSelectedBillId(null);
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'Please sign in to record payments');
      return;
    }

    if (selectedBill.paid) {
      Alert.alert('Info', 'This bill is already marked as paid');
      return;
    }

    const billAmount = parseFloat(billEditedAmount);
    if (!Number.isFinite(billAmount) || billAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount greater than 0 before paying');
      return;
    }

    await updateSubscription(selectedBill.id, { amount: billAmount, paid: true });

    const { error } = await TransactionService.addTransaction({
      amount: -Math.abs(billAmount),
      note: `${selectedBill.name} bill payment`,
      category: selectedBill.category || 'Subscriptions',
      user_id: userId,
      created_at: new Date().toISOString(),
    });

    if (error) {
      await updateSubscription(selectedBill.id, { paid: false });
      Alert.alert('Error', 'Failed to record payment transaction');
      return;
    }

    setBillDetailModalVisible(false);
    setSelectedBillId(null);
    setBillEditedAmount('');
    Alert.alert('Success', `${selectedBill.name} paid and added to expenses`);
  };

  return (
    <SafeAreaView style={[sharedStyles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={themeMode === 'light' ? 'dark-content' : 'light-content'} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Header */}
        <View style={[sharedStyles.header, { paddingHorizontal: 20, marginBottom: 24 }]}>
          <Text style={[sharedStyles.title, { color: theme.text }]}>Goals & Bills</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity onPress={() => router.push('/notification-settings')}>
              <Ionicons name="notifications-outline" size={22} color={theme.accent} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onSignOut}>
              <Ionicons name="log-out" size={24} color={theme.accent} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Savings Goals Section */}
        <View style={{ paddingHorizontal: 20, marginBottom: 28 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 18, color: theme.text, fontWeight: '700' }}>Savings Goals</Text>
            <TouchableOpacity onPress={() => setGoalModalVisible(true)} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="add-circle" size={24} color={theme.accent} />
            </TouchableOpacity>
          </View>

          {goals.length > 0 ? (
            <View>
              {goals.map((goal) => {
                const saved = safeNumber(goal.saved, 0);
                const target = Math.max(safeNumber(goal.target, 0), 0);
                const progress = target > 0 ? Math.min((saved / target) * 100, 100) : 0;
                return (
                  <TouchableOpacity
                    key={goal.id}
                    onPress={() => openUpdateGoalModal(goal.id)}
                    onLongPress={() => {
                      Alert.alert('Delete Goal', `Remove "${goal.name}"?`, [
                        { text: 'Cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: () => removeGoal(goal.id),
                        },
                      ]);
                    }}
                    style={{
                      backgroundColor: theme.card,
                      borderRadius: 14,
                      padding: 16,
                      marginBottom: 12,
                      borderLeftWidth: 4,
                      borderLeftColor: theme.accent,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={{ fontSize: 16, color: theme.text, fontWeight: '700' }}>{goal.name}</Text>
                      <Text style={{ fontSize: 14, color: theme.accent, fontWeight: '700' }}>{progress.toFixed(0)}%</Text>
                    </View>

                    <View style={{ marginBottom: 8 }}>
                      <View style={{ height: 8, backgroundColor: theme.border, borderRadius: 4, overflow: 'hidden' }}>
                        <View style={{ width: `${progress}%`, height: '100%', backgroundColor: theme.accent }} />
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 13, color: theme.secondaryText }}>₱{saved.toFixed(2)}</Text>
                      <Text style={{ fontSize: 13, color: theme.secondaryText }}>Goal: ₱{target.toFixed(2)}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View
              style={{
                backgroundColor: theme.card,
                borderRadius: 12,
                padding: 20,
                alignItems: 'center',
              }}
            >
              <Ionicons name="flag-outline" size={32} color={theme.secondaryText} />
              <Text style={{ color: theme.secondaryText, fontSize: 13, marginTop: 8 }}>No goals yet. Create one to start saving!</Text>
            </View>
          )}
        </View>

        {/* Recurring Bills Section */}
        <View style={{ paddingHorizontal: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 18, color: theme.text, fontWeight: '700' }}>Recurring Bills</Text>
            <TouchableOpacity onPress={() => setSubModalVisible(true)} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="add-circle" size={24} color={theme.accent} />
            </TouchableOpacity>
          </View>

          {subscriptions.length > 0 ? (
            <View>
              {subscriptions.map((sub) => {
                const amount = safeNumber(sub.amount, 0);
                return (
                  <TouchableOpacity
                    key={sub.id}
                    onPress={() => openBillDetailModal(sub.id)}
                    onLongPress={() => {
                      Alert.alert('Delete Bill', `Remove "${sub.name}"?`, [
                        { text: 'Cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: () => removeSubscription(sub.id),
                        },
                      ]);
                    }}
                    style={{
                      backgroundColor: theme.card,
                      borderRadius: 14,
                      padding: 16,
                      marginBottom: 12,
                      borderLeftWidth: 4,
                      borderLeftColor: '#F59E0B',
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: '#F59E0B',
                        opacity: 0.15,
                        marginRight: 12,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Ionicons name="cash" size={20} color="#F59E0B" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, color: theme.text, fontWeight: '700' }}>{sub.name}</Text>
                      <Text style={{ fontSize: 12, color: theme.secondaryText, marginTop: 2 }}>
                        {sub.paid ? 'Paid' : 'Unpaid'}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 16, color: '#F59E0B', fontWeight: '700' }}>₱{amount.toFixed(2)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View
              style={{
                backgroundColor: theme.card,
                borderRadius: 12,
                padding: 20,
                alignItems: 'center',
              }}
            >
              <Ionicons name="alert-circle-outline" size={32} color={theme.secondaryText} />
              <Text style={{ color: theme.secondaryText, fontSize: 13, marginTop: 8 }}>No recurring bills yet</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Goal Modal */}
      <GenericModal
        visible={goalModalVisible}
        title="Create Savings Goal"
        theme={theme}
        onCancel={() => {
          setGoalModalVisible(false);
          setGoalName('');
          setGoalTarget('');
          setGoalSaved('');
        }}
        onConfirm={handleSaveGoal}
        confirmText="Create Goal"
      >
        <ModalTextInput
          placeholder="Goal Name (e.g. RTX 4060)"
          value={goalName}
          onChangeText={setGoalName}
          theme={theme}
          autoFocus
        />
        <ModalTextInput
          placeholder="Target Amount"
          value={goalTarget}
          onChangeText={setGoalTarget}
          keyboardType="numeric"
          theme={theme}
        />
        <ModalTextInput
          placeholder="Current Savings (Optional)"
          value={goalSaved}
          onChangeText={setGoalSaved}
          keyboardType="numeric"
          theme={theme}
        />
      </GenericModal>

      {/* Update Goal Modal */}
      <GenericModal
        visible={updateGoalModalVisible}
        title={selectedGoal ? `Update ${selectedGoal.name}` : 'Update Goal'}
        theme={theme}
        onCancel={() => {
          setUpdateGoalModalVisible(false);
          setSelectedGoalId(null);
          setGoalEditedTarget('');
          setGoalAddAmount('');
          setIsEditingTarget(false);
        }}
        onConfirm={handleSaveGoalUpdate}
        confirmText="Save"
      >
        {selectedGoal ? (
          <View style={{ marginBottom: 10 }}>
            <Text style={{ color: theme.secondaryText, fontSize: 12, marginBottom: 6 }}>Name</Text>
            <Text style={{ color: theme.text, fontSize: 14, fontWeight: '700', marginBottom: 10 }}>
              {selectedGoal.name}
            </Text>
            <Text style={{ color: theme.secondaryText, fontSize: 12 }}>
              Current saved: ₱{safeNumber(selectedGoal.saved, 0).toFixed(2)}
            </Text>
            <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '700', marginTop: 4 }}>
              Progress: {(Math.max(safeNumber(selectedGoal.target, 0), 0) > 0
                ? Math.min((safeNumber(selectedGoal.saved, 0) / Math.max(safeNumber(selectedGoal.target, 0), 0)) * 100, 100)
                : 0
              ).toFixed(0)}%
            </Text>
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={{ color: theme.secondaryText, fontSize: 12 }}>Target Goal</Text>
          <TouchableOpacity
            onPress={() => setIsEditingTarget((prev) => !prev)}
            style={{ flexDirection: 'row', alignItems: 'center' }}
          >
            <Ionicons name="create-outline" size={16} color={theme.accent} />
            <Text style={{ color: theme.accent, marginLeft: 4, fontSize: 12, fontWeight: '700' }}>
              {isEditingTarget ? 'Done' : 'Edit'}
            </Text>
          </TouchableOpacity>
        </View>

        {isEditingTarget ? (
          <ModalTextInput
            placeholder="Edit Goal Amount (Target)"
            value={goalEditedTarget}
            onChangeText={setGoalEditedTarget}
            keyboardType="numeric"
            theme={theme}
          />
        ) : (
          <Text style={{ color: theme.text, fontSize: 14, fontWeight: '700', marginBottom: 10 }}>
            ₱{safeNumber(goalEditedTarget, 0).toFixed(2)}
          </Text>
        )}

        <Text style={{ color: theme.accent, fontSize: 12, marginBottom: 6, fontWeight: '700' }}>Amount to Add</Text>
        <ModalTextInput
          placeholder="Amount to Add"
          value={goalAddAmount}
          onChangeText={setGoalAddAmount}
          keyboardType="numeric"
          theme={theme}
          autoFocus
        />
      </GenericModal>

      {/* Subscription Modal */}
      <GenericModal
        visible={subModalVisible}
        title="Add Recurring Bill"
        theme={theme}
        onCancel={() => {
          setSubModalVisible(false);
          setSubName('');
          setSubAmount('');
        }}
        onConfirm={handleSaveSubscription}
        confirmText="Save Bill"
      >
        <ModalTextInput
          placeholder="Bill Name (e.g. Spotify, Netflix)"
          value={subName}
          onChangeText={setSubName}
          theme={theme}
          autoFocus
        />
        <ModalTextInput
          placeholder="Monthly Amount"
          value={subAmount}
          onChangeText={setSubAmount}
          keyboardType="numeric"
          theme={theme}
        />
      </GenericModal>

      {/* Bill Details Modal */}
      <GenericModal
        visible={billDetailModalVisible}
        title={selectedBill ? selectedBill.name : 'Bill Details'}
        theme={theme}
        onCancel={() => {
          setBillDetailModalVisible(false);
          setSelectedBillId(null);
          setBillEditedAmount('');
        }}
        onConfirm={handleSaveBillEdit}
        confirmText="Save"
      >
        {selectedBill ? (
          <View style={{ marginBottom: 10 }}>
            <Text style={{ color: theme.secondaryText, fontSize: 12, marginBottom: 6 }}>Status</Text>
            <Text style={{ color: selectedBill.paid ? '#10B981' : '#F59E0B', fontSize: 13, fontWeight: '700', marginBottom: 10 }}>
              {selectedBill.paid ? 'Paid' : 'Unpaid'}
            </Text>
            <Text style={{ color: theme.secondaryText, fontSize: 12, marginBottom: 6 }}>Amount</Text>
          </View>
        ) : null}

        <ModalTextInput
          placeholder="Bill Amount"
          value={billEditedAmount}
          onChangeText={setBillEditedAmount}
          keyboardType="numeric"
          theme={theme}
          autoFocus
        />

        <TouchableOpacity
          onPress={handlePayBill}
          style={{
            marginTop: 8,
            borderRadius: 8,
            paddingVertical: 8,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: theme.accent, fontWeight: '700' }}>Pay</Text>
        </TouchableOpacity>
      </GenericModal>
    </SafeAreaView>
  );
};
