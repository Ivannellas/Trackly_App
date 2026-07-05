// Reusable modal components

import React from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity } from 'react-native';
import { sharedStyles } from '../styles';
import { Theme } from '../types';

interface GenericModalProps {
  visible: boolean;
  title: string;
  theme: Theme;
  onCancel: () => void;
  onConfirm: () => void;
  children: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
}

export const GenericModal: React.FC<GenericModalProps> = ({
  visible,
  title,
  theme,
  onCancel,
  onConfirm,
  children,
  confirmText = 'Save',
  cancelText = 'Cancel',
}) => {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={sharedStyles.modalOverlay}>
        <View style={[sharedStyles.modalContent, { backgroundColor: theme.card }]}>
          <Text style={[sharedStyles.modalTitle, { color: theme.text }]}>{title}</Text>
          {children}
          <View style={sharedStyles.modalButtons}>
            <TouchableOpacity onPress={onCancel}>
              <Text style={{ color: theme.secondaryText }}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onConfirm}>
              <Text style={{ color: theme.accent, fontWeight: 'bold' }}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

interface ModalTextInputProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  secureTextEntry?: boolean;
  theme: Theme;
  autoFocus?: boolean;
  placeholderTextColor?: string;
}

export const ModalTextInput: React.FC<ModalTextInputProps> = ({
  placeholder,
  value,
  onChangeText,
  keyboardType = 'default',
  secureTextEntry = false,
  theme,
  autoFocus = false,
  placeholderTextColor,
}) => {
  return (
    <TextInput
      style={[sharedStyles.modalInput, { color: theme.text, borderColor: theme.border }]}
      placeholder={placeholder}
      placeholderTextColor={placeholderTextColor || theme.secondaryText}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      secureTextEntry={secureTextEntry}
      autoFocus={autoFocus}
    />
  );
};
