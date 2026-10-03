jest.mock('../src/services/storageAdapter', () => ({
  __esModule: true,
  default: {
    getSession: jest.fn(),
    getUserByUserId: jest.fn(),
    saveUser: jest.fn(),
  },
}));

jest.mock('../src/utils/crypto', () => ({
  generateSalt: jest.fn(),
  hashPassword: jest.fn(),
  verifyPassword: jest.fn(),
}));

import storageAdapter from '../src/services/storageAdapter';
import { updateProfile } from '../src/services/authService';

describe('updateProfile', () => {
  beforeEach(() => jest.clearAllMocks());

  test('validates required profile fields', async () => {
    await expect(updateProfile({ fullName: ' ', designation: 'Sales Staff' })).resolves.toMatchObject({
      success: false,
      error: 'Full name is required.',
    });
    expect(storageAdapter.saveUser).not.toHaveBeenCalled();
  });

  test('persists editable fields while preserving credentials and other account data', async () => {
    const storedUser = {
      userId: 'employee-1',
      passwordHash: 'stored-hash',
      passwordSalt: 'stored-salt',
      fullName: 'Old Name',
      designation: 'Sales Staff',
      profilePhotoUri: null,
      createdAt: '2026-01-01T00:00:00.000Z',
    };
    storageAdapter.getSession.mockResolvedValue('employee-1');
    storageAdapter.getUserByUserId.mockResolvedValue(storedUser);
    storageAdapter.saveUser.mockImplementation(async (user) => user);

    const result = await updateProfile({
      fullName: '  New Name  ',
      designation: 'Manager',
      profilePhotoUri: 'data:image/jpeg;base64,photo-data',
    });

    expect(result).toMatchObject({
      success: true,
      user: { userId: 'employee-1', fullName: 'New Name', designation: 'Manager', profilePhotoUri: 'data:image/jpeg;base64,photo-data' },
    });
    expect(storageAdapter.saveUser).toHaveBeenCalledWith(expect.objectContaining({
      passwordHash: 'stored-hash',
      passwordSalt: 'stored-salt',
      createdAt: storedUser.createdAt,
      fullName: 'New Name',
      designation: 'Manager',
      profilePhotoUri: 'data:image/jpeg;base64,photo-data',
    }));
    expect(result.user.passwordHash).toBeUndefined();
    expect(result.user.passwordSalt).toBeUndefined();
  });
});