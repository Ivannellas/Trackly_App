// Transaction item component for displaying individual transactions
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { sharedStyles } from '../styles';
import { Theme, Transaction } from '../types';

interface TransactionItemProps {
  transaction: Transaction;
  theme: Theme;
  onLongPress: () => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, theme, onLongPress }) => {
  const isExpense = transaction.amount < 0;

  return (
    <TouchableOpacity
      style={[sharedStyles.transactionItem, { backgroundColor: theme.card }]}
      onLongPress={onLongPress}
      delayLongPress={500}
    >
      <View>
        <Text style={[sharedStyles.transactionNote, { color: theme.text }]}>{transaction.note || transaction.category}</Text>
        <Text style={{ color: theme.secondaryText, fontSize: 10 }}>{transaction.category}</Text>
      </View>
      <Text style={[sharedStyles.transactionAmount, { color: isExpense ? '#EF4444' : '#10B981' }]}>
        ₱{Math.abs(transaction.amount).toFixed(2)}
      </Text>
    </TouchableOpacity>
  );
};
