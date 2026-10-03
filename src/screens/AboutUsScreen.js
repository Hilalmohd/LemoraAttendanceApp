import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import packageInfo from '../../package.json';

const ABOUT_DETAILS = [
  { label: 'Application', value: 'Lemora' },
  { label: 'Version', value: packageInfo.version },
  { label: 'Developer / Company', value: 'Hilal.' },
  { label: 'Contact number', value: '+918089811180' },
  { label: 'Contact email', value: 'hilalmohd180@gmail.com' },
];

export default function AboutUsScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#B23A4E" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} accessibilityLabel="Go back">
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <View><Text style={styles.title}>About Us</Text><Text style={styles.subtitle}>About this application</Text></View>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.brandBlock}>
          <View style={styles.brandMark}><Text style={styles.brandInitial}>L</Text></View>
          <Text style={styles.brandName}>Lemora</Text>
        </View>
        <View style={styles.details}>
          {ABOUT_DETAILS.map((item, index) => (
            <View key={item.label} style={[styles.detailRow, index === ABOUT_DETAILS.length - 1 && styles.lastRow]}>
              <Text style={styles.detailLabel}>{item.label}</Text>
              <Text style={styles.detailValue}>{item.value}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
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
  content: { flexGrow: 1, padding: 20 },
  brandBlock: { alignItems: 'center', paddingVertical: 30 },
  brandMark: { width: 74, height: 74, borderRadius: 37, backgroundColor: '#B23A4E', alignItems: 'center', justifyContent: 'center' },
  brandInitial: { color: '#FFF', fontSize: 40, fontWeight: '700' },
  brandName: { color: '#332F2F', fontSize: 22, fontWeight: '700', marginTop: 12 },
  details: { backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 16 },
  detailRow: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F0ECEC' },
  lastRow: { borderBottomWidth: 0 },
  detailLabel: { color: '#898282', fontSize: 12, marginBottom: 5 },
  detailValue: { color: '#332F2F', fontSize: 14, fontWeight: '600' },
});