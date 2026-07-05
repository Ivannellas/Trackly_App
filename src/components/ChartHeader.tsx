// Chart header component with view toggle buttons
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { sharedStyles } from '../styles';
import { Theme } from '../types';

type ChartViewType = 'Daily' | 'Weekly' | 'Monthly';

interface ChartHeaderProps {
  title: string;
  currentView: ChartViewType;
  onViewChange: (view: ChartViewType) => void;
  theme: Theme;
}

export const ChartHeader: React.FC<ChartHeaderProps> = ({ title, currentView, onViewChange, theme }) => {
  const views: ChartViewType[] = ['Daily', 'Weekly', 'Monthly'];

  return (
    <View style={sharedStyles.chartHeader}>
      <Text style={[sharedStyles.sectionTitle, { color: theme.text }]}>{title}</Text>
      <View style={sharedStyles.chartToggle}>
        {views.map((view) => (
          <TouchableOpacity
            key={view}
            onPress={() => onViewChange(view)}
            style={[sharedStyles.toggleBtn, currentView === view && { backgroundColor: theme.accent }]}
          >
            <Text
              style={[
                sharedStyles.toggleText,
                currentView === view ? { color: '#fff' } : { color: theme.secondaryText },
              ]}
            >
              {view[0]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};
