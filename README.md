# HabitTrackr

**IS4447 Mobile Application Development — Option A: Habit Tracker**
**Student Name:** John Cussen
**Student Number:** 122481006

---

## Expo Link
(https://expo.dev/preview/update?message=Final+submission&updateRuntimeVersion=1.0.0&createdAt=2026-04-22T10%3A40%3A53.899Z&slug=exp&projectId=a6552776-95d5-4340-a5a4-603915472d7f&group=2ae2b678-e5b3-4228-a10f-c99bf10d33e0)

exp://u.expo.dev/a6552776-95d5-4340-a5a4-603915472d7f/group/2ae2b678-e5b3-4228-a10f-c99bf10d33e0


## GitHub Repository
https://github.com/johncussen4/HabitTracker2

## Demo Video
https://drive.google.com/file/d/1wxklZyuMaPcJ9v7PHE71YbO0f0FR9mUF/view?usp=drive_link

---

## About
HabitTrackr is a mobile habit tracking app built with React Native, Expo, and Drizzle ORM with SQLite local storage. Users can create and manage daily habits, log activity, set weekly and monthly targets and view progress through insights and streak tracking.

## Features
- Register, login, logout and delete account
- Create, delete and log habits daily
- Assign habits to colour-coded categories
- Set weekly and monthly targets per habit
- View insights with completion rates and streaks
- Streak tracking per habit (current, best, total)
- Light and dark mode toggle (persisted locally)
- Export data to CSV
- Search and filter habits by category
- Seed data pre-loaded for demonstration

## Tech Stack
- React Native with Expo
- Expo Router (file-based navigation)
- Drizzle ORM with SQLite (local storage)
- AsyncStorage (session and theme persistence)
- TypeScript

## Login Credentials (Seed Data)
- Username: `john`
- Password: `password123`

## Setup Instructions
```bash
npm install
npx expo start
```
Scan the QR code with Expo Go on your phone.

## Run Tests
```bash
npm test
```

## Project Structure
```
app/
  (auth)/       - Login and Register screens
  (tabs)/       - Main app screens (Habits, Targets, Insights, Streaks, Profile)
context/        - AuthContext and ThemeContext
db/             - schema.ts, client.ts, seed.ts
__tests__/      - Unit, component and integration tests
```