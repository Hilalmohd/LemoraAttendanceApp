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
import { checkIn, checkOut } from '../src/services/attendanceService';

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
});