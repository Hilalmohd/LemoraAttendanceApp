import { AppState } from 'react-native';
import { getCurrentUser } from './authService';
import { processMissedAttendanceDays } from './attendanceAbsenceService';

let initialized = false;
let appStateSubscription;
let backgroundFetchModule;
let backgroundFetchModuleChecked = false;

function getBackgroundFetchModule() {
  if (backgroundFetchModuleChecked) return backgroundFetchModule;
  backgroundFetchModuleChecked = true;
  try {
    backgroundFetchModule = require('react-native-background-fetch').default;
  } catch (error) {
    backgroundFetchModule = null;
  }
  return backgroundFetchModule;
}

async function processForCurrentUser() {
  const user = await getCurrentUser();
  if (user?.userId) await processMissedAttendanceDays(user.userId);
}

export async function startAttendanceBackgroundProcessing() {
  if (initialized) return;
  initialized = true;
  processForCurrentUser().catch(() => {});

  appStateSubscription = AppState.addEventListener('change', (state) => {
    if (state === 'active') processForCurrentUser().catch(() => {});
  });

  const BackgroundFetch = getBackgroundFetchModule();
  if (!BackgroundFetch) return;

  try {
    await BackgroundFetch.configure({
      minimumFetchInterval: 1440,
      stopOnTerminate: false,
      startOnBoot: true,
      enableHeadless: true,
    }, async (taskId) => {
      try {
        await processForCurrentUser();
      } finally {
        BackgroundFetch.finish(taskId);
      }
    }, () => {});
  } catch (error) {
    initialized = false;
  }
}

export async function runAttendanceBackgroundTask(taskId) {
  const BackgroundFetch = getBackgroundFetchModule();
  try {
    await processForCurrentUser();
  } finally {
    BackgroundFetch?.finish(taskId);
  }
}

export function stopAttendanceBackgroundProcessing() {
  appStateSubscription?.remove();
  appStateSubscription = null;
}