import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getCurrentUser } from '../services/authService';
import { getLeaveRequests, getLeaveStatus } from '../services/leaveService';

function formatDate(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function LeaveSummaryScreen({ navigation }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const user = await getCurrentUser();
      setRequests(await getLeaveRequests(user?.userId));
      setError('');
    } catch (loadError) {
      setError('Leave requests could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadRequests(); }, [loadRequests]));

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#B23A4E" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.backButton} accessibilityLabel="Go back"><Text style={styles.backText}>‹</Text></TouchableOpacity>
        <View style={styles.headerText}><Text style={styles.title}>Leave Summary</Text><Text style={styles.subtitle}>Track your time away</Text></View>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('LeaveRequests')} accessibilityLabel="Apply for leave"><Text style={styles.addText}>+</Text></TouchableOpacity>
      </View>
      <View style={styles.body}>
        {loading ? <View style={styles.centerState}><ActivityIndicator size="large" color="#B23A4E" /><Text style={styles.stateText}>Loading leave requests...</Text></View> : null}
        {!loading && error ? <View style={styles.centerState}><Text style={styles.stateTitle}>Unable to load requests</Text><Text style={styles.stateText}>{error}</Text></View> : null}
        {!loading && !error ? <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={requests.length ? styles.list : styles.emptyList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<View style={styles.centerState}><View style={styles.emptyMark}><Text style={styles.emptyMarkText}>—</Text></View><Text style={styles.stateTitle}>No leave requests yet</Text><Text style={styles.stateText}>Your submitted requests will appear here.</Text><TouchableOpacity onPress={() => navigation.navigate('LeaveRequests')} style={styles.emptyButton}><Text style={styles.emptyButtonText}>Apply for leave</Text></TouchableOpacity></View>}
          renderItem={({ item }) => {
            const status = getLeaveStatus(item);
            return <View style={styles.requestRow}>
              <View style={styles.requestTop}>
                <Text style={styles.leaveType}>{item.leaveType}</Text>
                <StatusBadge status={status} />
              </View>
              <View style={styles.dateRange}>
                <View style={styles.dateBlock}><Text style={styles.detailLabel}>FROM</Text><Text style={styles.dateValue}>{formatDate(item.fromDate)}</Text></View>
                <Text style={styles.rangeArrow}>→</Text>
                <View style={styles.dateBlock}><Text style={styles.detailLabel}>TO</Text><Text style={styles.dateValue}>{formatDate(item.toDate)}</Text></View>
              </View>
              <View style={styles.reasonBlock}><Text style={styles.detailLabel}>REASON</Text><Text style={styles.reasonText}>{item.reason}</Text></View>
            </View>;
          }}
        /> : null}
      </View>
    </SafeAreaView>
  );
}

function StatusBadge({ status }) {
  const badgeStyle = status === 'Upcoming' ? styles.upcomingBadge : status === 'In Progress' ? styles.progressBadge : styles.completedBadge;
  const textStyle = status === 'Upcoming' ? styles.upcomingText : status === 'In Progress' ? styles.progressText : styles.completedText;
  return <View style={[styles.badge, badgeStyle]}><Text style={[styles.badgeText, textStyle]}>{status}</Text></View>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#B23A4E' },
  header: { backgroundColor: '#B23A4E', padding: 18, flexDirection: 'row', alignItems: 'center' },
  backButton: { width: 36, height: 36, justifyContent: 'center', marginRight: 4 },
  backText: { color: '#FFF', fontSize: 36, lineHeight: 36, fontWeight: '300' },
  headerText: { flex: 1 },
  title: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  subtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 3 },
  addButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)' },
  addText: { color: '#FFF', fontSize: 27, lineHeight: 30, fontWeight: '300' },
  body: { flex: 1, paddingHorizontal: 18, backgroundColor: '#F5F3F3' },
  list: { paddingTop: 18, paddingBottom: 24 },
  emptyList: { flexGrow: 1 },
  requestRow: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#D9D4D4' },
  requestTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 18 },
  leaveType: { flex: 1, color: '#332F2F', fontSize: 16, fontWeight: '700' },
  badge: { borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  upcomingBadge: { backgroundColor: '#E6F1FF' },
  upcomingText: { color: '#2463A6' },
  progressBadge: { backgroundColor: '#E5F5EC' },
  progressText: { color: '#287349' },
  completedBadge: { backgroundColor: '#ECEBEC' },
  completedText: { color: '#686363' },
  dateRange: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  dateBlock: { flex: 1 },
  detailLabel: { color: '#918989', fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginBottom: 5 },
  dateValue: { color: '#332F2F', fontSize: 13, fontWeight: '600' },
  rangeArrow: { color: '#B5AEAE', fontSize: 18, paddingHorizontal: 12, marginTop: 9 },
  reasonBlock: { borderTopWidth: 1, borderTopColor: '#F0ECEC', paddingTop: 12 },
  reasonText: { color: '#625B5B', fontSize: 13, lineHeight: 19 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  stateTitle: { color: '#3B3737', fontSize: 17, fontWeight: '700', marginTop: 14, textAlign: 'center' },
  stateText: { color: '#888', fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 19 },
  emptyMark: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#F0E5E5', alignItems: 'center', justifyContent: 'center' },
  emptyMarkText: { color: '#B23A4E', fontSize: 27 },
  emptyButton: { marginTop: 20, backgroundColor: '#B23A4E', borderRadius: 9, paddingHorizontal: 18, paddingVertical: 12 },
  emptyButtonText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
});