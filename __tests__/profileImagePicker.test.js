jest.mock('react-native', () => {
  return {
    Alert: { alert: jest.fn() },
    PermissionsAndroid: {
      PERMISSIONS: { CAMERA: 'android.permission.CAMERA' },
      RESULTS: { GRANTED: 'granted', NEVER_ASK_AGAIN: 'never_ask_again' },
      check: jest.fn(),
      request: jest.fn(),
    },
    Platform: { OS: 'android', Version: 35 },
  };
});

jest.mock('react-native-image-picker', () => ({
  launchCamera: jest.fn(),
  launchImageLibrary: jest.fn(),
}));

import { PermissionsAndroid } from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { pickProfileImage } from '../src/utils/profileImagePicker';

describe('pickProfileImage', () => {
  beforeEach(() => jest.clearAllMocks());

  test('requests camera permission and returns a persistent resized image URI', async () => {
    PermissionsAndroid.check.mockResolvedValue(false);
    PermissionsAndroid.request.mockResolvedValue(PermissionsAndroid.RESULTS.GRANTED);
    launchCamera.mockResolvedValue({
      assets: [{ type: 'image/jpeg', base64: 'compressed-image' }],
    });

    const result = await pickProfileImage('camera');

    expect(PermissionsAndroid.request).toHaveBeenCalledWith(
      'android.permission.CAMERA',
      expect.objectContaining({ buttonPositive: 'Allow' }),
    );
    expect(launchCamera).toHaveBeenCalledWith(expect.objectContaining({
      mediaType: 'photo',
      maxWidth: 512,
      maxHeight: 512,
      includeBase64: true,
      saveToPhotos: false,
    }));
    expect(result.uri).toBe('data:image/jpeg;base64,compressed-image');
  });

  test('does not open the camera if camera permission is denied', async () => {
    PermissionsAndroid.check.mockResolvedValue(false);
    PermissionsAndroid.request.mockResolvedValue('denied');

    await expect(pickProfileImage('camera')).resolves.toEqual({ cancelled: true });
    expect(launchCamera).not.toHaveBeenCalled();
  });

  test('gallery selection does not request camera permission', async () => {
    launchImageLibrary.mockResolvedValue({
      assets: [{ type: 'image/png', base64: 'gallery-image' }],
    });

    await expect(pickProfileImage('gallery')).resolves.toEqual({
      uri: 'data:image/png;base64,gallery-image',
    });
    expect(PermissionsAndroid.request).not.toHaveBeenCalled();
  });
});