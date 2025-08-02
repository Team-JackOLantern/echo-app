import { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Platform, Keyboard } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useCreateGroup } from '@/hooks/useCreateGroup';

const Create = () => {
    const {
        name,
        setName,
        bet_deadline_date,
        bet_deadline_time,
        setBetDeadlineDate,
        setBetDeadlineTime,
        handleSubmit,
    } = useCreateGroup();

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    const openDatePicker = () => {
        Keyboard.dismiss();
        setShowDatePicker(true);
    };

    const openTimePicker = () => {
        Keyboard.dismiss();
        setShowTimePicker(true);
    };

    const handleDateChange = (_: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            const dateStr = selectedDate.toISOString().split('T')[0];
            setBetDeadlineDate(dateStr);
        }
    };

    const handleTimeChange = (_: any, selectedTime?: Date) => {
        setShowTimePicker(false);
        if (selectedTime) {
            const timeStr = selectedTime.toTimeString().split(':').slice(0, 2).join(':');
            setBetDeadlineTime(timeStr);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#121212', paddingHorizontal: 24, paddingTop: 60 }}>
            <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 24 }}>
                <Text style={{ color: '#FF6B35', fontSize: 16, fontWeight: '600' }}>{'< 뒤로가기'}</Text>
            </TouchableOpacity>

            <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '700', marginBottom: 32 }}>
                그룹 생성
            </Text>

            <Text style={{ color: '#AAAAAA', marginBottom: 8 }}>그룹 이름</Text>
            <TextInput
                placeholder="예: 욕설 감지 챌린지"
                placeholderTextColor="#555"
                value={name}
                onChangeText={setName}
                style={{
                    backgroundColor: '#1E1E1E',
                    color: '#FFFFFF',
                    padding: 14,
                    borderRadius: 12,
                    marginBottom: 24,
                }}
            />

            <Text style={{ color: '#AAAAAA', marginBottom: 8 }}>마감 날짜</Text>
            <TouchableOpacity
                style={{
                    backgroundColor: '#1E1E1E',
                    padding: 14,
                    borderRadius: 12,
                    marginBottom: 24,
                }}
                onPress={openDatePicker}
            >
                <Text style={{ color: bet_deadline_date ? '#FFFFFF' : '#555' }}>
                    {bet_deadline_date || '날짜를 선택하세요'}
                </Text>
            </TouchableOpacity>
            {showDatePicker && (
                <DateTimePicker
                    mode="date"
                    value={new Date()}
                    onChange={handleDateChange}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                />
            )}

            <Text style={{ color: '#AAAAAA', marginBottom: 8 }}>마감 시간</Text>
            <TouchableOpacity
                style={{
                    backgroundColor: '#1E1E1E',
                    padding: 14,
                    borderRadius: 12,
                    marginBottom: 40,
                }}
                onPress={openTimePicker}
            >
                <Text style={{ color: bet_deadline_time ? '#FFFFFF' : '#555' }}>
                    {bet_deadline_time || '시간을 선택하세요'}
                </Text>
            </TouchableOpacity>
            {showTimePicker && (
                <DateTimePicker
                    mode="time"
                    value={new Date()}
                    onChange={handleTimeChange}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                />
            )}

            <TouchableOpacity
                onPress={handleSubmit}
                style={{
                    backgroundColor: '#FF6B35',
                    paddingVertical: 14,
                    borderRadius: 12,
                    alignItems: 'center',
                }}
            >
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>그룹 생성하기</Text>
            </TouchableOpacity>
        </View>
    );
};

export default Create;