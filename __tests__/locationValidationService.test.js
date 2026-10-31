jest.mock('react-native-device-info', () => ({
  __esModule: true,
  default: { isLocationEnabled: jest.fn() },
}));

jest.mock('react-native-geolocation-service', () => ({
  __esModule: true,
  default: { getCurrentPosition: jest.fn() },
}));

jest.mock('../src/config/officeGeofence', () => ({
  OFFICE_GEOFENCE: {
    polygon: [
      { latitude: 9, longitude: 9 },
      { latitude: 9, longitude: 11 },
      { latitude: 11, longitude: 11 },
      { latitude: 11, longitude: 9 },
    ],
  },
}));

jest.mock('react-native', () => {
  const ReactNative = jest.requireActual('react-native');
  return {
    Linking: ReactNative.Linking,
    PermissionsAndroid: ReactNative.PermissionsAndroid,
    Platform: { ...ReactNative.Platform, OS: 'ios' },
  };
});

import DeviceInfo from 'react-native-device-info';
import Geolocation from 'react-native-geolocation-service';
import {
  isLocationWithinGeofence,
  validatePunchLocation,
} from '../src/services/locationValidationService';

const geofence = {
  polygon: [
    { latitude: 9, longitude: 9 },
    { latitude: 9, longitude: 11 },
    { latitude: 11, longitude: 11 },
    { latitude: 11, longitude: 9 },
  ],
};

describe('office geofence validation', () => {
  beforeEach(() => jest.clearAllMocks());

  test('accepts a point inside the office polygon', () => {
    expect(isLocationWithinGeofence({ latitude: 10, longitude: 10 }, geofence)).toBe(true);
  });

  test('accepts a point on the office boundary', () => {
    expect(isLocationWithinGeofence({ latitude: 9, longitude: 10 }, geofence)).toBe(true);
  });

  test('rejects a point outside the office polygon', () => {
    expect(isLocationWithinGeofence({ latitude: 12, longitude: 10 }, geofence)).toBe(false);
  });

  test('rejects an invalid or incomplete office boundary', () => {
    expect(isLocationWithinGeofence({ latitude: 10, longitude: 10 }, { ...geofence, polygon: [] })).toBe(false);
    expect(isLocationWithinGeofence({ latitude: 95, longitude: 10 }, geofence)).toBe(false);
  });

  test('blocks the punch when device location services are disabled', async () => {
    DeviceInfo.isLocationEnabled.mockResolvedValue(false);

    const result = await validatePunchLocation();

    expect(result.code).toBe('LOCATION_DISABLED');
    expect(Geolocation.getCurrentPosition).not.toHaveBeenCalled();
  });

  test('requests a fresh high-accuracy fix and accepts a location inside the office', async () => {
    DeviceInfo.isLocationEnabled.mockResolvedValue(true);
    Geolocation.getCurrentPosition.mockImplementation((success) => success({
      coords: { latitude: 10, longitude: 10 },
    }));

    const result = await validatePunchLocation();

    expect(result.success).toBe(true);
    expect(Geolocation.getCurrentPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      expect.objectContaining({ enableHighAccuracy: true, maximumAge: 0 }),
    );
  });

  test('blocks a fresh location outside the office boundary', async () => {
    DeviceInfo.isLocationEnabled.mockResolvedValue(true);
    Geolocation.getCurrentPosition.mockImplementation((success) => success({
      coords: { latitude: 12, longitude: 10 },
    }));

    const result = await validatePunchLocation();

    expect(result.code).toBe('OUTSIDE_GEOFENCE');
  });
});