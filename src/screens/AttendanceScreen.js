import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, FlatList, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { getCurrentUser } from '../services/authService';
import { getAttendanceRecords } from '../services/attendanceService';

const GRACE_PERIOD_MINUTES = 9 * 60 + 30;
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function pad(value) { return String(value).padStart(2, '0'); }
function getMonthKey(date) { return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`; }
function formatDate(dateString) {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}
function formatTime(value) {
  if (!value) return '--';
  const date = new Date(`1970-01-01T${value}`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}
function minutesFromTime(value) {
  if (!value) return null;
  const [hours, minutes] = value.split(':').map(Number);
  return Number.isFinite(hours) && Number.isFinite(minutes) ? hours * 60 + minutes : null;
}
function getLateMinutes(checkIn) {
  const minutes = minutesFromTime(checkIn);
  return minutes === null || minutes <= GRACE_PERIOD_MINUTES ? 0 : minutes - GRACE_PERIOD_MINUTES;
}
function formatDuration(minutes) {
  if (!minutes) return 'No Delay';
  const hours = Math.floor(minutes / 60);
  return hours ? `${hours}h ${minutes % 60}m` : `${minutes} min`;
}
function getWorkingHours(record) {
  const checkIn = minutesFromTime(record.checkIn);
  const checkOut = minutesFromTime(record.checkOut);
  if (checkIn === null || checkOut === null || checkOut < checkIn) return '--';
  const total = checkOut - checkIn;
  return `${Math.floor(total / 60)}h ${pad(total % 60)}m`;
}

export default function AttendanceScreen({ navigation }) {
  const [selectedMonth, setSelectedMonth] = useState(getMonthKey(new Date()));
  const [records, setRecords] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  const monthOptions = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 24 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
      return { key: getMonthKey(date), label: `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}` };
    });
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const user = await getCurrentUser();
        const attendance = await getAttendanceRecords(user?.userId);
        if (active) { setRecords(attendance); setStatus('ready'); }
      } catch (loadError) {
        if (active) { setError('Attendance records could not be loaded.'); setStatus('error'); }
      }
    })();
    return () => { active = false; };
  }, []);

  const visibleRecords = records.filter((record) => record.date.startsWith(selectedMonth));

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#B23A4E" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <View><Text style={styles.title}>Attendance History</Text><Text style={styles.subtitle}>Review your daily attendance</Text></View>
      </View>
      <View style={styles.body}>
        <Text style={styles.fieldLabel}>SELECT MONTH</Text>
        <View style={styles.pickerWrap}>
          <Picker selectedValue={selectedMonth} onValueChange={setSelectedMonth} style={styles.picker}>
            {monthOptions.map((option) => <Picker.Item key={option.key} label={option.label} value={option.key} />)}
          </Picker>
        </View>
        {status === 'loading' && <View style={styles.centerState}><ActivityIndicator size="large" color="#B23A4E" /><Text style={styles.stateText}>Loading attendance...</Text></View>}
        {status === 'error' && <View style={styles.centerState}><Text style={styles.stateTitle}>Unable to load records</Text><Text style={styles.stateText}>{error}</Text></View>}
        {status === 'ready' && (
          <FlatList
            data={visibleRecords}
            keyExtractor={(item) => item.id || item.date}
            contentContainerStyle={visibleRecords.length ? styles.list : styles.emptyList}
            ListEmptyComponent={<View style={styles.centerState}><Text style={styles.stateTitle}>No attendance records</Text><Text style={styles.stateText}>There are no records for the selected month.</Text></View>}
            renderItem={({ item }) => {
              const lateMinutes = getLateMinutes(item.checkIn);
              return <View style={[styles.record, lateMinutes > 0 && styles.lateRecord]}>
                <View style={styles.recordHeading}><Text style={styles.recordDate}>{formatDate(item.date)}</Text>{lateMinutes > 0 && <Text style={styles.lateBadge}>LATE</Text>}</View>
                <View style={styles.detailsRow}>
                  <Detail label="Check-in" value={formatTime(item.checkIn)} />
                  <Detail label="Check-out" value={formatTime(item.checkOut)} />
                  <Detail label="Total hours" value={getWorkingHours(item)} />
                  <Detail label="Late hours" value={formatDuration(lateMinutes)} late={lateMinutes > 0} />
                </View>
              </View>;
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function Detail({ label, value, late }) {
  return <View style={styles.detail}><Text style={styles.detailLabel}>{label}</Text><Text style={[styles.detailValue, late && styles.lateText]}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F3F3' },
  header: { backgroundColor: '#B23A4E', padding: 18, flexDirection: 'row', alignItems: 'center' },
  backButton: { width: 36, height: 36, justifyContent: 'center' },
  backText: { color: '#FFF', fontSize: 36, lineHeight: 36, fontWeight: '300' },
  title: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  subtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 3 },
  body: { flex: 1, padding: 18 },
  fieldLabel: { color: '#777', fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 7 },
  pickerWrap: { backgroundColor: '#FFF', borderRadius: 12, marginBottom: 18, overflow: 'hidden' },
  picker: { height: 52 },
  list: { paddingBottom: 20 },
  emptyList: { flexGrow: 1 },
  record: { backgroundColor: '#FFF', borderRadius: 14, padding: 15, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#D9D4D4' },
  lateRecord: { borderLeftColor: '#D98444' },
  recordHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  recordDate: { color: '#2F2B2B', fontSize: 16, fontWeight: '700' },
  lateBadge: { color: '#A95821', backgroundColor: '#FFF0E3', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, fontSize: 10, fontWeight: '800' },
  detailsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detail: { flex: 1 },
  detailLabel: { color: '#888', fontSize: 10, marginBottom: 5 },
  detailValue: { color: '#3B3737', fontSize: 12, fontWeight: '700' },
  lateText: { color: '#B86128' },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  stateTitle: { color: '#3B3737', fontSize: 17, fontWeight: '700', marginBottom: 7, textAlign: 'center' },
  stateText: { color: '#888', fontSize: 13, textAlign: 'center', marginTop: 10 },
});