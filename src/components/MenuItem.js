import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';

/**
 * A single tappable icon tile used in the "Attendance" / "General"
 * grid sections, e.g. Attendance / Leave Summary / Leave Requests.
 *
 * `icon` is left generic (pass any React node - an emoji Text,
 * an Image, or an icon component from react-native-vector-icons)
 * so this template has zero hard icon-library dependency.
 */
export default function MenuItem({ icon, label, onPress, iconBg = '#F7EFE9' }) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        {icon}
      </View>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '33.33%',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    color: '#3A3A3A',
    textAlign: 'center',
    fontWeight: '500',
  },
});
