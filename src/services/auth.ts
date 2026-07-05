// Authentication service using Supabase
import { supabase } from './supabase';
import { Session } from '../types';

export const AuthService = {
  // Sign in with email and password
  async signInWithEmail(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });
    return { error };
  },

  // Sign up with email and password
  async signUpWithEmail(email: string, password: string) {
    const { error, data } = await supabase.auth.signUp({
      email: email.trim(),
      password: password.trim(),
    });
    return { error, data };
  },

  // Get current session
  async getSession() {
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  // Listen to auth state changes
  onAuthStateChange(callback: (session: Session | null) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session as Session | null);
    });
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },
};
