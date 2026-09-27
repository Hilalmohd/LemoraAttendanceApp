import storageAdapter from './storageAdapter';

function pad(value) {
  return String(value).padStart(2, '0');
}

export function getMonthKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export function calculateMonthlyAttendanceMetrics({
  month,
  attendance = [],
  leaveRequests = [],
  accountStartDate,
  today = new Date(),
}) {
  const [year, monthNumber] = month.split('-').map(Number);
  const daysInMonth = new Date(year, monthNumber, 0).getDate();
  const monthStart = `${month}-01`;
  const monthEnd = `${month}-${pad(daysInMonth)}`;
  const todayKey = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  const attendanceInMonth = attendance.filter((record) => record?.date?.startsWith(`${month}-`));
  const attendedDates = new Set(attendanceInMonth.filter((record) => record.checkIn).map((record) => record.date));
  const leaveRanges = leaveRequests
    .filter((request) => request?.fromDate && request?.toDate)
    .map((request) => ({ fromDate: request.fromDate, toDate: request.toDate }));
  attendanceInMonth
    .filter((record) => record.status === 'Leave' || record.absent === true || String(record.status || '').toLowerCase() === 'absent')
    .forEach((record) => leaveRanges.push({ fromDate: record.date, toDate: record.date }));
  const leaveDates = new Set();
  leaveRanges.forEach((leave) => {
    const startDate = leave.fromDate > monthStart ? leave.fromDate : monthStart;
    const endDate = leave.toDate < monthEnd ? leave.toDate : monthEnd;
    if (startDate > endDate) return;

    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
    for (const date = start; date <= end; date.setDate(date.getDate() + 1)) {
      leaveDates.add(`${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`);
    }
  });

  return {
    nod: daysInMonth,
    attended: attendedDates.size,
    leave: leaveDates.size,
    percentage: daysInMonth ? Math.round((attendedDates.size / daysInMonth) * 100) : 0,
    asOf: todayKey,
  };
}

export async function getMonthlyAttendanceMetrics(userId, month, today = new Date()) {
  if (!userId) return calculateMonthlyAttendanceMetrics({ month, today });

  const [user, attendance, leaveRequests] = await Promise.all([
    storageAdapter.getUserByUserId(userId),
    storageAdapter.getAttendanceForUser(userId),
    storageAdapter.getLeaveRequestsForUser(userId),
  ]);
  const accountStartDate = user?.createdAt
    ? `${new Date(user.createdAt).getFullYear()}-${pad(new Date(user.createdAt).getMonth() + 1)}-${pad(new Date(user.createdAt).getDate())}`
    : undefined;

  return calculateMonthlyAttendanceMetrics({
    month,
    attendance: Array.isArray(attendance) ? attendance : [],
    leaveRequests: Array.isArray(leaveRequests) ? leaveRequests : [],
    accountStartDate,
    today,
  });
}