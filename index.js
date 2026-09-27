/**
 * @format
 */

import 'react-native-get-random-values';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { runAttendanceBackgroundTask } from './src/services/attendanceBackgroundService';
import 'react-native-gesture-handler';

AppRegistry.registerComponent(appName, () => App);
AppRegistry.registerHeadlessTask('BackgroundFetch', () => async ({ taskId }) => {
	await runAttendanceBackgroundTask(taskId);
});
