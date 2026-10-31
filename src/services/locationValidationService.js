import { Linking, PermissionsAndroid, Platform } from 'react-native';
import { OFFICE_GEOFENCE } from '../config/officeGeofence';

function isValidCoordinate(latitude, longitude) {
  return Number.isFinite(latitude)
    && Number.isFinite(longitude)
    && latitude >= -90
    && latitude <= 90
    && longitude >= -180
    && longitude <= 180;
}

function isPointOnSegment(point, start, end) {
  const crossProduct = (point.longitude - start.longitude) * (end.latitude - start.latitude)
    - (point.latitude - start.latitude) * (end.longitude - start.longitude);
  if (Math.abs(crossProduct) > 1e-10) return false;

  return point.longitude >= Math.min(start.longitude, end.longitude) - 1e-10
    && point.longitude <= Math.max(start.longitude, end.longitude) + 1e-10
    && point.latitude >= Math.min(start.latitude, end.latitude) - 1e-10
    && point.latitude <= Math.max(start.latitude, end.latitude) + 1e-10;
}

export function isLocationWithinGeofence(location, geofence = OFFICE_GEOFENCE) {
  const polygon = geofence?.polygon;
  if (!Array.isArray(polygon)
    || polygon.length < 3
    || !polygon.every((point) => isValidCoordinate(point?.latitude, point?.longitude))
    || !isValidCoordinate(location?.latitude, location?.longitude)) {
    return false;
  }

  let isInside = false;
  for (let index = 0, previousIndex = polygon.length - 1; index < polygon.length; previousIndex = index, index += 1) {
    const current = polygon[index];
    const previous = polygon[previousIndex];
    if (isPointOnSegment(location, previous, current)) return true;

    const crossesLatitude = (current.latitude > location.latitude) !== (previous.latitude > location.latitude);
    if (crossesLatitude) {
      const crossingLongitude = ((previous.longitude - current.longitude)
        * (location.latitude - current.latitude))
        / (previous.latitude - current.latitude) + current.longitude;
      if (location.longitude < crossingLongitude) isInside = !isInside;
    }
  }
  return isInside;
}

async function hasLocationPermission() {
  if (Platform.OS !== 'android') return true;

  const permission = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
  if (await PermissionsAndroid.check(permission)) return true;

  return (await PermissionsAndroid.request(permission, {
    title: 'Location permission required',
    message: 'Your location is needed to verify that you are at the office before punching attendance.',
    buttonPositive: 'Continue',
    buttonNegative: 'Cancel',
  })) === PermissionsAndroid.RESULTS.GRANTED;
}

export async function validatePunchLocation() {
  try {
    const DeviceInfo = require('react-native-device-info').default;
    if (!await DeviceInfo.isLocationEnabled()) {
      return {
        success: false,
        code: 'LOCATION_DISABLED',
        error: 'Enable location services in your device settings to record attendance.',
      };
    }
  } catch (error) {
    return {
      success: false,
      code: 'LOCATION_UNAVAILABLE',
      error: 'Unable to check device location services. Please try again.',
    };
  }

  if (!Array.isArray(OFFICE_GEOFENCE.polygon)
    || OFFICE_GEOFENCE.polygon.length < 3) {
    return {
      success: false,
      code: 'GEOFENCE_NOT_CONFIGURED',
      error: 'The office location has not been configured. Please contact your administrator.',
    };
  }

  try {
    if (!await hasLocationPermission()) {
      return {
        success: false,
        code: 'LOCATION_PERMISSION_DENIED',
        error: 'Location permission is required to record attendance.',
      };
    }

    const location = await new Promise((resolve, reject) => {
      const Geolocation = require('react-native-geolocation-service').default;
      Geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
        forceRequestLocation: true,
        showLocationDialog: false,
      });
    });

    if (!isLocationWithinGeofence(location?.coords)) {
      return {
        success: false,
        code: 'OUTSIDE_GEOFENCE',
        error: 'You must be inside the office boundary to record attendance.',
      };
    }
    return { success: true };
  } catch (error) {
    return {
      success: false,
      code: 'LOCATION_UNAVAILABLE',
      error: 'Unable to get your current location. Check your location settings and try again.',
    };
  }
}

export async function openLocationSettings() {
  if (Platform.OS === 'android') {
    try {
      await Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS');
      return;
    } catch (error) {
      // Fall back to the app settings page if the device cannot open location settings.
    }
  }
  await Linking.openSettings();
}