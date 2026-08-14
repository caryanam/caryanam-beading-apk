import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DeviceEventEmitter } from 'react-native';
import { Zap } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

interface SessionExpiredModalProps {
  onLoginAgain: () => void;
}

const ROLE_COPY: Record<string, { title: string; message: string }> = {
  admin: {
    title: 'Admin Session Expired',
    message:
      'Your administrator session has expired. Please log in again to continue managing the bidding network.',
  },
  dealer: {
    title: 'Dealer Session Expired',
    message:
      'Your bidding console session has expired. Please log in again to place bids and browse the marketplace.',
  },
  inspector: {
    title: 'Inspector Session Expired',
    message:
      'Your vehicle evaluation session has expired. Please log in again to save drafts and submit reports.',
  },
};

export const SessionExpiredModal: React.FC<SessionExpiredModalProps> = ({ onLoginAgain }) => {
  const { colors } = useTheme();
  const [expiredRole, setExpiredRole] = useState<string | null>(null);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('session-expired', (payload: any) => {
      if (payload?.role) {
        setExpiredRole(payload.role);
      }
    });
    return () => {
      sub.remove();
    };
  }, []);

  const copy = expiredRole ? ROLE_COPY[expiredRole] || ROLE_COPY.dealer : null;

  const handleLoginAgain = () => {
    setExpiredRole(null);
    onLoginAgain();
  };

  return (
    <Modal visible={!!expiredRole} transparent animationType="fade" onRequestClose={() => {}}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.iconBox}>
            <Zap size={28} color="#F43F5E" fill="#F43F5E" />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>{copy?.title}</Text>
          <Text style={[styles.message, { color: colors.mutedForeground }]}>{copy?.message}</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={handleLoginAgain} activeOpacity={0.85}>
            <Text style={styles.loginBtnText}>Log in again</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 50,
    elevation: 20,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 20,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  message: {
    marginTop: 12,
    fontSize: 13.5,
    fontWeight: '600',
    lineHeight: 20,
    textAlign: 'center',
  },
  loginBtn: {
    marginTop: 24,
    width: '100%',
    borderRadius: 16,
    backgroundColor: '#FFC700',
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#FFC700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  loginBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0D0E12',
  },
});
