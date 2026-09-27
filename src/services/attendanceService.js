import storageAdapter from './storageAdapter';
import { authenticatePunch } from './punchAuthenticationService';

export const ATTENDANCE_SCHEDULE = {
  shiftStartHour: 9,
  shiftStartMinute: 0,
  earlyCheckInAllowanceMinutes: 60,
  shiftEndHour: 21,
  shiftEndMinute: 30,
};

function pad(value) {
  return String(value).padStart(2, '0');
}

function getDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function getTimeKey(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function getLateMinutes(checkInTime) {
  if (!checkInTime) return 0;
  const [hours, minutes] = checkInTime.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0;

  const checkInMinutes = hours * 60 + minutes;
  const shiftStartMinutes = ATTENDANCE_SCHEDULE.shiftStartHour * 60 + ATTENDANCE_SCHEDULE.shiftStartMinute;
  return Math.max(0, checkInMinutes - shiftStartMinutes);
}

function formatClockTime(hour, minute) {
  const date = new Date(2000, 0, 1, hour, minute);
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function getCheckInWindow(date = new Date()) {
  const shiftStart = ATTENDANCE_SCHEDULE.shiftStartHour * 60 + ATTENDANCE_SCHEDULE.shiftStartMinute;
  const allowedStart = shiftStart - ATTENDANCE_SCHEDULE.earlyCheckInAllowanceMinutes;
  const shiftEnd = ATTENDANCE_SCHEDULE.shiftEndHour * 60 + ATTENDANCE_SCHEDULE.shiftEndMinute;
  const currentTime = date.getHours() * 60 + date.getMinutes();

  return {
    allowed: currentTime >= allowedStart && currentTime <= shiftEnd,
    startLabel: formatClockTime(Math.floor(allowedStart / 60), allowedStart % 60),
    endLabel: formatClockTime(ATTENDANCE_SCHEDULE.shiftEndHour, ATTENDANCE_SCHEDULE.shiftEndMinute),
  };
}

export async function getAttendanceRecords(userId) {
  if (!userId) return [];

  const records = await storageAdapter.getAttendanceForUser(userId);
  return records
    .filter((record) => record?.date)
    .sort((first, second) => first.date.localeCompare(second.date));
}

export async function getTodayAttendance(userId, date = new Date()) {
  const records = await getAttendanceRecords(userId);
  return records.find((record) => record.date === getDateKey(date)) || null;
}

export async function checkIn(userId, date = new Date()) {
  if (!userId) return { success: false, error: 'You must be logged in to check in.' };

  const checkInWindow = getCheckInWindow(date);
  if (!checkInWindow.allowed) {
    return {
      success: false,
      error: `Check-In is available from ${checkInWindow.startLabel} to ${checkInWindow.endLabel}.`,
    };
  }

  const records = await getAttendanceRecords(userId);
  const dateKey = getDateKey(date);
  const existing = records.find((record) => record.date === dateKey);
  if (existing?.checkIn) {
    return { success: false, error: 'You have already checked in today.' };
  }
  if (!await authenticatePunch('punch in')) {
    return { success: false, error: 'Authentication was cancelled or could not be completed.' };
  }

  const updatedRecord = { ...(existing || {}), date: dateKey, checkIn: getTimeKey(date), status: 'Present', absent: false };
  const updatedRecords = existing
    ? records.map((record) => (record.date === dateKey ? updatedRecord : record))
    : [...records, updatedRecord];
  await storageAdapter.saveAttendanceForUser(userId, updatedRecords);
  return { success: true, record: updatedRecord };
}

export async function checkOut(userId, date = new Date()) {
  if (!userId) return { success: false, error: 'You must be logged in to check out.' };

  const records = await getAttendanceRecords(userId);
  const dateKey = getDateKey(date);
  const existing = records.find((record) => record.date === dateKey);
  if (!existing?.checkIn) {
    return { success: false, error: 'Check in before checking out.' };
  }
  if (existing.checkOut) {
    return { success: false, error: 'You have already checked out today.' };
  }
  if (!await authenticatePunch('punch out')) {
    return { success: false, error: 'Authentication was cancelled or could not be completed.' };
  }

  const updatedRecord = { ...existing, checkOut: getTimeKey(date) };
  const updatedRecords = records.map((record) => (record.date === dateKey ? updatedRecord : record));
  await storageAdapter.saveAttendanceForUser(userId, updatedRecords);
  return { success: true, record: updatedRecord };
}