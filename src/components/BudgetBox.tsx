// Budget box component for displaying savings goals and budget limits
import React from 'react';
import { View, Text } from 'react-native';
import { sharedStyles } from '../styles';
import { Theme } from '../types';

interface BudgetBoxProps {
  title: string;
  current: number;
  target: number;
  theme: Theme;
  progressPercent?: number;
  statusColor?: string;
  secondaryText?: string;
}

export const BudgetBox: React.FC<BudgetBoxProps> = ({
  title,
  current,
  target,
  theme,
  progressPercent,
  statusColor,
  secondaryText,
}) => {
  const percent = progressPercent ?? (current / target) * 100;
  const color = statusColor ?? theme.accent;

  return (
    <View style={[sharedStyles.budgetBox, { backgroundColor: theme.card }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: theme.text, fontSize: 12, fontWeight: 'bold' }}>{title}</Text>
        <Text style={{ color, fontSize: 11, fontWeight: 'bold' }}>
          ₱{current.toLocaleString()} / ₱{target.toLocaleString()}
        </Text>
      </View>
      <View style={sharedStyles.progressBarBg}>
        <View style={[sharedStyles.progressBarFill, { width: `${Math.min(percent, 100)}%`, backgroundColor: color }]} />
      </View>
      <Text style={{ color: theme.secondaryText, fontSize: 10, marginTop: 4 }}>
        {percent.toFixed(1)}% Completed {secondaryText ? `• ${secondaryText}` : ''}
      </Text>
    </View>
  );
};
