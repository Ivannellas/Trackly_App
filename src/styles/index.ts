import { StyleSheet, Dimensions } from 'react-native';
import { Theme, ThemeMode } from '../types';

// Screen dimensions
export const screenWidth = Dimensions.get('window').width;
export const screenHeight = Dimensions.get('window').height;

// Theme definitions
export const Themes: Record<ThemeMode, Theme> = {
  light: {
    background: '#FFFFFF',
    text: '#1F2937',
    card: '#F3F4F6',
    accent: '#4F46E5',
    input: '#F9FAFB',
    border: '#E5E7EB',
    secondaryText: '#6B7280',
    chip: '#E0E7FF',
    chipBorder: '#4F46E5',
  },
  dark: {
    background: '#111827',
    text: '#F9FAFB',
    card: '#1F2937',
    accent: '#818CF8',
    input: '#374151',
    border: '#4B5563',
    secondaryText: '#9CA3AF',
    chip: '#312E81',
    chipBorder: '#818CF8',
  },
};

// Shared styles that can be used across components
export const sharedStyles = StyleSheet.create({
  // Container styles
  container: { flex: 1, paddingHorizontal: 20 },
  safeContainer: { flex: 1, paddingHorizontal: 20 },

  // Header styles
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold' },
  signOutLink: { color: '#EF4444', fontWeight: 'bold', fontSize: 12 },

  // Input styles
  input: { padding: 12, borderRadius: 8, marginBottom: 10, borderWidth: 1 },
  searchInput: { padding: 10, borderRadius: 10, borderWidth: 1, marginBottom: 15 },
  pickerContainer: { borderRadius: 8, marginBottom: 10, borderWidth: 1, overflow: 'hidden' },
  dateButton: { borderRadius: 8, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 15, borderWidth: 1 },

  // Card styles
  balanceCard: { padding: 20, borderRadius: 15, alignItems: 'center', marginBottom: 15 },
  balanceLabel: { color: '#fff', fontSize: 10 },
  balanceAmount: { color: '#fff', fontSize: 28, fontWeight: 'bold' },

  // Stats
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, gap: 10 },
  statCard: { flex: 1, padding: 12, borderRadius: 12, borderLeftWidth: 5 },
  statLabel: { fontSize: 9, fontWeight: 'bold' },
  statAmount: { fontSize: 16, fontWeight: 'bold' },

  // Budget/Progress
  budgetBox: { padding: 12, borderRadius: 12, marginBottom: 15 },
  progressBarBg: { height: 7, backgroundColor: '#E5E7EB', borderRadius: 4, marginTop: 8, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },

  // Month selector
  monthSelector: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderRadius: 10, marginBottom: 15 },
  monthText: { fontWeight: 'bold' },

  // Chart styles
  chartCard: { borderRadius: 15, padding: 15, marginBottom: 20, alignItems: 'center' },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center' },
  chartToggle: { flexDirection: 'row', backgroundColor: '#E5E7EB', borderRadius: 8, padding: 2 },
  toggleBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  toggleText: { fontSize: 10, fontWeight: 'bold' },
  sectionTitle: { fontSize: 12, fontWeight: 'bold' },

  // Form styles
  form: { marginBottom: 20 },
  subLabel: { fontSize: 9, fontWeight: 'bold', marginBottom: 5, color: '#6B7280', textTransform: 'uppercase' },
  quickAddRow: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20 },

  // Button styles
  button: { padding: 16, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },

  // List styles
  listTitle: { fontSize: 18, fontWeight: 'bold', marginVertical: 10 },
  transactionItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderRadius: 12, marginBottom: 10 },
  transactionNote: { fontSize: 15, fontWeight: '600' },
  transactionAmount: { fontSize: 15, fontWeight: 'bold' },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { padding: 25, borderRadius: 20, width: '85%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  modalInput: { borderBottomWidth: 1, padding: 10, marginBottom: 20 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 30 },
});

// Chart colors
export const chartColors = ['#818CF8', '#F87171', '#34D399', '#FBBF24', '#A78BFA', '#F472B6'];

// Export screen width for individual components
export default { Themes, sharedStyles, screenWidth, screenHeight, chartColors };
