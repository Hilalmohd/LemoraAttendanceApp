import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import LeaveRequestScreen from '../screens/LeaveRequestScreen';
import LeaveSummaryScreen from '../screens/LeaveSummaryScreen';
import { getCurrentUser } from '../services/authService';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Login');

  useEffect(() => {
    (async () => {
      const user = await getCurrentUser();
      setInitialRoute(user ? 'Home' : 'Login');
      setCheckingSession(false);
    })();
  }, []);

  if (checkingSession) {
    // Brief splash while we check AsyncStorage for an existing session.
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#B23A4E" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Attendance" component={AttendanceScreen} />
        <Stack.Screen name="LeaveRequests" component={LeaveRequestScreen} />
        <Stack.Screen name="LeaveSummary" component={LeaveSummaryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F3F3',
  },
});
