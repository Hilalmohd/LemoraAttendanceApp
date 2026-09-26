import 'react-native-get-random-values';
import CryptoJS from 'crypto-js';

/**
 * Local-only password protection.
 *
 * IMPORTANT: This hashes the password so it's never stored in plain
 * text on the device, but it is NOT a substitute for real server-side
 * authentication. When this app moves to a cloud backend, plain-text
 * passwords should be sent over HTTPS and hashed server-side (e.g.
 * bcrypt/argon2) — delete this file and let the backend own hashing.
 */

/** Generates a random per-user salt. */
export function generateSalt() {
  return CryptoJS.lib.WordArray.random(16).toString();
}

/** Hashes a password with the given salt (SHA-256). */
export function hashPassword(password, salt) {
  return CryptoJS.SHA256(password + salt).toString();
}

/** Verifies a plain-text password against a stored hash + salt. */
export function verifyPassword(password, salt, expectedHash) {
  return hashPassword(password, salt) === expectedHash;
}
