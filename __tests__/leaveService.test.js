jest.mock('../src/services/storageAdapter', () => ({
  __esModule: true,
  default: {
    getLeaveRequestsForUser: jest.fn(),
    saveLeaveRequestsForUser: jest.fn(),
  },
}));

import storageAdapter from '../src/services/storageAdapter';
import { getLeaveRequests, getLeaveStatus, submitLeaveRequest } from '../src/services/leaveService';

describe('leaveService', () => {
  beforeEach(() => jest.clearAllMocks());

  test('classifies upcoming, in-progress, and completed leave against local today', () => {
    const today = new Date(2026, 8, 26);

    expect(getLeaveStatus({ fromDate: '2026-09-27', toDate: '2026-09-30' }, today)).toBe('Upcoming');
    expect(getLeaveStatus({ fromDate: '2026-09-26', toDate: '2026-09-26' }, today)).toBe('In Progress');
    expect(getLeaveStatus({ fromDate: '2026-09-20', toDate: '2026-09-25' }, today)).toBe('Completed');
  });

  test('persists a submitted request under its user and returns it in the summary list', async () => {
    storageAdapter.getLeaveRequestsForUser.mockResolvedValue([]);
    storageAdapter.saveLeaveRequestsForUser.mockResolvedValue();

    const request = { fromDate: '2026-10-01', toDate: '2026-10-02', leaveType: 'Casual Leave', reason: 'Personal appointment' };
    const result = await submitLeaveRequest('employee-1', request);

    expect(result.success).toBe(true);
    expect(result.request).toMatchObject(request);
    expect(result.request.id).toBeTruthy();
    expect(storageAdapter.saveLeaveRequestsForUser).toHaveBeenCalledWith('employee-1', [result.request]);

    storageAdapter.getLeaveRequestsForUser.mockResolvedValue([result.request]);
    await expect(getLeaveRequests('employee-1')).resolves.toEqual([result.request]);
  });
});