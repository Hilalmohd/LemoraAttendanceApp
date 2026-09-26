import storageAdapter from './storageAdapter';

export const LEAVE_TYPES = [
  'Medical Leave',
  'Public Holiday',
  'Casual Leave',
  'Others',
];

export async function getLeaveRequests(userId) {
  if (!userId) return [];

  const requests = await storageAdapter.getLeaveRequestsForUser(userId);
  return requests
    .filter((request) => request?.id && request.fromDate && request.toDate)
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt));
}

export async function submitLeaveRequest(userId, request) {
  if (!userId) return { success: false, error: 'You must be logged in to apply for leave.' };

  const requests = await getLeaveRequests(userId);
  const savedRequest = {
    ...request,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };

  await storageAdapter.saveLeaveRequestsForUser(userId, [savedRequest, ...requests]);
  return { success: true, request: savedRequest };
}

export function getLeaveStatus(request, today = new Date()) {
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  if (request.fromDate > todayKey) return 'Upcoming';
  if (request.toDate < todayKey) return 'Completed';
  return 'In Progress';
}