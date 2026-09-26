import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { registerUser, DESIGNATIONS } from '../services/authService';

export default function RegisterScreen({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [designation, setDesignation] = useState(DESIGNATIONS[0]);
  const [photoUri, setPhotoUri] = useState(null);
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const pickFromCamera = async () => {
    const result = await launchCamera({ mediaType: 'photo', quality: 0.7, saveToPhotos: false });
    handlePickerResult(result);
  };

  const pickFromGallery = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.7 });
    handlePickerResult(result);
  };

  const handlePickerResult = (result) => {
    if (result.didCancel || result.errorCode) return;
    const asset = result.assets && result.assets[0];
    if (asset?.uri) setPhotoUri(asset.uri);
  };

  const handleRegister = async () => {
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const result = await registerUser({
      fullName,
      designation,
      profilePhotoUri: photoUri,
      userId,
      password,
    });
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    // Registration also logs the user in (see authService), so go
    // straight to Home rather than back to Login.
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F3F3" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Register to start tracking attendance</Text>

          <View style={styles.form}>
            {/* Profile photo */}
            <View style={styles.photoSection}>
              <View style={styles.photoPreviewWrap}>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                ) : (
                  <View style={[styles.photoPreview, styles.photoPlaceholder]}>
                    <Text style={styles.photoPlaceholderText}>No photo</Text>
                  </View>
                )}
              </View>
              <View style={styles.photoButtonsRow}>
                <TouchableOpacity style={styles.photoButton} onPress={pickFromCamera}>
                  <Text style={styles.photoButtonText}>📷 Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoButton} onPress={pickFromGallery}>
                  <Text style={styles.photoButtonText}>🖼️ Gallery</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor="#A0A0A0"
              value={fullName}
              onChangeText={setFullName}
            />

            <Text style={styles.label}>Designation</Text>
            <View style={styles.pickerWrap}>
              <Picker selectedValue={designation} onValueChange={setDesignation}>
                {DESIGNATIONS.map((d) => (
                  <Picker.Item key={d} label={d} value={d} />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>User ID</Text>
            <TextInput
              style={styles.input}
              placeholder="Choose a User ID"
              placeholderTextColor="#A0A0A0"
              autoCapitalize="none"
              autoCorrect={false}
              value={userId}
              onChangeText={setUserId}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Create a password"
              placeholderTextColor="#A0A0A0"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Re-enter your password"
              placeholderTextColor="#A0A0A0"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.registerButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.loginLinkText}>
                Already have an account? <Text style={styles.loginLinkBold}>Log In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F3F3',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3A3A3A',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#8A8A8A',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 8,
  },
  photoPreviewWrap: {
    marginBottom: 10,
  },
  photoPreview: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#F0EBEB',
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E3DEDE',
    borderStyle: 'dashed',
  },
  photoPlaceholderText: {
    fontSize: 11,
    color: '#A0A0A0',
  },
  photoButtonsRow: {
    flexDirection: 'row',
  },
  photoButton: {
    backgroundColor: '#F7EFE9',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginHorizontal: 6,
  },
  photoButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5A5A5A',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5A5A5A',
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E3DEDE',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#3A3A3A',
    backgroundColor: '#FAFAFA',
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: '#E3DEDE',
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
    overflow: 'hidden',
  },
  error: {
    color: '#C0304A',
    fontSize: 13,
    marginTop: 14,
  },
  registerButton: {
    backgroundColor: '#B23A4E',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 22,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  loginLink: {
    marginTop: 18,
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 13,
    color: '#8A8A8A',
  },
  loginLinkBold: {
    color: '#B23A4E',
    fontWeight: '700',
  },
});
