import storageAdapter from './storageAdapter';
import { generateSalt, hashPassword, verifyPassword } from '../utils/crypto';

/**
 * authService
 * -----------
 * The single place screens talk to for auth. Everything here is
 * written against storageAdapter's interface, not against
 * AsyncStorage directly — so when Phase 2 swaps in a cloud adapter
 * (or this whole file gets replaced by real API calls), LoginScreen
 * and RegisterScreen don't need to change at all, only this file's
 * internals do.
 */

export const DESIGNATIONS = ['Sales Staff', 'Manager'];

/**
 * Registers a new user.
 * @param {{ fullName: string, designation: string, profilePhotoUri: string|null, userId: string, password: string }} data
 * @returns {Promise<{ success: boolean, error?: string, user?: object }>}
 */
export async function registerUser({ fullName, designation, profilePhotoUri, userId, password }) {
  if (!fullName?.trim()) return { success: false, error: 'Full name is required.' };
  if (!DESIGNATIONS.includes(designation)) return { success: false, error: 'Please select a designation.' };
  if (!userId?.trim()) return { success: false, error: 'User ID is required.' };
  if (!password || password.length < 4) return { success: false, error: 'Password must be at least 4 characters.' };

  const existing = await storageAdapter.getUserByUserId(userId.trim());
  if (existing) {
    return { success: false, error: 'This User ID is already taken.' };
  }

  const salt = generateSalt();
  const passwordHash = hashPassword(password, salt);

  const user = {
    userId: userId.trim(),
    passwordHash,
    passwordSalt: salt,
    fullName: fullName.trim(),
    designation,
    profilePhotoUri: profilePhotoUri || null,
    createdAt: new Date().toISOString(),
  };

  await storageAdapter.saveUser(user);
  await storageAdapter.setSession(user.userId);

  return { success: true, user: toPublicUser(user) };
}

/**
 * Logs a user in.
 * @returns {Promise<{ success: boolean, error?: string, user?: object }>}
 */
export async function loginUser(userId, password) {
  if (!userId?.trim() || !password) {
    return { success: false, error: 'Enter your User ID and password.' };
  }

  const user = await storageAdapter.getUserByUserId(userId.trim());
  if (!user) {
    return { success: false, error: 'No account found with that User ID.' };
  }

  const valid = verifyPassword(password, user.passwordSalt, user.passwordHash);
  if (!valid) {
    return { success: false, error: 'Incorrect password.' };
  }

  await storageAdapter.setSession(user.userId);
  return { success: true, user: toPublicUser(user) };
}

/** Returns the currently logged-in user (public fields only), or null. */
export async function getCurrentUser() {
  const userId = await storageAdapter.getSession();
  if (!userId) return null;
  const user = await storageAdapter.getUserByUserId(userId);
  return user ? toPublicUser(user) : null;
}

export async function logout() {
  await storageAdapter.clearSession();
}

/** Strips sensitive fields (hash/salt) before handing a user object to UI code. */
function toPublicUser(user) {
  const { passwordHash, passwordSalt, ...publicFields } = user;
  return publicFields;
}
