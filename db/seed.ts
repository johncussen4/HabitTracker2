import { db } from './client';
import { categories, habitLogs, habits, targets, users } from './schema';

export async function seedIfEmpty() {
  const existing = await db.select().from(users);
  if (existing.length > 0) return;

  await db.insert(users).values([
    { username: 'john', password: 'password123', createdAt: '2026-01-01' },
  ]);

  await db.insert(categories).values([
    { userId: 1, name: 'Health', colour: '#2d6a4f' },
    { userId: 1, name: 'Fitness', colour: '#e76f51' },
    { userId: 1, name: 'Learning', colour: '#457b9d' },
    { userId: 1, name: 'Mindfulness', colour: '#a8dadc' },
    { userId: 1, name: 'Productivity', colour: '#f4a261' },
  ]);

  await db.insert(habits).values([
    { userId: 1, categoryId: 1, name: 'Drink Water', description: '8 glasses a day', createdAt: '2026-01-01' },
    { userId: 1, categoryId: 2, name: 'Morning Run', description: '30 min run', createdAt: '2026-01-01' },
    { userId: 1, categoryId: 3, name: 'Read', description: '20 pages a day', createdAt: '2026-01-01' },
    { userId: 1, categoryId: 4, name: 'Meditate', description: '10 min meditation', createdAt: '2026-01-01' },
  ]);

  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    await db.insert(habitLogs).values([
      { habitId: 1, userId: 1, date: dateStr, completed: 1 },
      { habitId: 2, userId: 1, date: dateStr, completed: Math.random() > 0.3 ? 1 : 0 },
      { habitId: 3, userId: 1, date: dateStr, completed: Math.random() > 0.4 ? 1 : 0 },
      { habitId: 4, userId: 1, date: dateStr, completed: Math.random() > 0.5 ? 1 : 0 },
    ]);
  }

  await db.insert(targets).values([
    { userId: 1, habitId: 1, period: 'weekly', goal: 7 },
    { userId: 1, habitId: 2, period: 'weekly', goal: 5 },
    { userId: 1, habitId: 3, period: 'monthly', goal: 20 },
    { userId: 1, habitId: 4, period: 'weekly', goal: 6 },
  ]);
}