import { eq } from 'drizzle-orm';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { db } from '../../db/client';
import { categories, habitLogs, habits } from '../../db/schema';

type HabitStreak = {
  id: number;
  name: string;
  colour: string;
  currentStreak: number;
  bestStreak: number;
  totalCompleted: number;
};

export default function StreaksScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [streaks, setStreaks] = useState<HabitStreak[]>([]);

  const load = async () => {
    if (!user) return;

    const habitList = await db
      .select({ id: habits.id, name: habits.name, colour: categories.colour })
      .from(habits)
      .leftJoin(categories, eq(habits.categoryId, categories.id))
      .where(eq(habits.userId, user.id));

    const logs = await db.select().from(habitLogs).where(eq(habitLogs.userId, user.id));

    const streakData: HabitStreak[] = habitList.map(h => {
      const completedDates = logs
        .filter(l => l.habitId === h.id && l.completed === 1)
        .map(l => l.date)
        .sort()
        .reverse();

      const totalCompleted = completedDates.length;

      // Current streak
      let currentStreak = 0;
      const today = new Date();
      for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        if (completedDates.includes(dateStr)) {
          currentStreak++;
        } else {
          break;
        }
      }

      // Best streak
      let bestStreak = 0;
      let tempStreak = 0;
      const ascending = [...completedDates].reverse();
      for (let i = 0; i < ascending.length; i++) {
        if (i === 0) {
          tempStreak = 1;
        } else {
          const prev = new Date(ascending[i - 1]);
          const curr = new Date(ascending[i]);
          const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
          if (diff === 1) {
            tempStreak++;
          } else {
            tempStreak = 1;
          }
        }
        if (tempStreak > bestStreak) bestStreak = tempStreak;
      }

      return {
        id: h.id,
        name: h.name,
        colour: h.colour ?? '#2d6a4f',
        currentStreak,
        bestStreak,
        totalCompleted,
      };
    });

    setStreaks(streakData.sort((a, b) => b.currentStreak - a.currentStreak));
  };

  useFocusEffect(useCallback(() => { load(); }, [user]));

  const getFlame = (streak: number) => {
    if (streak >= 14) return '🔥🔥🔥';
    if (streak >= 7) return '🔥🔥';
    if (streak >= 1) return '🔥';
    return '💤';
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.primary }]}>Streaks</Text>
      <Text style={[styles.subtitle, { color: colors.subtext }]}>Keep your habits alive every day!</Text>

      {streaks.length === 0 && (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.subtext }]}>No habits yet. Add some to track streaks!</Text>
        </View>
      )}

      {streaks.map(s => (
        <View key={s.id} style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={[styles.colourBar, { backgroundColor: s.colour }]} />
          <View style={styles.cardContent}>
            <View style={styles.cardTop}>
              <Text style={[styles.habitName, { color: colors.text }]}>{s.name}</Text>
              <Text style={styles.flame}>{getFlame(s.currentStreak)}</Text>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={[styles.statNum, { color: colors.primary }]}>{s.currentStreak}</Text>
                <Text style={[styles.statLabel, { color: colors.subtext }]}>Current</Text>
              </View>
              <View style={styles.stat}>
                <Text style={[styles.statNum, { color: colors.primary }]}>{s.bestStreak}</Text>
                <Text style={[styles.statLabel, { color: colors.subtext }]}>Best</Text>
              </View>
              <View style={styles.stat}>
                <Text style={[styles.statNum, { color: colors.primary }]}>{s.totalCompleted}</Text>
                <Text style={[styles.statLabel, { color: colors.subtext }]}>Total</Text>
              </View>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 28, fontWeight: 'bold', padding: 20, paddingTop: 60, paddingBottom: 4 },
  subtitle: { fontSize: 14, paddingHorizontal: 20, marginBottom: 16 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16 },
  card: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, borderRadius: 14, overflow: 'hidden', elevation: 2 },
  colourBar: { width: 6 },
  cardContent: { flex: 1, padding: 16 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  habitName: { fontSize: 17, fontWeight: 'bold' },
  flame: { fontSize: 24 },
  statsRow: { flexDirection: 'row', gap: 20 },
  stat: { alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: 'bold' },
  statLabel: { fontSize: 12, marginTop: 2 },
});