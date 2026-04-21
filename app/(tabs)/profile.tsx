import { eq } from 'drizzle-orm';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../db/client';
import { habitLogs, habits } from '../../db/schema';

export default function ProfileScreen() {
  const { user, logout, deleteAccount } = useAuth();
  const [habitCount, setHabitCount] = useState(0);
  const [totalLogs, setTotalLogs] = useState(0);
  const [streak, setStreak] = useState(0);

  const load = async () => {
    if (!user) return;
    const h = await db.select().from(habits).where(eq(habits.userId, user.id));
    setHabitCount(h.length);

    const logs = await db.select().from(habitLogs).where(eq(habitLogs.userId, user.id));
    setTotalLogs(logs.filter(l => l.completed === 1).length);

    let streakCount = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLogs = logs.filter(l => l.date === dateStr && l.completed === 1);
      if (dayLogs.length > 0) streakCount++;
      else break;
    }
    setStreak(streakCount);
  };

  useFocusEffect(useCallback(() => { load(); }, [user]));

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', onPress: logout },
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete Account', 'This will permanently delete your account and all data. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: deleteAccount },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.username?.[0]?.toUpperCase()}</Text>
        </View>
        <Text style={styles.username}>{user?.username}</Text>
        <Text style={styles.subtitle}>HabitTrackr Member</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{habitCount}</Text>
          <Text style={styles.statLabel}>Habits</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{totalLogs}</Text>
          <Text style={styles.statLabel}>Completions</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>🔥{streak}</Text>
          <Text style={styles.statLabel}>Streak</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Username</Text>
          <Text style={styles.infoValue}>{user?.username}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Storage</Text>
          <Text style={styles.infoValue}>Local only</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Version</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteText}>Delete Account</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 24, backgroundColor: '#2d6a4f' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#2d6a4f' },
  username: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: '#a8d5b5', marginTop: 4 },
  statsRow: { flexDirection: 'row', margin: 16, gap: 10 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', elevation: 2 },
  statNum: { fontSize: 22, fontWeight: 'bold', color: '#2d6a4f' },
  statLabel: { fontSize: 12, color: '#999', marginTop: 4 },
  section: { backgroundColor: '#fff', margin: 16, marginTop: 0, borderRadius: 16, padding: 16, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  infoLabel: { color: '#666', fontSize: 15 },
  infoValue: { color: '#333', fontSize: 15, fontWeight: '500' },
  logoutBtn: { backgroundColor: '#f0f4f8', borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 10 },
  logoutText: { color: '#2d6a4f', fontWeight: 'bold', fontSize: 15 },
  deleteBtn: { backgroundColor: '#fff0f0', borderRadius: 10, padding: 14, alignItems: 'center' },
  deleteText: { color: '#e63946', fontWeight: 'bold', fontSize: 15 },
});