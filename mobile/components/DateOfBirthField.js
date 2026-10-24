import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '../theme';

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDate = (value) => {
  if (!value) return new Date();
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export default function DateOfBirthField({ value, onChange, label = 'Date of birth' }) {
  const [showPicker, setShowPicker] = useState(false);
  const maximumDate = new Date();

  if (Platform.OS === 'web') {
    return (
      <View style={{ marginBottom: 14 }}>
        <Text style={{ color: colors.ink, fontWeight: '700', marginBottom: 7 }}>{label}</Text>
        <input
          type="date"
          value={value}
          max={formatDate(maximumDate)}
          autoComplete="bday"
          onChange={(event) => onChange(event.target.value)}
          style={{
            boxSizing: 'border-box',
            width: '100%',
            height: 48,
            padding: '0 14px',
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            backgroundColor: colors.white,
            color: colors.ink,
            fontSize: 16,
          }}
        />
      </View>
    );
  }

  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ color: colors.ink, fontWeight: '700', marginBottom: 7 }}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || 'Select date'}`}
        onPress={() => setShowPicker(true)}
        style={{ height: 48, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white }}
      >
        <Text style={{ color: value ? colors.ink : colors.muted }}>{value || 'Select date'}</Text>
      </Pressable>
      {showPicker ? (
        <DateTimePicker
          value={parseDate(value)}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={maximumDate}
          onChange={(event, selectedDate) => {
            setShowPicker(Platform.OS === 'ios' && event.type !== 'dismissed');
            if (event.type !== 'dismissed' && selectedDate) onChange(formatDate(selectedDate));
          }}
        />
      ) : null}
    </View>
  );
}
