import { Ionicons } from '@expo/vector-icons';
import { eq } from 'drizzle-orm';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../db/client';
import { habits, targets } from '../../db/schema';

type Target = {
  id: number;
  habitName: string;
  period: string;
  goal: number;
};

export default function TargetsScreen() {
  const { user } = useAuth();
  const [targetList, setTargetList] = useState<Target[]>([]);
  const [habitList, setHabitList] = useState<{ id: number; name: string }[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<number | null>(null);
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [goal, setGoal] = useState('');

  const load = async () => {
    if (!user) return;
    const h = await db.select().from(habits).where(eq(habits.userId, user.id));
    setHabitList(h);

    const result = await db
      .select({
        id: targets.id,
        habitName: habits.name,
        period: targets.period,
        goal: targets.goal,
      })
      .from(targets)
      .leftJoin(habits, eq(targets.habitId, habits.id))
      .where(eq(targets.userId, user.id));

    setTargetList(result.map(t => ({
      id: t.id,
      habitName: t.habitName ?? '',
      period: t.period,
      goal: t.goal,
    })));
  };

  useFocusEffect(useCallback(() => { load(); }, [user]));

  const addTarget = async () => {
    if (!selectedHabit || !goal || !user) {
      Alert.alert('Error', 'Please select a habit and enter a goal');
      return;
    }
    await db.insert(targets).values({
      userId: user.id,
      habitId: selectedHabit,
      period,
      goal: parseInt(goal),
    });
    setSelectedHabit(null);
    setGoal('');
    setShowAdd(false);
    load();
  };

  const deleteTarget = (id: number) => {
    Alert.alert('Delete Target', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await db.delete(targets).where(eq(targets.id, id));
        load();
      }},
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Targets</Text>
        <TouchableOpacity onPress={() => setShowAdd(!showAdd)}>
          <Ionicons name="add-circle" size={32} color="#2d6a4f" />
        </TouchableOpacity>
      </View>

      {showAdd && (
        <View style={styles.addCard}>
          <Text style={styles.addTitle}>New Target</Text>
          <Text style={styles.label}>Select Habit</Text>
          {habitList.map(h => (
            <TouchableOpacity
              key={h.id}
              style={[styles.optionBtn, selectedHabit === h.id && styles.optionBtnActive]}
              onPress={() => setSelectedHabit(h.id)}
            >
              <Text style={{ color: selectedHabit === h.id ? '#fff' : '#333' }}>{h.name}</Text>
            </TouchableOpacity>
          ))}
          <Text style={styles.label}>Period</Text>
          <View style={styles.periodRow}>
            <TouchableOpacity
              style={[styles.periodBtn, period === 'weekly' && styles.periodBtnActive]}
              onPress={() => setPeriod('weekly')}
            >
              <Text style={{ color: period === 'weekly' ? '#fff' : '#333' }}>Weekly</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.periodBtn, period === 'monthly' && styles.periodBtnActive]}
              onPress={() => setPeriod('monthly')}
            >
              <Text style={{ color: period === 'monthly' ? '#fff' : '#333' }}>Monthly</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.label}>Goal (days)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 5"
            value={goal}
            onChangeText={setGoal}
            keyboardType="numeric"
          />
          <TouchableOpacity style={styles.saveBtn} onPress={addTarget}>
            <Text style={styles.saveBtnText}>Save Target</Text>
          </TouchableOpacity>
        </View>
      )}

      {targetList.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No targets yet. Tap + to add one!</Text>
        </View>
      )}

      {targetList.map(t => (
        <View key={t.id} style={styles.card}>
          <View style={styles.cardLeft}>
            <Text style={styles.cardHabit}>{t.habitName}</Text>
            <Text style={styles.cardPeriod}>{t.period === 'weekly' ? '📅 Weekly' : '📆 Monthly'} target</Text>
            <Text style={styles.cardGoal}>Goal: {t.goal} days</Text>
          </View>
          <TouchableOpacity onPress={() => deleteTarget(t.id)}>
            <Ionicons name="trash-outline" size={22} color="#ccc" />
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#2d6a4f' },
  addCard: { margin: 16, backgroundColor: '#fff', borderRadius: 16, padding: 16 },
  addTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  label: { fontSize: 14, color: '#666', marginBottom: 8, marginTop: 8 },
  optionBtn: { padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e0e0e0', marginBottom: 6 },
  optionBtnActive: { backgroundColor: '#2d6a4f', borderColor: '#2d6a4f' },
  periodRow: { flexDirection: 'row', gap: 10 },
  periodBtn: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e0e0e0', alignItems: 'center' },
  periodBtnActive: { backgroundColor: '#2d6a4f', borderColor: '#2d6a4f' },
  input: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, padding: 12, fontSize: 15 },
  saveBtn: { backgroundColor: '#2d6a4f', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 12 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#999', fontSize: 16 },
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', margin: 16, marginBottom: 0, borderRadius: 14, padding: 16, elevation: 2 },
  cardLeft: { flex: 1 },
  cardHabit: { fontSize: 17, fontWeight: 'bold', color: '#333' },
  cardPeriod: { fontSize: 13, color: '#888', marginTop: 4 },
  cardGoal: { fontSize: 14, color: '#2d6a4f', fontWeight: 'bold', marginTop: 4 },
});