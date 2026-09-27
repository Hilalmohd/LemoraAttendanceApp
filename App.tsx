import React, { useEffect } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { startAttendanceBackgroundProcessing } from './src/services/attendanceBackgroundService';

export default function App() {
  useEffect(() => {
    startAttendanceBackgroundProcessing();
  }, []);

  return <AppNavigator />;
}
