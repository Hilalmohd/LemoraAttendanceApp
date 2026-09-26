import React, { useState } from 'react';
import {
    Alert,
    Modal,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { getCurrentUser } from '../services/authService';
import { LEAVE_TYPES, submitLeaveRequest } from '../services/leaveService';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function dateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function parseDate(value) {
    if (!value) return new Date();
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
}

function displayDate(value) {
    if (!value) return 'Select date';
    return parseDate(value).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export default function LeaveRequestScreen({ navigation }) {
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [leaveType, setLeaveType] = useState('');
    const [reason, setReason] = useState('');
    const [errors, setErrors] = useState({});
    const [activeDateField, setActiveDateField] = useState(null);
    const [calendarMonth, setCalendarMonth] = useState(new Date());
    const [isSubmitting, setIsSubmitting] = useState(false);

    const openDatePicker = (field) => {
        const selectedDate = field === 'fromDate' ? fromDate : toDate;
        setCalendarMonth(selectedDate ? parseDate(selectedDate) : new Date());
        setActiveDateField(field);
    };

    const chooseDate = (day) => {
        const selectedDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
        const key = dateKey(selectedDate);
        if (activeDateField === 'fromDate') {
            setFromDate(key);
            if (toDate && key > toDate) setToDate('');
            setErrors((current) => ({ ...current, fromDate: '', toDate: '' }));
        } else {
            setToDate(key);
            setErrors((current) => ({ ...current, toDate: '' }));
        }
        setActiveDateField(null);
    };

    const handleApply = async () => {
        const nextErrors = {};
        if (!fromDate) nextErrors.fromDate = 'Choose a start date.';
        if (!toDate) nextErrors.toDate = 'Choose an end date.';
        else if (fromDate && toDate < fromDate) nextErrors.toDate = 'End date must be on or after the start date.';
        if (!leaveType) nextErrors.leaveType = 'Choose a leave type.';
        // if (!reason.trim()) nextErrors.reason = 'Enter a reason for your leave.';
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length) return;

        setIsSubmitting(true);
        try {
            const user = await getCurrentUser();
            const result = await submitLeaveRequest(user?.userId, {
                fromDate,
                toDate,
                leaveType,
                reason: reason.trim(),
            });
            if (!result.success) {
                Alert.alert('Unable to apply', result.error);
                return;
            }
            Alert.alert('Request submitted', 'Leave request submitted successfully.', [
                { text: 'View summary', onPress: () => navigation.navigate('LeaveSummary') },
            ]);
        } catch (error) {
            Alert.alert('Unable to apply', 'Your leave request could not be saved. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setFromDate('');
        setToDate('');
        setLeaveType('');
        setReason('');
        setErrors({});
        navigation?.goBack?.();
    };

    const monthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
    const leadingBlanks = monthStart.getDay();
    const calendarCells = [...Array(leadingBlanks).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#B23A4E" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.backButton} accessibilityLabel="Go back">
                    <Text style={styles.backText}>‹</Text>
                </TouchableOpacity>
                <View><Text style={styles.title}>Leave Request</Text><Text style={styles.subtitle}>Share your time away</Text></View>
            </View>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <Text style={styles.sectionEyebrow}>REQUEST DETAILS</Text>
                <View style={styles.dateRow}>
                    <DateField label="From Date" value={fromDate} error={errors.fromDate} onPress={() => openDatePicker('fromDate')} />
                    <DateField label="To Date" value={toDate} error={errors.toDate} onPress={() => openDatePicker('toDate')} />
                </View>
                <Text style={styles.label}>Type of Leave</Text>
                <View style={[styles.pickerWrap, errors.leaveType && styles.invalidField]}>
                    <Picker selectedValue={leaveType} onValueChange={(value) => { setLeaveType(value); setErrors((current) => ({ ...current, leaveType: '' })); }} style={styles.picker}>
                        <Picker.Item label="Select leave type" value="" />
                        {LEAVE_TYPES.map((type) => <Picker.Item key={type} label={type} value={type} />)}
                    </Picker>
                </View>
                {errors.leaveType ? <Text style={styles.errorText}>{errors.leaveType}</Text> : null}
                <Text style={styles.label}>Reason</Text>
                <TextInput
                    value={reason}
                    onChangeText={(value) => { setReason(value); setErrors((current) => ({ ...current, reason: '' })); }}
                    style={[styles.reasonInput, errors.reason && styles.invalidField]}
                    placeholder="Tell us why you need time away"
                    placeholderTextColor="#999"
                    multiline
                    textAlignVertical="top"
                    maxLength={500}
                />
                <View style={styles.reasonFooter}>
                    {errors.reason ? <Text style={styles.errorText}>{errors.reason}</Text> : <Text style={styles.helperText}>A short note helps your manager review the request.</Text>}
                    <Text style={styles.characterCount}>{reason.length}/500</Text>
                </View>
                <View style={styles.actions}>
                    <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} disabled={isSubmitting}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.applyButton, isSubmitting && styles.disabledButton]} onPress={handleApply} disabled={isSubmitting}>
                        <Text style={styles.applyText}>{isSubmitting ? 'Submitting...' : 'Apply'}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <Modal visible={Boolean(activeDateField)} transparent animationType="fade" onRequestClose={() => setActiveDateField(null)}>
                <View style={styles.modalBackdrop}>
                    <View style={styles.calendar}>
                        <View style={styles.calendarHeading}>
                            <TouchableOpacity onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))} style={styles.monthArrow}><Text style={styles.arrowText}>‹</Text></TouchableOpacity>
                            <Text style={styles.monthTitle}>{MONTHS[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}</Text>
                            <TouchableOpacity onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))} style={styles.monthArrow}><Text style={styles.arrowText}>›</Text></TouchableOpacity>
                        </View>
                        <View style={styles.calendarGrid}>
                            {WEEKDAYS.map((day, index) => <Text key={`${day}-${index}`} style={styles.weekday}>{day}</Text>)}
                            {calendarCells.map((day, index) => {
                                const key = day ? dateKey(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day)) : '';
                                const isBeforeStart = activeDateField === 'toDate' && fromDate && key < fromDate;
                                const isSelected = key && key === (activeDateField === 'fromDate' ? fromDate : toDate);
                                return <TouchableOpacity key={`${day || 'blank'}-${index}`} style={[styles.dayCell, isSelected && styles.selectedDay]} disabled={!day || isBeforeStart} onPress={() => chooseDate(day)}>
                                    {day ? <Text style={[styles.dayText, isSelected && styles.selectedDayText, isBeforeStart && styles.disabledDayText]}>{day}</Text> : null}
                                </TouchableOpacity>;
                            })}
                        </View>
                        <TouchableOpacity style={styles.calendarCancel} onPress={() => setActiveDateField(null)}><Text style={styles.calendarCancelText}>Close</Text></TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

function DateField({ label, value, error, onPress }) {
    return <View style={styles.dateField}>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity onPress={onPress} style={[styles.dateButton, error && styles.invalidField]} accessibilityRole="button">
            <Text style={[styles.dateValue, !value && styles.placeholder]}>{displayDate(value)}</Text>
            <Text style={styles.calendarIcon}>▦</Text>
        </TouchableOpacity>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>;
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#B23A4E' },
    header: { backgroundColor: '#B23A4E', padding: 18, flexDirection: 'row', alignItems: 'center' },
    backButton: { width: 36, height: 36, justifyContent: 'center', marginRight: 4 },
    backText: { color: '#FFF', fontSize: 36, lineHeight: 36, fontWeight: '300' },
    title: { color: '#FFF', fontSize: 20, fontWeight: '700' },
    subtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 3 },
    content: { flexGrow: 1, backgroundColor: '#F5F3F3', padding: 18, paddingBottom: 30 },
    sectionEyebrow: { color: '#898282', fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 20 },
    dateRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    dateField: { flex: 1 },
    label: { color: '#514B4B', fontSize: 13, fontWeight: '600', marginBottom: 8 },
    dateButton: { minHeight: 54, paddingHorizontal: 12, backgroundColor: '#FFF', borderRadius: 10, borderWidth: 1, borderColor: '#E8E2E2', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    dateValue: { color: '#332F2F', fontSize: 12, flexShrink: 1 },
    placeholder: { color: '#969090' },
    calendarIcon: { color: '#B23A4E', fontSize: 18, marginLeft: 5 },
    pickerWrap: { backgroundColor: '#FFF', borderRadius: 10, borderWidth: 1, borderColor: '#E8E2E2', overflow: 'hidden', marginBottom: 4 },
    picker: { height: 54 },
    reasonInput: { minHeight: 138, backgroundColor: '#FFF', borderRadius: 10, borderWidth: 1, borderColor: '#E8E2E2', padding: 14, fontSize: 14, color: '#332F2F' },
    reasonFooter: { minHeight: 28, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    helperText: { color: '#898282', fontSize: 11, flex: 1 },
    characterCount: { color: '#989090', fontSize: 11, marginLeft: 8 },
    errorText: { color: '#B42335', fontSize: 11, marginTop: 5 },
    invalidField: { borderColor: '#C94755' },
    actions: { flexDirection: 'row', gap: 12, marginTop: 'auto', paddingTop: 26 },
    cancelButton: { flex: 1, height: 52, borderRadius: 10, borderWidth: 1, borderColor: '#B23A4E', alignItems: 'center', justifyContent: 'center' },
    cancelText: { color: '#B23A4E', fontSize: 15, fontWeight: '700' },
    applyButton: { flex: 1, height: 52, borderRadius: 10, backgroundColor: '#B23A4E', alignItems: 'center', justifyContent: 'center' },
    disabledButton: { opacity: 0.65 },
    applyText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(28, 20, 20, 0.48)', justifyContent: 'center', padding: 22 },
    calendar: { backgroundColor: '#FFF', borderRadius: 16, padding: 18 },
    calendarHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
    monthArrow: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    arrowText: { color: '#B23A4E', fontSize: 28 },
    monthTitle: { color: '#332F2F', fontSize: 16, fontWeight: '700' },
    calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    weekday: { width: '14.285%', textAlign: 'center', color: '#8C8585', fontSize: 11, fontWeight: '700', paddingVertical: 8 },
    dayCell: { width: '14.285%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
    selectedDay: { backgroundColor: '#B23A4E', borderRadius: 20 },
    dayText: { color: '#332F2F', fontSize: 14 },
    selectedDayText: { color: '#FFF', fontWeight: '700' },
    disabledDayText: { color: '#C8C2C2' },
    calendarCancel: { alignSelf: 'flex-end', paddingHorizontal: 10, paddingVertical: 8, marginTop: 8 },
    calendarCancelText: { color: '#B23A4E', fontWeight: '700' },
});