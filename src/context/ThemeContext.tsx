import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'dark' | 'light';

export interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  secondary: string;
  mutedForeground: string;
  border: string;
  primary: string;
  primaryForeground: string;
  accent: string;
  headerBg: string;
  headerBorder: string;
}

export const lightColors: ThemeColors = {
  background: '#F4F5F8',
  foreground: '#0D0E12',
  card: '#FFFFFF',
  cardForeground: '#0D0E12',
  secondary: '#EBECEF',
  mutedForeground: '#5A5D6B',
  border: '#E2E4E9',
  primary: '#FFC700',
  primaryForeground: '#0D0E12',
  accent: '#FFD633',
  headerBg: '#FFFFFF',
  headerBorder: '#E2E4E9',
};

export const darkColors: ThemeColors = {
  background: '#090A0D',
  foreground: '#F8FAFC',
  card: '#12141C',
  cardForeground: '#F8FAFC',
  secondary: '#1A1D28',
  mutedForeground: '#94A3B8',
  border: '#222634',
  primary: '#FFC700',
  primaryForeground: '#0D0E12',
  accent: '#FFD633',
  headerBg: '#0D0E12',
  headerBorder: '#222634',
};

interface ThemeContextType {
  theme: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  colors: darkColors,
  toggleTheme: () => {},
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    AsyncStorage.getItem('app_theme').then((savedTheme) => {
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setThemeState(savedTheme);
      } else if (systemScheme) {
        setThemeState(systemScheme === 'dark' ? 'dark' : 'light');
      }
    });
  }, [systemScheme]);

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    AsyncStorage.setItem('app_theme', mode);
  };

  const toggleTheme = () => {
    const nextMode = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextMode);
  };

  const colors = theme === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
