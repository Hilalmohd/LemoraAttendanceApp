import React from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Platform,
} from 'react-native';
import CircularProgress from '../components/CircularProgress';
import MenuItem from '../components/MenuItem';

// --- Mock data — replace with real API / auth data -------------------
const USER = {
  name: 'DILSHAD K A',
  role: 'FIELD STAFF (MK)',
  photo: 'https://i.pravatar.cc/150?img=12', // swap for real avatar URL / local asset
};

const ATTENDANCE = {
  percentage: 15,
  nod: 31, // Number Of Days
  attended: 4.5,
};

export default function HomeScreen({ navigation } = {}) {
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
            <Image source={{ uri: USER.photo }} style={styles.avatar} />
            <View style={{ marginLeft: 14 }}>
              <Text style={styles.userName}>{USER.name}</Text>
              <Text style={styles.userRole}>{USER.role}</Text>
            </View>
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
                style={styles.punchButton}
                activeOpacity={0.8}
                onPress={() => {
                  // TODO: wire up fingerprint / punch-in-out logic
                }}
              >
                <Text style={styles.punchIcon}>🖐️</Text>
              </TouchableOpacity>
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
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#C0304A',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  punchIcon: {
    fontSize: 30,
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
