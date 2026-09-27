import ReactNativeBiometrics from 'react-native-biometrics';

const biometrics = new ReactNativeBiometrics({ allowDeviceCredentials: true });

export async function authenticatePunch(action) {
  try {
    const result = await biometrics.simplePrompt({
      promptMessage: `Authenticate to ${action}`,
      fallbackPromptMessage: 'Use your device passcode to continue',
      cancelButtonText: 'Cancel',
    });
    return Boolean(result?.success);
  } catch (error) {
    return false;
  }
}