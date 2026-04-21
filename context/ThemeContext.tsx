import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
  colors: typeof lightColors;
};

const lightColors = {
  background: '#f0f4f8',
  card: '#ffffff',
  text: '#333333',
  subtext: '#999999',
  primary: '#2d6a4f',
  primaryLight: '#a8d5b5',
  border: '#e0e0e0',
  header: '#2d6a4f',
  headerText: '#ffffff',
  statCard: '#2d6a4f',
  statText: '#ffffff',
  statSubtext: '#a8d5b5',
};

const darkColors = {
  background: '#121212',
  card: '#1e1e1e',
  text: '#f0f0f0',
  subtext: '#aaaaaa',
  primary: '#4caf7d',
  primaryLight: '#2d6a4f',
  border: '#333333',
  header: '#1e1e1e',
  headerText: '#f0f0f0',
  statCard: '#1e1e1e',
  statText: '#f0f0f0',
  statSubtext: '#aaaaaa',
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    AsyncStorage.getItem('theme').then(saved => {
      if (saved === 'dark' || saved === 'light') setTheme(saved);
    });
  }, []);

  const toggleTheme = async () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    await AsyncStorage.setItem('theme', next);
  };

  const colors = theme === 'light' ? lightColors : darkColors;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};