const listeners = new Set();

export function subscribeToAttendanceMetrics(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifyAttendanceMetricsChanged(userId) {
  listeners.forEach((listener) => listener(userId));
}