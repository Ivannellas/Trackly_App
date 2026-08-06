import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { sharedStyles, Themes, screenWidth, chartColors } from '../styles';
import {
  useTransactions,
  useBudgets,
  useIncomeExpense,
} from '../hooks';
import {
  TransactionItem,
  ChartHeader,
  FlippableBalanceCard,
  AutoSplitSettingsModal,
  TransferModal,
} from '../components';
import { Theme, Transaction, Profile } from '../types';
import { useNavigation, useFocusEffect } from '@react-navigation/native'; // 👈 Added useFocusEffect
import { calculateTotals } from '../utils/budgetHelpers';
import { TransactionService } from '../services';

type ChartViewType = 'Daily' | 'Weekly' | 'Monthly';

interface DashboardScreenProps {
  userId: string | undefined;
  themeMode: 'light' | 'dark';
  onThemeChange: (mode: 'light' | 'dark') => void;
  onSignOut: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  userId,
  themeMode,
  onThemeChange,
  onSignOut,
}) => {
  const theme = Themes[themeMode];
  const navigation = useNavigation<any>();

  // State
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [chartView, setChartView] = useState<ChartViewType>('Weekly');
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showAutoSplitSettings, setShowAutoSplitSettings] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Hooks
  const { transactions, fetchTransactions, deleteTransaction } = useTransactions(userId);
  const { budgets } = useBudgets();
  const { totalIncome, totalExpense } = useIncomeExpense(transactions, selectedDate);
  const { totalBalance, buckets } = calculateTotals(transactions);

  // 👈 Replaced old useEffect with useFocusEffect to trigger reload on view entry
  useFocusEffect(
    useCallback(() => {
      if (userId && typeof fetchTransactions === 'function') {
        fetchTransactions();
        TransactionService.getProfile(userId)
          .then((savedProfile) => setProfile(savedProfile))
          .catch((error) => console.error('Failed to load profile:', error));
      }
    }, [userId, fetchTransactions])
  );

  // Filter transactions by month
  const transactionsThisMonth = transactions.filter((t) => {
    const tDate = new Date(t.created_at);
    return tDate.getMonth() === selectedDate.getMonth() && tDate.getFullYear() === selectedDate.getFullYear();
  });

  // Get last 5 transactions (for recent activity)
  const recentTransactions = transactionsThisMonth.slice(0, 5);

  // Handle delete transaction
  const handleDeleteTransaction = async (item: Transaction) => {
    try {
      await deleteTransaction(item.id);
      Alert.alert('Success', 'Transaction deleted');
      // 👈 Local refresh immediately after deleting so the UI responds instantly
      if (typeof fetchTransactions === 'function') {
        await fetchTransactions();
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to delete transaction');
    }
  };

  // Generate pie chart data
  const getPieChartData = () => {
    const categoryTotals: { [key: string]: number } = {};

    transactionsThisMonth.forEach((t) => {
      if (t.type === 'expense' || t.amount < 0) {
        const cat = t.category || 'General';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + Math.abs(t.amount);
      }
    });

    return Object.keys(categoryTotals).map((cat, index) => ({
      name: cat,
      population: categoryTotals[cat],
      color: chartColors[index % chartColors.length],
      legendFontColor: theme.text,
      legendFontSize: 10,
    }));
  };

  // Generate bar chart data
  const getChartData = () => {
    let labels: string[] = [];
    let data: number[] = [];
    if (chartView === 'Daily') {
      labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      data = [0, 0, 0, 0, 0, 0, 0];
      transactionsThisMonth.forEach((t) => {
        if (t.type === 'expense' || t.amount < 0) {
          const day = new Date(t.created_at).getDay();
          const index = day === 0 ? 6 : day - 1;
          data[index] += Math.abs(t.amount);
        }
      });
    } else if (chartView === 'Weekly') {
      labels = ['W1', 'W2', 'W3', 'W4'];
      data = [0, 0, 0, 0];
      transactionsThisMonth.forEach((t) => {
        if (t.type === 'expense' || t.amount < 0) {
          const date = new Date(t.created_at).getDate();
          const idx = Math.min(Math.floor((date - 1) / 7), 3);
          data[idx] += Math.abs(t.amount);
        }
      });
    } else if (chartView === 'Monthly') {
      labels = ['July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
      data = [0, 0, 0, 0, 0, 0];
      transactions.forEach((t) => {
        if (t.type === 'expense' || t.amount < 0) {
          const month = new Date(t.created_at).getMonth();
          if (month < 6) data[month] += Math.abs(t.amount);
        }
      });
    }
    return { labels, datasets: [{ data }] };
  };

  // Function to handle manual pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (userId && typeof fetchTransactions === 'function') {
        await fetchTransactions();
      }
    } catch (error) {
      console.error("Refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  }, [userId, fetchTransactions]);

  return (
    <SafeAreaView style={[sharedStyles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={themeMode === 'light' ? 'dark-content' : 'light-content'} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header with Theme Toggle and Sign Out */}
        <View style={[sharedStyles.header, { paddingHorizontal: 20, marginBottom: 24 }]}>
          <View>
            <Text style={[sharedStyles.title, { color: theme.text }]}>Trackly</Text>
            <TouchableOpacity onPress={() => onThemeChange(themeMode === 'light' ? 'dark' : 'light')}>
              <Text style={{ color: theme.accent, fontWeight: '600', fontSize: 11, marginTop: 4 }}>
                {themeMode === 'light' ? '🌙 Dark' : '☀️ Light'}
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={onSignOut}>
            <Text style={sharedStyles.signOutLink}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Premium Balance Card with LinearGradient */}
        <View style={{ marginHorizontal: 20, marginBottom: 15 }}>
          <FlippableBalanceCard
            totalBalance={totalBalance}
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            buckets={buckets}
            theme={theme}
            onTransferPress={() => setShowTransferModal(true)}
            onSettingsPress={() => setShowAutoSplitSettings(true)}
          />
        </View>

        {/* Month Selector */}
        <View style={[sharedStyles.monthSelector, { backgroundColor: theme.card, marginHorizontal: 20, marginBottom: 15 }]}>
          <TouchableOpacity onPress={() => setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth() - 1)))}>
            <Text style={{ color: theme.accent, fontSize: 18, fontWeight: '700' }}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={[sharedStyles.monthText, { color: theme.text }]}>
            {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity onPress={() => setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth() + 1)))}>
            <Text style={{ color: theme.accent, fontSize: 18, fontWeight: '700' }}>{'>'}</Text>
          </TouchableOpacity>
        </View>

        {/* Bar Chart - Trends */}
        <View style={[sharedStyles.chartCard, { backgroundColor: theme.card, marginHorizontal: 20, marginBottom: 24, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 2 }]}>
          <ChartHeader title={`${chartView} Trends`} currentView={chartView} onViewChange={setChartView} theme={theme} />

          <BarChart
            data={getChartData()}
            width={screenWidth - 80}
            height={220}
            yAxisLabel="₱"
            yAxisSuffix=""
            fromZero
            flatColor={true}
            withInnerLines={true}
            showValuesOnTopOfBars={false}
            chartConfig={{
              backgroundGradientFrom: theme.card,
              backgroundGradientTo: theme.card,
              fillShadowGradientFrom: '#6366F1',
              fillShadowGradientTo: '#22D3EE',
              fillShadowGradientOpacity: 1,
              fillShadowGradientFromOpacity: 1,
              color: (opacity = 1) => `rgba(34, 211, 238, ${opacity})`,
              labelColor: (opacity = 1) => theme.secondaryText,
              barPercentage: 0.6,
              propsForBackgroundLines: {
                strokeDasharray: '',
                strokeWidth: 0.5,
                stroke: theme.border,
              },
            }}
            style={{
              marginVertical: 15,
              borderRadius: 16,
            }}
          />
        </View>

        {/* Pie Chart - Spending Distribution */}
        <View style={[sharedStyles.chartCard, { backgroundColor: theme.card, marginHorizontal: 20, marginBottom: 28, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 2 }]}>
          <Text style={[sharedStyles.sectionTitle, { color: theme.text, marginBottom: 10, alignSelf: 'flex-start' }]}>
            Spending Distribution
          </Text>

          {getPieChartData().length > 0 ? (
            <PieChart
              data={getPieChartData()}
              width={screenWidth - 60}
              height={180}
              chartConfig={{
                color: (opacity = 1) => theme.accent,
              }}
              accessor={'population'}
              backgroundColor={'transparent'}
              paddingLeft={'15'}
              center={[10, 0]}
              absolute
            />
          ) : (
            <Text style={{ color: theme.secondaryText, fontSize: 11, marginVertical: 20 }}>
              No spending data available for this month.
            </Text>
          )}
        </View>

        <AutoSplitSettingsModal
          visible={showAutoSplitSettings}
          userId={userId}
          profile={profile}
          theme={theme}
          onClose={() => setShowAutoSplitSettings(false)}
          onSaved={setProfile}
        />

        <TransferModal
          visible={showTransferModal}
          userId={userId}
          theme={theme}
          onClose={() => setShowTransferModal(false)}
          onCompleted={fetchTransactions}
        />

        {/* Recent Activity */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 18, color: theme.text, fontWeight: '700' }}>Recent Activity</Text>
            {transactionsThisMonth.length > 5 && (
              <TouchableOpacity onPress={() => navigation.navigate('History')}>
                <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '700' }}>See All</Text>
              </TouchableOpacity>
            )}
          </View>

          {recentTransactions.length > 0 ? (
            <View>
              {recentTransactions.map((item) => (
                <View key={item.id} style={{ marginBottom: 8 }}>
                  <TransactionItem
                    transaction={item}
                    theme={theme}
                    onLongPress={() => {
                      Alert.alert('Delete', 'Remove this transaction?', [
                        { text: 'Cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => handleDeleteTransaction(item) },
                      ]);
                    }}
                  />
                </View>
              ))}
            </View>
          ) : (
            <View style={{ backgroundColor: theme.card, borderRadius: 12, padding: 16, alignItems: 'center' }}>
              <Text style={{ color: theme.secondaryText, fontSize: 12 }}>No transactions this month</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};