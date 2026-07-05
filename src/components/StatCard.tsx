// Stats card component displaying income or expense
import React from 'react';
import { View, Text } from 'react-native';
import { sharedStyles } from '../styles';
import { Theme } from '../types';

interface StatCardProps {
  label: string;
  amount: number;
  color: string;
  theme: Theme;
}

export const StatCard: React.FC<StatCardProps> = ({ label, amount, color, theme }) => {
  return (
    <View style={[sharedStyles.statCard, { backgroundColor: theme.card, borderLeftColor: color }]}>
      <Text style={[sharedStyles.statLabel, { color: theme.secondaryText }]}>{label}</Text>
      <Text style={[sharedStyles.statAmount, { color }]}>₱{amount.toLocaleString()}</Text>
    </View>
  );
};
