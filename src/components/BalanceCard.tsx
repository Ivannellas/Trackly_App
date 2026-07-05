// Balance card component displaying current balance
import React from 'react';
import { View, Text } from 'react-native';
import { sharedStyles } from '../styles';

interface BalanceCardProps {
  balance: number;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({ balance }) => {
  return (
    <View style={[sharedStyles.balanceCard, { backgroundColor: '#4F46E5' }]}>
      <Text style={sharedStyles.balanceLabel}>Current Balance</Text>
      <Text style={sharedStyles.balanceAmount}>₱{balance.toLocaleString()}</Text>
    </View>
  );
};
