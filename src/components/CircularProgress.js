import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

/**
 * Simple circular progress ring, mimicking the "15%" attendance
 * ring on the reference screenshot.
 *
 * Usage:
 *   <CircularProgress
 *     percentage={15}
 *     size={110}
 *     strokeWidth={8}
 *     color="#C0304A"
 *     trackColor="#EDEAEA"
 *   />
 */
export default function CircularProgress({
  percentage = 0,
  size = 110,
  strokeWidth = 8,
  color = '#C0304A',
  trackColor = '#ECE7E7',
  label,
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percentage));
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference}, ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          rotation="-90"
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>
      <View style={StyleSheet.absoluteFillObject}>
        <View style={styles.centerContent}>
          <Text style={styles.percentText}>{clamped}%</Text>
          {label ? <Text style={styles.label}>{label}</Text> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3A3A3A',
  },
  label: {
    fontSize: 11,
    color: '#8A8A8A',
    marginTop: 2,
  },
});
