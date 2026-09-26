import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * LocalStorageAdapter
 * --------------------
 * Implements user + session persistence using AsyncStorage (on-device
 * only). This is Phase 1 storage.
 *
 * FUTURE MIGRATION: when moving to a cloud backend, create a
 * CloudStorageAdapter that implements the exact same method names
 * (saveUser, getUserByUserId, getAllUsers, setSession, getSession,
 * clearSession) but talks to your API instead of AsyncStorage. Then
 * swap the export at the bottom of this file — authService.js and
 * every screen that uses it needs zero changes, because they only
 * ever call these method names, never touch AsyncStorage directly.
 */

const USERS_KEY = '@lemora/users';
const SESSION_KEY = '@lemora/session_user_id';
const ATTENDANCE_KEY = '@lemora/attendance';

class LocalStorageAdapter {
  async getAllUsers() {
    const raw = await AsyncStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  async getUserByUserId(userId) {
    const users = await this.getAllUsers();
    return users.find((u) => u.userId === userId) || null;
  }

  async saveUser(user) {
    const users = await this.getAllUsers();
    const idx = users.findIndex((u) => u.userId === user.userId);
    if (idx >= 0) {
      users[idx] = user; // update existing
    } else {
      users.push(user); // new user
    }
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
    return user;
  }

  async setSession(userId) {
    await AsyncStorage.setItem(SESSION_KEY, userId);
  }

  async getSession() {
    return AsyncStorage.getItem(SESSION_KEY);
  }

  async clearSession() {
    await AsyncStorage.removeItem(SESSION_KEY);
  }

  async getAttendanceForUser(userId) {
    const raw = await AsyncStorage.getItem(ATTENDANCE_KEY);
    const records = raw ? JSON.parse(raw) : {};
    return Array.isArray(records[userId]) ? records[userId] : [];
  }

  async saveAttendanceForUser(userId, attendance) {
    const raw = await AsyncStorage.getItem(ATTENDANCE_KEY);
    const records = raw ? JSON.parse(raw) : {};
    records[userId] = attendance;
    await AsyncStorage.setItem(ATTENDANCE_KEY, JSON.stringify(records));
  }
}

// Swap this export for a CloudStorageAdapter instance in a future phase.
export default new LocalStorageAdapter();
