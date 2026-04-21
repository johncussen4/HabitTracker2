import { Ionicons } from '@expo/vector-icons';
import { and, eq } from 'drizzle-orm';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../db/client';
import { categories, habitLogs, habits } from '../../db/schema';

type Habit = {
  id: number;
  name: string;
  description: string | null;
  colour: string;
  completedToday: boolean;
};

export default function HabitsScreen() {
  const { user } = useAuth();
  const [habitList, setHabitList] = useState<Habit[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [categoryList, setCategoryList] = useState<{ id: number; name: string; colour: string }[]>([]);
  const [search, setSearch] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const load = async () => {
    if (!user) return;
    const cats = await db.select().from(categories).where(eq(categories.userId, user.id));
    setCategoryList(cats);

    const result = await db
      .select({
        id: habits.id,
        name: habits.name,
        description: habits.description,
        colour: categories.colour,
      })
      .from(habits)
      .leftJoin(categories, eq(habits.categoryId, categories.id))
      .where(eq(habits.userId, user.id));

    const logs = await db.select().from(habitLogs)
      .where(and(eq(habitLogs.userId, user.id), eq(habitLogs.date, today)));

    const completedIds = new Set(logs.filter(l => l.completed).map(l => l.habitId));

    setHabitList(result.map(h => ({
      id: h.id,
      name: h.name,
      description: h.description,
      colour: h.colour ?? '#2d6a4f',
      completedToday: completedIds.has(h.id),
    })));
  };

  useFocusEffect(useCallback(() => { load(); }, [user]));

  const toggleHabit = async (habitId: number, completed: boolean) => {
    if (!user) return;
    const existing = await db.select().from(habitLogs)
      .where(and(eq(habitLogs.habitId, habitId), eq(habitLogs.userId, user.id), eq(habitLogs.date, today)));
    if (existing.length > 0) {
      await db.delete(habitLogs).where(eq(habitLogs.id, existing[0].id));
    }
    await db.insert(habitLogs).values({ habitId, userId: user.id, date: today, completed: completed ? 1 : 0 });
    load();
  };

  const addHabit = async () => {
    if (!newName.trim() || !selectedCategory || !user) {
      Alert.alert('Error', 'Please enter a name and select a category');
      return;
    }
    await db.insert(habits).values({
      userId: user.id,
      categoryId: selectedCategory,
      name: newName.trim(),
      description: newDesc.trim() || null,
      createdAt: today,
    });
    setNewName('');
    setNewDesc('');
    setSelectedCategory(null);
    setShowAdd(false);
    load();
  };

  const deleteHabit = (habitId: number) => {
    Alert.alert('Delete Habit', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await db.delete(habits).where(eq(habits.id, habitId));
        load();
      }},
    ]);
  };

  const filtered = habitList.filter(h => h.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Habits</Text>
        <TouchableOpacity onPress={() => setShowAdd(!showAdd)}>
          <Ionicons name="add-circle" size={32} color="#2d6a4f" />
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Search habits..."
        value={search}
        onChangeText={setSearch}
      />

      {showAdd && (
        <View style={styles.addCard}>
          <Text style={styles.addTitle}>New Habit</Text>
          <TextInput style={styles.input} placeholder="Habit name" value={newName} onChangeText={setNewName} />
          <TextInput style={styles.input} placeholder="Description (optional)" value={newDesc} onChangeText={setNewDesc} />
          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categoryList.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catChip, { backgroundColor: selectedCategory === cat.id ? cat.colour : '#eee' }]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text style={{ color: selectedCategory === cat.id ? '#fff' : '#333' }}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.saveBtn} onPress={addHabit}>
            <Text style={styles.saveBtnText}>Save Habit</Text>
          </TouchableOpacity>
        </View>
      )}

      {filtered.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No habits yet. Tap + to add one!</Text>
        </View>
      )}

      {filtered.map(habit => (
        <View key={habit.id} style={styles.habitCard}>
          <View style={[styles.colourBar, { backgroundColor: habit.colour }]} />
          <View style={styles.habitInfo}>
            <Text style={styles.habitName}>{habit.name}</Text>
            {habit.description ? <Text style={styles.habitDesc}>{habit.description}</Text> : null}
          </View>
          <TouchableOpacity onPress={() => deleteHabit(habit.id)}>
            <Ionicons name="trash-outline" size={20} color="#ccc" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => toggleHabit(habit.id, !habit.completedToday)} style={styles.checkBtn}>
            <Ionicons
              name={habit.completedToday ? 'checkmark-circle' : 'ellipse-outline'}
              size={32}
              color={habit.completedToday ? '#2d6a4f' : '#ccc'}
            />
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
  search: { marginHorizontal: 16, marginBottom: 12, backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e0e0e0' },
  addCard: { margin: 16, backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 2 },
  addTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, padding: 12, marginBottom: 10, fontSize: 15 },
  label: { fontSize: 14, color: '#666', marginBottom: 8 },
  catChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  saveBtn: { backgroundColor: '#2d6a4f', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 12 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#999', fontSize: 16 },
  habitCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 10, borderRadius: 14, overflow: 'hidden', elevation: 2 },
  colourBar: { width: 6, height: '100%' },
  habitInfo: { flex: 1, padding: 14 },
  habitName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  habitDesc: { fontSize: 13, color: '#999', marginTop: 2 },
  checkBtn: { padding: 12 },
});