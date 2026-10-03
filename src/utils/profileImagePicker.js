import { Alert, PermissionsAndroid, Platform } from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

const IMAGE_OPTIONS = {
  mediaType: 'photo',
  maxWidth: 512,
  maxHeight: 512,
  quality: 0.72,
  includeBase64: true,
};

async function requestCameraPermission() {
  if (Platform.OS !== 'android' || Number(Platform.Version) < 23) return true;

  const permission = PermissionsAndroid.PERMISSIONS.CAMERA;
  const currentStatus = await PermissionsAndroid.check(permission);
  if (currentStatus) return true;

  const result = await PermissionsAndroid.request(permission, {
    title: 'Camera access',
    message: 'Allow Lemora to use the camera to take your profile photo.',
    buttonPositive: 'Allow',
    buttonNegative: 'Not now',
  });
  if (result === PermissionsAndroid.RESULTS.GRANTED) return true;

  if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
    Alert.alert('Camera permission needed', 'Enable camera access for Lemora in your device settings to take a profile photo.');
  }
  return false;
}

export async function pickProfileImage(source) {
  if (source === 'camera' && !(await requestCameraPermission())) {
    return { cancelled: true };
  }

  try {
    const result = source === 'camera'
      ? await launchCamera({ ...IMAGE_OPTIONS, cameraType: 'back', saveToPhotos: false })
      : await launchImageLibrary(IMAGE_OPTIONS);

    if (result.didCancel) return { cancelled: true };
    if (result.errorCode) {
      return { error: result.errorMessage || `Unable to open ${source === 'camera' ? 'camera' : 'photo library'}.` };
    }

    const asset = result.assets?.[0];
    if (asset?.base64) {
      return { uri: `data:${asset.type || 'image/jpeg'};base64,${asset.base64}` };
    }
    if (asset?.uri) return { uri: asset.uri };
    return { error: 'No photo was returned. Please try again.' };
  } catch (error) {
    return { error: error?.message || 'The photo could not be opened. Please try again.' };
  }
}