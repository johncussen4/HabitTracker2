import { eq } from 'drizzle-orm';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
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
  const { colors } = useTheme();
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
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.primary }]}>Insights</Text>

      <View style={styles.periodRow}>
        <TouchableOpacity
          style={[styles.periodBtn, { backgroundColor: colors.card, borderColor: colors.border }, period === 'week' && { backgroundColor: colors.primary }]}
          onPress={() => setPeriod('week')}
        >
          <Text style={{ color: period === 'week' ? '#fff' : colors.text, fontWeight: 'bold' }}>This Week</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodBtn, { backgroundColor: colors.card, borderColor: colors.border }, period === 'month' && { backgroundColor: colors.primary }]}
          onPress={() => setPeriod('month')}
        >
          <Text style={{ color: period === 'month' ? '#fff' : colors.text, fontWeight: 'bold' }}>This Month</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statRow}>
        <View style={[styles.statCard, { backgroundColor: colors.statCard }]}>
          <Text style={[styles.statNum, { color: colors.statText }]}>{totalCompleted}</Text>
          <Text style={[styles.statLabel, { color: colors.statSubtext }]}>Completions</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.statCard }]}>
          <Text style={[styles.statNum, { color: colors.statText }]}>🔥 {streak}</Text>
          <Text style={[styles.statLabel, { color: colors.statSubtext }]}>Day Streak</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.statCard }]}>
          <Text style={[styles.statNum, { color: colors.statText }]}>{stats.length}</Text>
          <Text style={[styles.statLabel, { color: colors.statSubtext }]}>Habits</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Completion Rate</Text>

      {stats.length === 0 && (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.subtext }]}>No data yet. Start logging habits!</Text>
        </View>
      )}

      {stats.map((s, i) => {
        const rate = s.total > 0 ? s.completed / s.total : 0;
        return (
          <View key={i} style={[styles.barCard, { backgroundColor: colors.card }]}>
            <View style={styles.barHeader}>
              <Text style={[styles.barName, { color: colors.text }]}>{s.name}</Text>
              <Text style={[styles.barPct, { color: colors.primary }]}>{Math.round(rate * 100)}%</Text>
            </View>
            <View style={[styles.barBg, { backgroundColor: colors.border }]}>
              <View style={[styles.barFill, { width: `${rate * 100}%` as any, backgroundColor: s.colour }]} />
            </View>
            <Text style={[styles.barSub, { color: colors.subtext }]}>{s.completed} / {s.total} days</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 28, fontWeight: 'bold', padding: 20, paddingTop: 60 },
  periodRow: { flexDirection: 'row', marginHorizontal: 16, gap: 10, marginBottom: 16 },
  periodBtn: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  statRow: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginBottom: 20 },
  statCard: { flex: 1, borderRadius: 12, padding: 16, alignItems: 'center' },
  statNum: { fontSize: 24, fontWeight: 'bold' },
  statLabel: { fontSize: 11, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginHorizontal: 16, marginBottom: 8 },
  empty: { alignItems: 'center', marginTop: 40 },
  emptyText: { fontSize: 16 },
  barCard: { marginHorizontal: 16, marginBottom: 10, borderRadius: 12, padding: 16, elevation: 2 },
  barHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  barName: { fontSize: 14, fontWeight: 'bold' },
  barPct: { fontSize: 14, fontWeight: 'bold' },
  barBg: { height: 12, borderRadius: 6, overflow: 'hidden' },
  barFill: { height: 12, borderRadius: 6 },
  barSub: { fontSize: 12, marginTop: 6 },
});