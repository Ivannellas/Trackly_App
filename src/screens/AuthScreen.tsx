// Authentication screen for login and signup
import React, { useState } from 'react';
import { StyleSheet, View, TextInput, Text, TouchableOpacity, Alert } from 'react-native';
import { AuthService } from '../services';

export const AuthScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Function to handle Sign In
  async function signInWithEmail() {
    setLoading(true);
    try {
      const { error } = await AuthService.signInWithEmail(email.trim(), password.trim());
      if (error) Alert.alert('Sign In Error', error.message);
    } catch (err) {
      Alert.alert('Sign In Error', 'An error occurred during sign in');
    } finally {
      setLoading(false);
    }
  }

  // Function to handle Sign Up
  async function signUpWithEmail() {
    setLoading(true);
    try {
      const { error } = await AuthService.signUpWithEmail(email.trim(), password.trim());
      if (error) {
        Alert.alert('Sign Up Error', error.message);
      } else {
        Alert.alert('Success', 'Check your email for the confirmation link!');
      }
    } catch (err) {
      Alert.alert('Sign Up Error', 'An error occurred during sign up');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      <TextInput
        style={styles.input}
        placeholder="email@address.com"
        value={email}
        onChangeText={setEmail}
        autoCapitalize={'none'}
        editable={!loading}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={true}
        autoCapitalize={'none'}
        editable={!loading}
      />
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.button, { backgroundColor: '#4F46E5' }]} onPress={signInWithEmail} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'SIGNING IN...' : 'SIGN IN'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#10B981', marginTop: 10 }]}
          onPress={signUpWithEmail}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'REGISTERING...' : 'REGISTER'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: '#f4f4f4', padding: 15, borderRadius: 8, marginBottom: 15 },
  buttonContainer: { marginTop: 10 },
  button: { padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});
