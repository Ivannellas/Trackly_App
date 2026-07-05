import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ujxtwtncdsxwvbjetfqp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqeHR3dG5jZHN4d3ZiamV0ZnFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MjQ1NzUsImV4cCI6MjA5MTIwMDU3NX0.L2_maCvo07Jdme6rrtm8iJH8m8OI1g6rIRixym5ogKM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
