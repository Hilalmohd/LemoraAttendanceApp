import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { DESIGNATIONS, getCurrentUser, updateProfile } from '../services/authService';
import { pickProfileImage } from '../utils/profileImagePicker';

export default function ProfileScreen({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [designation, setDesignation] = useState(DESIGNATIONS[0]);
  const [userId, setUserId] = useState('');
  const [profilePhotoUri, setProfilePhotoUri] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getCurrentUser().then((user) => {
      if (!active) return;
      if (user) {
        setFullName(user.fullName || '');
        setDesignation(user.designation || DESIGNATIONS[0]);
        setUserId(user.userId || '');
        setProfilePhotoUri(user.profilePhotoUri || null);
      }
      setLoading(false);
    }).catch(() => {
      if (active) {
        setError('Your profile could not be loaded. Please try again.');
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, []);

  const choosePhoto = () => {
    const actions = [
      { text: 'Take photo', onPress: () => selectPhoto('camera') },
      { text: 'Choose from gallery', onPress: () => selectPhoto('gallery') },
    ];
    if (profilePhotoUri) actions.push({ text: 'Remove photo', style: 'destructive', onPress: () => setProfilePhotoUri(null) });
    actions.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert('Profile photo', 'Choose how to update your photo.', actions);
  };

  const selectPhoto = async (source) => {
    const result = await pickProfileImage(source);
    if (result.error) Alert.alert('Photo unavailable', result.error);
    else if (result.uri) setProfilePhotoUri(result.uri);
  };

  const saveChanges = async () => {
    setError('');
    if (!fullName.trim()) {
      setError('Enter your name before updating your profile.');
      return;
    }

    setSaving(true);
    try {
      const result = await updateProfile({ fullName, designation, profilePhotoUri });
      if (!result.success) {
        setError(result.error);
        return;
      }
      Alert.alert('Profile updated', 'Your profile changes have been saved.');
    } catch (saveError) {
      setError('Your profile could not be updated. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#B23A4E" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} accessibilityLabel="Go back">
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <View><Text style={styles.title}>Profile</Text><Text style={styles.subtitle}>Manage your account details</Text></View>
      </View>
      {loading ? (
        <View style={styles.loading}><ActivityIndicator size="large" color="#B23A4E" /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.photoSection}>
            {profilePhotoUri ? (
              <Image source={{ uri: profilePhotoUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitial}>{fullName.trim().charAt(0).toUpperCase() || '?'}</Text>
              </View>
            )}
            <TouchableOpacity onPress={choosePhoto} style={styles.photoButton} accessibilityRole="button">
              <Text style={styles.photoButtonText}>{profilePhotoUri ? 'Change or remove photo' : 'Add profile photo'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>User ID</Text>
            <Text style={styles.readOnlyValue}>{userId}</Text>

            <Text style={styles.label}>Employee name</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor="#999"
              autoCapitalize="words"
              maxLength={80}
            />

            <Text style={styles.label}>Designation</Text>
            <View style={styles.pickerWrap}>
              <Picker selectedValue={designation} onValueChange={setDesignation} style={styles.picker} dropdownIconColor="#332F2F">
                {DESIGNATIONS.map((value) => <Picker.Item key={value} label={value} value={value} color="#332F2F" />)}
              </Picker>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}
            <TouchableOpacity style={[styles.saveButton, saving && styles.disabledButton]} onPress={saveChanges} disabled={saving}>
              {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Update Profile</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F3F3' },
  header: { backgroundColor: '#B23A4E', padding: 18, flexDirection: 'row', alignItems: 'center' },
  backButton: { width: 36, height: 36, justifyContent: 'center', marginRight: 4 },
  backText: { color: '#FFF', fontSize: 36, lineHeight: 36, fontWeight: '300' },
  title: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  subtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 3 },
  content: { flexGrow: 1, padding: 20, paddingBottom: 36 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  photoSection: { alignItems: 'center', paddingVertical: 24 },
  avatar: { width: 112, height: 112, borderRadius: 56, backgroundColor: '#EEE' },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0E4E4' },
  avatarInitial: { color: '#B23A4E', fontSize: 38, fontWeight: '700' },
  photoButton: { marginTop: 12, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 9, backgroundColor: '#F7EFE9' },
  photoButtonText: { color: '#8B3A44', fontSize: 13, fontWeight: '700' },
  form: { backgroundColor: '#FFF', borderRadius: 14, padding: 18, elevation: 1 },
  label: { color: '#514B4B', fontSize: 13, fontWeight: '600', marginBottom: 7, marginTop: 14 },
  input: { borderWidth: 1, borderColor: '#E3DEDE', borderRadius: 10, paddingHorizontal: 13, paddingVertical: 12, fontSize: 15, color: '#332F2F', backgroundColor: '#FAFAFA' },
  readOnlyValue: { borderWidth: 1, borderColor: '#E3DEDE', borderRadius: 10, paddingHorizontal: 13, paddingVertical: 12, fontSize: 15, color: '#777', backgroundColor: '#F1EFEF' },
  pickerWrap: { borderWidth: 1, borderColor: '#E3DEDE', borderRadius: 10, backgroundColor: '#FAFAFA', overflow: 'hidden' },
  picker: { color: '#332F2F', backgroundColor: '#FAFAFA' },
  error: { color: '#B42335', fontSize: 13, marginTop: 14 },
  saveButton: { backgroundColor: '#B23A4E', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  disabledButton: { opacity: 0.65 },
  saveButtonText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});