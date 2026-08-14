import React, { createContext, useContext, useState, useRef } from 'react';
import { Animated, StyleSheet, Text, View, Dimensions, Platform, StatusBar } from 'react-native';
import { CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react-native';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('success');
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = ({ message, type = 'success', duration = 3000 }: ToastOptions) => {
    // Clear any active timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setMessage(message);
    setType(type);
    setVisible(true);

    const safeTop = Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight || 0) + 12;

    // Slide down from top
    Animated.spring(slideAnim, {
      toValue: safeTop,
      useNativeDriver: true,
      tension: 45,
      friction: 8,
    }).start();

    // Auto-hide timeline
    timeoutRef.current = setTimeout(() => {
      Animated.timing(slideAnim, {
        toValue: -120,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setVisible(false);
      });
    }, duration);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {visible && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={[styles.toastCard, styles[type]]}>
            <View style={styles.iconContainer}>
              {type === 'success' && <CheckCircle2 size={15} color="#10B981" />}
              {type === 'error' && <XCircle size={15} color="#F43F5E" />}
              {type === 'warning' && <AlertTriangle size={15} color="#F59E0B" />}
              {type === 'info' && <Info size={15} color="#3B82F6" />}
            </View>
            <Text style={styles.toastText} numberOfLines={2}>
              {message}
            </Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 99999,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D0E12',
    borderWidth: 1.2,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '92%',
    minWidth: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    gap: 10,
  },
  iconContainer: {
    width: 22,
    height: 22,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
    flex: 1,
  },
  success: {
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  error: {
    borderColor: 'rgba(244, 63, 94, 0.35)',
  },
  warning: {
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  info: {
    borderColor: 'rgba(59, 130, 246, 0.35)',
  },
});
