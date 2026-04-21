import AsyncStorage from '@react-native-async-storage/async-storage';
import { eq } from 'drizzle-orm';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../db/client';
import { categories, users } from '../db/schema';
import { seedIfEmpty } from '../db/seed';

type User = {
  id: number;
  username: string;
};

type AuthContextType = {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  deleteAccount: () => Promise<void>;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await seedIfEmpty();
      const stored = await AsyncStorage.getItem('userId');
      const storedName = await AsyncStorage.getItem('username');
      if (stored && storedName) {
        setUser({ id: parseInt(stored), username: storedName });
      }
      setIsLoading(false);
    };
    init();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const result = await db.select().from(users).where(eq(users.username, username));
      if (result.length > 0 && result[0].password === password) {
        const u = { id: result[0].id, username: result[0].username };
        setUser(u);
        await AsyncStorage.setItem('userId', String(u.id));
        await AsyncStorage.setItem('username', u.username);
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const register = async (username: string, password: string): Promise<boolean> => {
    try {
      const existing = await db.select().from(users).where(eq(users.username, username));
      if (existing.length > 0) return false;
      await db.insert(users).values({ username, password, createdAt: new Date().toISOString().split('T')[0] });
      const newUser = await db.select().from(users).where(eq(users.username, username));
      const u = { id: newUser[0].id, username: newUser[0].username };
      setUser(u);
      await AsyncStorage.setItem('userId', String(u.id));
      await AsyncStorage.setItem('username', u.username);
      await db.insert(categories).values([
        { userId: u.id, name: 'Health', colour: '#2d6a4f' },
        { userId: u.id, name: 'Fitness', colour: '#e76f51' },
        { userId: u.id, name: 'Learning', colour: '#457b9d' },
        { userId: u.id, name: 'Mindfulness', colour: '#a8dadc' },
        { userId: u.id, name: 'Productivity', colour: '#f4a261' },
      ]);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('userId');
    await AsyncStorage.removeItem('username');
    setUser(null);
  };

  const deleteAccount = async () => {
    if (user) {
      await db.delete(users).where(eq(users.id, user.id));
      await logout();
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, deleteAccount, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};