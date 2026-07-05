// Transaction Screen - Display full history of transactions with filtering
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { sharedStyles, Themes, screenWidth } from '../styles';
import { useTransactions, useCategories } from '../hooks';
import { TransactionItem } from '../components';
import { Theme, Transaction } from '../types';

interface TransactionScreenProps {
  userId: string | undefined;
  themeMode: 'light' | 'dark';
  onThemeChange: (mode: 'light' | 'dark') => void;
  onSignOut: () => void;
}

export const TransactionScreen: React.FC<TransactionScreenProps> = ({
  userId,
  themeMode,
  onThemeChange,
  onSignOut,
}) => {
  const theme = Themes[themeMode];
  const { transactions, fetchTransactions, deleteTransaction } = useTransactions(userId);
  const { categories } = useCategories(userId);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch on mount
  useEffect(() => {
    if (userId) {
      fetchTransactions();
    }
  }, [userId]);

  // Filter transactions
  const filteredTransactions = transactions.filter((t) => {
    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
    const matchesSearch = (t.note || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Sort transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    } else {
      return Math.abs(b.amount) - Math.abs(a.amount);
    }
  });

  // Handle delete transaction
  const handleDeleteTransaction = async (item: Transaction) => {
    try {
      setLoading(true);
      await deleteTransaction(item.id);
      Alert.alert('Success', 'Transaction deleted');
    } catch (err) {
      Alert.alert('Error', 'Failed to delete transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[sharedStyles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={themeMode === 'light' ? 'dark-content' : 'light-content'} />

      {/* Header */}
      <View style={[sharedStyles.header, { paddingHorizontal: 20, marginBottom: 16 }]}>
        <Text style={[sharedStyles.title, { color: theme.text }]}>Transaction History</Text>
        <TouchableOpacity onPress={onSignOut}>
          <Ionicons name="log-out" size={24} color={theme.accent} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <TextInput
        style={[
          sharedStyles.searchInput,
          { backgroundColor: theme.card, color: theme.text, borderColor: theme.border, marginHorizontal: 20, marginBottom: 12 },
        ]}
        placeholder="Search notes..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholderTextColor={theme.secondaryText}
      />

      {/* Filter Controls */}
      <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 12, color: theme.secondaryText, fontWeight: '600', marginBottom: 8 }}>CATEGORY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              onPress={() => setSelectedCategory('All')}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: selectedCategory === 'All' ? theme.accent : theme.card,
                marginRight: 8,
              }}
            >
              <Text style={{ color: selectedCategory === 'All' ? '#fff' : theme.text, fontSize: 12, fontWeight: '600' }}>All</Text>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                  backgroundColor: selectedCategory === cat ? theme.accent : theme.card,
                  marginRight: 8,
                }}
              >
                <Text style={{ color: selectedCategory === cat ? '#fff' : theme.text, fontSize: 12, fontWeight: '600' }}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 12, color: theme.secondaryText, fontWeight: '600' }}>
            {sortedTransactions.length} transaction{sortedTransactions.length !== 1 ? 's' : ''}
          </Text>
          <TouchableOpacity onPress={() => setSortBy(sortBy === 'date' ? 'amount' : 'date')}>
            <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '700' }}>Sort by {sortBy === 'date' ? 'Amount' : 'Date'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Transaction List */}
<FlatList
  data={sortedTransactions}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => (
    <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
      {/* We wrap the TransactionItem in a View that helps 
          position the date inside the card area 
      */}
      <View>
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
        <Text style={{ fontSize: 10, color: theme.secondaryText, position: 'absolute',bottom: 12, left: 14, fontWeight: '500'}}>
          {new Date(item.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'numeric', year: 'numeric' })} 
          {/*{new Date(item.created_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })} */}
        </Text>
      </View>
    </View>
  )}
  ListEmptyComponent={
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
      <Ionicons name="document-outline" size={48} color={theme.secondaryText} />
      <Text style={{ color: theme.secondaryText, fontSize: 14, marginTop: 12 }}>No transactions found</Text>
    </View>
  }
  contentContainerStyle={{ paddingBottom: 20 }}
/>
    </SafeAreaView>
  );
};
