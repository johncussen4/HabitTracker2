import { eq } from 'drizzle-orm';
import * as FileSystem from 'expo-file-system/legacy';
import { useFocusEffect } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { db } from '../../db/client';
import { habitLogs, habits } from '../../db/schema';

export default function ProfileScreen() {
  const { user, logout, deleteAccount } = useAuth();
  const { theme, toggleTheme, colors } = useTheme();
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

  const exportCSV = async () => {
  if (!user) return;
  try {
    const logs = await db.select().from(habitLogs).where(eq(habitLogs.userId, user.id));
    const h = await db.select().from(habits).where(eq(habits.userId, user.id));
    const habitMap: Record<number, string> = {};
    h.forEach(habit => { habitMap[habit.id] = habit.name; });

    const rows = [
      'Habit,Date,Completed',
      ...logs.map(l => `${habitMap[l.habitId] ?? 'Unknown'},${l.date},${l.completed === 1 ? 'Yes' : 'No'}`)
    ];

    const csv = rows.join('\n');
    const path = FileSystem.documentDirectory + 'habittrackr_export.csv';
    await FileSystem.writeAsStringAsync(path, csv);
    await Sharing.shareAsync(path);
  } catch (e) {
    Alert.alert('Error', 'Could not export data');
  }
};

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.header }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.username?.[0]?.toUpperCase()}</Text>
        </View>
        <Text style={[styles.username, { color: colors.headerText }]}>{user?.username}</Text>
        <Text style={[styles.subtitle, { color: colors.primaryLight }]}>HabitTrackr Member</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.statNum, { color: colors.primary }]}>{habitCount}</Text>
          <Text style={[styles.statLabel, { color: colors.subtext }]}>Habits</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.statNum, { color: colors.primary }]}>{totalLogs}</Text>
          <Text style={[styles.statLabel, { color: colors.subtext }]}>Completions</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.statNum, { color: colors.primary }]}>🔥{streak}</Text>
          <Text style={[styles.statLabel, { color: colors.subtext }]}>Streak</Text>
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferences</Text>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.subtext }]}>Dark Mode</Text>
          <Switch
            value={theme === 'dark'}
            onValueChange={toggleTheme}
            trackColor={{ false: '#e0e0e0', true: '#2d6a4f' }}
            thumbColor={theme === 'dark' ? '#fff' : '#fff'}
          />
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
        <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.infoLabel, { color: colors.subtext }]}>Username</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>{user?.username}</Text>
        </View>
        <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.infoLabel, { color: colors.subtext }]}>Storage</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>Local only</Text>
        </View>
        <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.infoLabel, { color: colors.subtext }]}>Version</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>1.0.0</Text>
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Actions</Text>
        <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: colors.background }]} onPress={handleLogout}>
          <Text style={[styles.logoutText, { color: colors.primary }]}>Log Out</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.exportBtn, { backgroundColor: colors.background }]} onPress={exportCSV}>
            <Text style={[styles.exportText, { color: colors.primary }]}>Export Data (CSV)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteText}>Delete Account</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#2d6a4f' },
  username: { fontSize: 22, fontWeight: 'bold' },
  subtitle: { fontSize: 14, marginTop: 4 },
  statsRow: { flexDirection: 'row', margin: 16, gap: 10 },
  statCard: { flex: 1, borderRadius: 12, padding: 16, alignItems: 'center', elevation: 2 },
  statNum: { fontSize: 22, fontWeight: 'bold' },
  statLabel: { fontSize: 12, marginTop: 4 },
  section: { margin: 16, marginTop: 0, borderRadius: 16, padding: 16, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  infoLabel: { fontSize: 15 },
  infoValue: { fontSize: 15, fontWeight: '500' },
  logoutBtn: { borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 10 },
  logoutText: { fontWeight: 'bold', fontSize: 15 },
  deleteBtn: { backgroundColor: '#fff0f0', borderRadius: 10, padding: 14, alignItems: 'center' },
  deleteText: { color: '#e63946', fontWeight: 'bold', fontSize: 15 },
  exportBtn: { borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 10 },
  exportText: { fontWeight: 'bold', fontSize: 15 },
});