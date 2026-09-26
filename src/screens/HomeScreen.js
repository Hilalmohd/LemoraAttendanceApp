import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  Alert,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Platform,
} from 'react-native';
import CircularProgress from '../components/CircularProgress';
import MenuItem from '../components/MenuItem';
import { getCurrentUser, logout } from '../services/authService';
import { checkIn, checkOut, getTodayAttendance } from '../services/attendanceService';
import FingerPrintIcon from '../assets/icons/fingure.svg';
// Fallback shown only if no logged-in user is found (shouldn't normally
// happen, since AppNavigator only routes here after a session check).
const FALLBACK_USER = {
  name: 'Guest',
  role: '',
  photo: null,
};

const ATTENDANCE = {
  percentage: 15,
  nod: 31, // Number Of Days
  attended: 4.5,
};

export default function HomeScreen({ navigation } = {}) {
  const [user, setUser] = useState(FALLBACK_USER);
  const [userId, setUserId] = useState(null);
  const [todayRecord, setTodayRecord] = useState(null);
  const [punchState, setPunchState] = useState('loading');
  const [isPunching, setIsPunching] = useState(false);

  useEffect(() => {
    (async () => {
      const current = await getCurrentUser();
      if (current) {
        const record = await getTodayAttendance(current.userId);
        setUserId(current.userId);
        setTodayRecord(record);
        setPunchState(record?.checkOut ? 'completed' : record?.checkIn ? 'checkedIn' : 'ready');
        setUser({
          name: current.fullName?.toUpperCase() || FALLBACK_USER.name,
          role: current.designation || '',
          photo: current.profilePhotoUri || null,
        });
      }
      else setPunchState('ready');
    })();
  }, []);

  const handlePunch = async () => {
    if (!userId || isPunching || punchState === 'completed') return;
    setIsPunching(true);
    const result = punchState === 'checkedIn' ? await checkOut(userId) : await checkIn(userId);
    setIsPunching(false);
    if (!result.success) {
      Alert.alert('Punch unavailable', result.error);
      return;
    }
    setTodayRecord(result.record);
    setPunchState(result.record.checkOut ? 'completed' : 'checkedIn');
  };

  const handleLogout = async () => {
    await logout();
    navigation?.reset?.({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#B23A4E" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ---------- Header (photo + name + role) ---------- */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            {user.photo ? (
              <Image source={{ uri: user.photo }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitial}>
                  {user.name?.charAt(0) || '?'}
                </Text>
              </View>
            )}
            <View style={{ marginLeft: 14, flex: 1 }}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userRole}>{user.role}</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>

          {/* ---------- Attendance + Punch cards ---------- */}
          <View style={styles.cardRow}>
            <View style={[styles.card, styles.attendanceCard]}>
              <Text style={styles.cardTitle}>Total Attendance</Text>
              <View style={styles.attendanceBody}>
                <CircularProgress
                  percentage={ATTENDANCE.percentage}
                  size={90}
                  strokeWidth={7}
                  color="#C0304A"
                  trackColor="#EFE6E6"
                />
                <View style={{ marginLeft: 14 }}>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>NOD</Text>
                    <Text style={styles.statValue}>: {ATTENDANCE.nod}</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Attended</Text>
                    <Text style={[styles.statValue, styles.statValueGreen]}>
                      : {ATTENDANCE.attended}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={[styles.card, styles.punchCard]}>
              <Text style={styles.cardTitle}>Punch</Text>
              <TouchableOpacity
                style={[styles.punchButton, punchState === 'checkedIn' && styles.punchButtonActive, punchState === 'completed' && styles.punchButtonCompleted]}
                activeOpacity={0.8}
                disabled={punchState === 'loading' || punchState === 'completed' || isPunching}
                onPress={handlePunch}
              >
                {/* <img src={fingerPrintIcon} alt="Fingerprint Icon" /> */}
                <FingerPrintIcon width={52} height={52} />
                <Text style={styles.punchLabel}>{punchState === 'checkedIn' ? 'Check Out' : punchState === 'completed' ? 'Completed' : 'Check In'}</Text>
              </TouchableOpacity>
              {todayRecord?.checkIn && punchState === 'checkedIn' && <Text style={styles.punchTime}>Since {todayRecord.checkIn}</Text>}
            </View>
          </View>
        </View>

        {/* ---------- Attendance section ---------- */}
        <Section title="Attendance" first>
          <MenuItem
            label="Attendance"
            iconBg="#FBEAEA"
            icon={<Text style={styles.iconEmoji}>👤</Text>}
            onPress={() => navigation?.navigate?.('Attendance')}
          />
          <MenuItem
            label="Leave Summary"
            iconBg="#FBF3DE"
            icon={<Text style={styles.iconEmoji}>📅</Text>}
            onPress={() => navigation?.navigate?.('LeaveSummary')}
          />
          <MenuItem
            label="Leave Requests"
            iconBg="#FBEAEA"
            icon={<Text style={styles.iconEmoji}>🗓️</Text>}
            onPress={() => navigation?.navigate?.('LeaveRequests')}
          />
        </Section>

        {/* ---------- General section ---------- */}
        <Section title="General">
          <MenuItem
            label="Payslip"
            iconBg="#FBF3DE"
            icon={<Text style={styles.iconEmoji}>📄</Text>}
            onPress={() => navigation?.navigate?.('Payslip')}
          />
          <MenuItem
            label="Employee Preference"
            iconBg="#FBEAEA"
            icon={<Text style={styles.iconEmoji}>👍</Text>}
            onPress={() => navigation?.navigate?.('EmployeePreference')}
          />
          <MenuItem
            label="Files"
            iconBg="#FBEAEA"
            icon={<Text style={styles.iconEmoji}>📁</Text>}
            onPress={() => navigation?.navigate?.('Files')}
          />
        </Section>

        {/* Benefits section intentionally removed per requirements */}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children, first = false }) {
  return (
    <View style={[styles.section, first && styles.sectionFirst]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionGrid}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#B23A4E',
  },
  scroll: {
    flex: 1,
    backgroundColor: '#F5F3F3',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    backgroundColor: '#B23A4E',
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'android' ? 12 : 4,
    paddingBottom: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#EEE',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#B23A4E',
  },
  logoutButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  userRole: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  cardRow: {
    flexDirection: 'row',
    marginBottom: -40, // lets cards overlap into the grey body, like the reference
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  attendanceCard: {
    flex: 1.4,
    marginRight: 10,
  },
  punchCard: {
    flex: 1,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A4A4A',
    marginBottom: 10,
  },
  attendanceBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 13,
    color: '#6A6A6A',
    width: 60,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3A3A3A',
  },
  statValueGreen: {
    color: '#2E9E4F',
  },
  punchButton: {
    width: 88,
    height: 88,
    borderRadius: 20,
    backgroundColor: '#C0304A',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#7F1F32',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  punchButtonActive: {
    backgroundColor: '#2E8B67',
    shadowColor: '#1A6549',
  },
  punchButtonCompleted: {
    backgroundColor: '#A9A3A3',
    shadowOpacity: 0,
    elevation: 0,
  },
  punchLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
  },
  punchTime: {
    color: '#777',
    fontSize: 10,
    marginTop: 7,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 14,
    marginHorizontal: 14,
    borderRadius: 18,
    paddingTop: 16,
    paddingHorizontal: 10,
    paddingBottom: 6,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  sectionFirst: {
    marginTop: 52, // clears the overlapping cards above
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3A3A3A',
    marginBottom: 4,
    paddingHorizontal: 6,
  },
  sectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  iconEmoji: {
    fontSize: 24,
  },
});

// function FingerprintIcon() {
//   return (
//     <Svg width="32" height="32" viewBox="0 0 32 32" fill="none">
//       <Path d="M16 5.5a8.5 8.5 0 0 0-8.5 8.5v2.5M16 9a5 5 0 0 0-5 5v4.5M16 12.5a1.5 1.5 0 0 0-1.5 1.5v7.5M20.5 20v-6.5a4.5 4.5 0 0 0-9 0" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />
//       <Path d="M23.5 21v-7a7.5 7.5 0 0 0-15 0v3M20 26v-4.5M12 25.5c1.2-1.7 1.5-3.5 1.5-5.5M16 27v-5" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />
//     </Svg>
//   );
// }
