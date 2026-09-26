import storageAdapter from './storageAdapter';

function pad(value) {
  return String(value).padStart(2, '0');
}

function getDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function getTimeKey(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
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

  const records = await getAttendanceRecords(userId);
  const dateKey = getDateKey(date);
  const existing = records.find((record) => record.date === dateKey);
  if (existing?.checkIn) {
    return { success: false, error: 'You have already checked in today.' };
  }

  const updatedRecord = { ...(existing || {}), date: dateKey, checkIn: getTimeKey(date) };
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

  const updatedRecord = { ...existing, checkOut: getTimeKey(date) };
  const updatedRecords = records.map((record) => (record.date === dateKey ? updatedRecord : record));
  await storageAdapter.saveAttendanceForUser(userId, updatedRecords);
  return { success: true, record: updatedRecord };
}