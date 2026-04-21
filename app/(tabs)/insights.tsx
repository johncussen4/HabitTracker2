import { eq } from 'drizzle-orm';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../db/client';
import { categories, habitLogs, habits } from '../../db/schema';

type HabitStat = {
  name: string;
  colour: string;
  completed: number;
  total: number;
};

export default function InsightsScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<HabitStat[]>([]);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [streak, setStreak] = useState(0);
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  const load = async () => {
    if (!user) return;

    const days = period === 'week' ? 7 : 30;
    const dates: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }

    const habitList = await db
      .select({ id: habits.id, name: habits.name, colour: categories.colour })
      .from(habits)
      .leftJoin(categories, eq(habits.categoryId, categories.id))
      .where(eq(habits.userId, user.id));

    const logs = await db.select().from(habitLogs).where(eq(habitLogs.userId, user.id));

    const statsData: HabitStat[] = habitList.map(h => {
      const completed = logs.filter(l =>
        l.habitId === h.id && l.completed === 1 && dates.includes(l.date)
      ).length;
      return { name: h.name, colour: h.colour ?? '#2d6a4f', completed, total: days };
    });

    setStats(statsData);
    setTotalCompleted(statsData.reduce((sum, s) => sum + s.completed, 0));

    // Calculate streak
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

  useFocusEffect(useCallback(() => { load(); }, [user, period]));

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Insights</Text>

      <View style={styles.periodRow}>
        <TouchableOpacity
          style={[styles.periodBtn, period === 'week' && styles.periodBtnActive]}
          onPress={() => setPeriod('week')}
        >
          <Text style={{ color: period === 'week' ? '#fff' : '#333', fontWeight: 'bold' }}>This Week</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodBtn, period === 'month' && styles.periodBtnActive]}
          onPress={() => setPeriod('month')}
        >
          <Text style={{ color: period === 'month' ? '#fff' : '#333', fontWeight: 'bold' }}>This Month</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{totalCompleted}</Text>
          <Text style={styles.statLabel}>Completions</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>🔥 {streak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{stats.length}</Text>
          <Text style={styles.statLabel}>Habits</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Completion Rate</Text>

      {stats.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No data yet. Start logging habits!</Text>
        </View>
      )}

      {stats.map((s, i) => {
        const rate = s.total > 0 ? s.completed / s.total : 0;
        return (
          <View key={i} style={styles.barCard}>
            <View style={styles.barHeader}>
              <Text style={styles.barName}>{s.name}</Text>
              <Text style={styles.barPct}>{Math.round(rate * 100)}%</Text>
            </View>
            <View style={styles.barBg}>
              <View style={[styles.barFill, { width: `${rate * 100}%` as any, backgroundColor: s.colour }]} />
            </View>
            <Text style={styles.barSub}>{s.completed} / {s.total} days</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#2d6a4f', padding: 20, paddingTop: 60 },
  periodRow: { flexDirection: 'row', marginHorizontal: 16, gap: 10, marginBottom: 16 },
  periodBtn: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e0e0e0', alignItems: 'center', backgroundColor: '#fff' },
  periodBtnActive: { backgroundColor: '#2d6a4f', borderColor: '#2d6a4f' },
  statRow: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: '#2d6a4f', borderRadius: 12, padding: 16, alignItems: 'center' },
  statNum: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  statLabel: { fontSize: 11, color: '#a8d5b5', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginHorizontal: 16, marginBottom: 8 },
  empty: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#999', fontSize: 16 },
  barCard: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 10, borderRadius: 12, padding: 16, elevation: 2 },
  barHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  barName: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  barPct: { fontSize: 14, fontWeight: 'bold', color: '#2d6a4f' },
  barBg: { height: 12, backgroundColor: '#f0f0f0', borderRadius: 6, overflow: 'hidden' },
  barFill: { height: 12, borderRadius: 6 },
  barSub: { fontSize: 12, color: '#999', marginTop: 6 },
});