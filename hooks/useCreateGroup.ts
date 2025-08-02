import { useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import axios from 'axios';

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL;
const USER = "ae8fb765";

export const useCreateGroup = () => {
    const [name, setName] = useState('');
    const [bet_deadline_date, setBetDeadlineDate] = useState('');
    const [bet_deadline_time, setBetDeadlineTime] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        // 입력 값 검증
        if (!name.trim()) {
            Alert.alert('오류', '그룹 이름을 입력해주세요.');
            return;
        }

        if (!bet_deadline_date || !bet_deadline_time) {
            Alert.alert('오류', '마감 날짜와 시간을 모두 선택해주세요.');
            return;
        }

        setIsLoading(true);

        try {
            // 1. 그룹 생성
            console.log('🏗️ 그룹 생성 요청 시작');
            const createResponse = await axios.post(`${SERVER_URL}/groups/create`, {
                name: name.trim(),
                bet_deadline: `${bet_deadline_date} ${bet_deadline_time}:00`
            }, {
                headers: {
                    'user-id': USER,
                    'Content-Type': 'application/json'
                }
            });

            console.log('✅ 그룹 생성 성공:', createResponse.data);

            // 2. 생성된 그룹에 자동 참가
            const createdGroup = createResponse.data;
            if (createdGroup.invite_code) {
                console.log('🔗 자동 참가 시작, 초대코드:', createdGroup.invite_code);

                try {
                    const joinResponse = await axios.post(`${SERVER_URL}/groups/join`, {
                        invite_code: createdGroup.invite_code
                    }, {
                        headers: {
                            'user-id': USER,
                            'Content-Type': 'application/json'
                        }
                    });

                    console.log('✅ 자동 참가 성공:', joinResponse.data);
                } catch (joinError) {
                    console.warn('⚠️ 자동 참가 실패 (그룹은 생성됨):', joinError);
                    // 자동 참가 실패해도 그룹은 생성되었으므로 계속 진행
                }
            }

            // 3. 성공 알림 및 페이지 이동
            Alert.alert(
                '그룹 생성 완료!',
                `"${name}" 그룹이 성공적으로 생성되었습니다.`,
                [
                    {
                        text: '확인',
                        onPress: () => {
                            // 그룹 페이지로 이동하면서 새로고침 트리거
                            router.replace({
                                pathname: "/group",
                                params: { refresh: Date.now().toString() }
                            });
                        }
                    }
                ]
            );

        } catch (error: any) {
            console.error('❌ 그룹 생성 실패:', error);

            let errorMessage = '그룹 생성에 실패했습니다.';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.status === 400) {
                errorMessage = '입력 정보를 확인해주세요.';
            } else if (error.response?.status === 409) {
                errorMessage = '이미 존재하는 그룹 이름입니다.';
            }

            Alert.alert('오류', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        name,
        setName,
        bet_deadline_date,
        bet_deadline_time,
        setBetDeadlineDate,
        setBetDeadlineTime,
        handleSubmit,
        isLoading
    };
};