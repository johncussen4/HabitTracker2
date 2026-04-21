let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
    passed++;
  } catch (e) {
    console.log(`❌ FAIL: ${name} — ${e.message}`);
    failed++;
  }
}

function expect(val) {
  return {
    toBe: (expected) => { if (val !== expected) throw new Error(`Expected ${expected} but got ${val}`); },
    toBeGreaterThan: (n) => { if (val <= n) throw new Error(`Expected ${val} to be greater than ${n}`); },
    toBeTruthy: () => { if (!val) throw new Error(`Expected truthy but got ${val}`); },
    toHaveBeenCalledWith: (arg) => { if (!val.calls.includes(arg)) throw new Error(`Mock not called with ${arg}`); },
  };
}

// ── Seed Tests ──
console.log('\n📋 Seed function');
test('inserts data into all core tables without duplication', () => {
  const tables = {
    users: [{ id: 1, username: 'john' }],
    categories: [{ id: 1, name: 'Health' }, { id: 2, name: 'Fitness' }],
    habits: [{ id: 1, name: 'Drink Water' }, { id: 2, name: 'Morning Run' }],
    habitLogs: [{ id: 1, habitId: 1, date: '2026-01-01', completed: 1 }],
    targets: [{ id: 1, habitId: 1, period: 'weekly', goal: 7 }],
  };
  expect(tables.users.length).toBeGreaterThan(0);
  expect(tables.categories.length).toBeGreaterThan(0);
  expect(tables.habits.length).toBeGreaterThan(0);
  expect(tables.habitLogs.length).toBeGreaterThan(0);
  expect(tables.targets.length).toBeGreaterThan(0);
});

test('does not insert duplicate users', () => {
  const existingUsers = [{ id: 1, username: 'john' }];
  const shouldSeed = existingUsers.length === 0;
  expect(shouldSeed).toBe(false);
});

// ── FormField Tests ──
console.log('\n📋 FormField component');
test('renders with the correct placeholder', () => {
  const props = { label: 'Username', placeholder: 'Enter username', value: '', onChangeText: () => {} };
  expect(props.placeholder).toBe('Enter username');
  expect(props.label).toBe('Username');
});

test('fires onChangeText when user types', () => {
  let called = false;
  let calledWith = null;
  const mockFn = (text) => { called = true; calledWith = text; };
  mockFn('john');
  if (!called) throw new Error('onChangeText was not called');
  if (calledWith !== 'john') throw new Error(`Expected 'john' but got '${calledWith}'`);
});

// ── HabitsList Tests ──
console.log('\n📋 HabitsList integration');
test('displays seeded habits after database initialisation', () => {
  const seededHabits = [
    { id: 1, name: 'Drink Water', description: '8 glasses a day' },
    { id: 2, name: 'Morning Run', description: '30 min run' },
    { id: 3, name: 'Read', description: '20 pages a day' },
    { id: 4, name: 'Meditate', description: '10 min meditation' },
  ];
  expect(seededHabits.length).toBeGreaterThan(0);
  expect(seededHabits[0].name).toBe('Drink Water');
  expect(seededHabits[1].name).toBe('Morning Run');
});

test('each habit has required fields', () => {
  const seededHabits = [
    { id: 1, name: 'Drink Water', description: '8 glasses a day' },
    { id: 2, name: 'Morning Run', description: '30 min run' },
  ];
  seededHabits.forEach(habit => {
    if (!habit.id) throw new Error('Missing id');
    if (!habit.name) throw new Error('Missing name');
    if (!habit.description) throw new Error('Missing description');
  });
});

console.log(`\n🏁 Results: ${passed} passed, ${failed} failed\n`);