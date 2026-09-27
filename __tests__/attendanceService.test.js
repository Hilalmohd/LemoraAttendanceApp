jest.mock('../src/services/storageAdapter', () => ({
  __esModule: true,
  default: {
    getAttendanceForUser: jest.fn(),
    saveAttendanceForUser: jest.fn(),
  },
}));

jest.mock('../src/services/punchAuthenticationService', () => ({
  authenticatePunch: jest.fn(),
}));

import storageAdapter from '../src/services/storageAdapter';
import { authenticatePunch } from '../src/services/punchAuthenticationService';
import { checkIn, checkOut, getLateMinutes } from '../src/services/attendanceService';

describe('attendance punch authentication', () => {
  beforeEach(() => jest.clearAllMocks());

  test('does not save a punch when device authentication is cancelled', async () => {
    storageAdapter.getAttendanceForUser.mockResolvedValue([]);
    authenticatePunch.mockResolvedValue(false);

    const result = await checkIn('employee-1', new Date(2026, 8, 26, 9, 15));

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Authentication/);
    expect(storageAdapter.saveAttendanceForUser).not.toHaveBeenCalled();
  });

  test('verified check-in clears an auto-absence marker', async () => {
    storageAdapter.getAttendanceForUser.mockResolvedValue([
      { date: '2026-09-26', status: 'Absent', absent: true },
    ]);
    authenticatePunch.mockResolvedValue(true);

    const result = await checkIn('employee-1', new Date(2026, 8, 26, 9, 15));

    expect(authenticatePunch).toHaveBeenCalledWith('punch in');
    expect(result.record).toMatchObject({ date: '2026-09-26', checkIn: '09:15', status: 'Present', absent: false });
    expect(storageAdapter.saveAttendanceForUser).toHaveBeenCalledWith('employee-1', [result.record]);
  });

  test('does not save a punch-out when device authentication is cancelled', async () => {
    storageAdapter.getAttendanceForUser.mockResolvedValue([
      { date: '2026-09-26', checkIn: '09:00' },
    ]);
    authenticatePunch.mockResolvedValue(false);

    const result = await checkOut('employee-1', new Date(2026, 8, 26, 17, 0));

    expect(authenticatePunch).toHaveBeenCalledWith('punch out');
    expect(result.success).toBe(false);
    expect(storageAdapter.saveAttendanceForUser).not.toHaveBeenCalled();
  });

  test('rejects check-in before the configured early-arrival window without prompting authentication', async () => {
    const result = await checkIn('employee-1', new Date(2026, 8, 26, 7, 59));

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/8:00\s*am/i);
    expect(authenticatePunch).not.toHaveBeenCalled();
    expect(storageAdapter.getAttendanceForUser).not.toHaveBeenCalled();
  });

  test.each([
    [8, 0],
    [21, 30],
  ])('allows check-in at the inclusive boundary %s:%s', async (hour, minute) => {
    storageAdapter.getAttendanceForUser.mockResolvedValue([]);
    authenticatePunch.mockResolvedValue(true);

    const result = await checkIn('employee-1', new Date(2026, 8, 26, hour, minute));

    expect(result.success).toBe(true);
    expect(authenticatePunch).toHaveBeenCalledWith('punch in');
  });

  test('rejects check-in after the configured end time', async () => {
    const result = await checkIn('employee-1', new Date(2026, 8, 26, 21, 31));

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/9:30\s*pm/i);
    expect(authenticatePunch).not.toHaveBeenCalled();
    expect(storageAdapter.getAttendanceForUser).not.toHaveBeenCalled();
  });

  test('allows check-out outside working hours', async () => {
    storageAdapter.getAttendanceForUser.mockResolvedValue([
      { date: '2026-09-26', checkIn: '09:00' },
    ]);
    authenticatePunch.mockResolvedValue(true);

    const result = await checkOut('employee-1', new Date(2026, 8, 26, 23, 15));

    expect(result.success).toBe(true);
    expect(result.record.checkOut).toBe('23:15');
    expect(authenticatePunch).toHaveBeenCalledWith('punch out');
  });
});

describe('late check-in calculation', () => {
  test('treats 9:00 AM as on time using the configured shift start', () => {
    expect(getLateMinutes('09:00')).toBe(0);
  });

  test('counts minutes after 9:00 AM as late', () => {
    expect(getLateMinutes('09:01')).toBe(1);
    expect(getLateMinutes('09:30')).toBe(30);
  });

  test('does not count an allowed early arrival as late', () => {
    expect(getLateMinutes('08:00')).toBe(0);
    expect(getLateMinutes('08:59')).toBe(0);
  });
});