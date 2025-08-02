import {useState} from "react";
import {Alert} from "react-native";
import {createGroup} from "@/api/group/group";
import {router} from "expo-router";

export const useCreateGroup = () => {
    const [name, setName] = useState<string>('');
    const [bet_deadline_date, setBetDeadlineDate] = useState<string>('');
    const [bet_deadline_time, setBetDeadlineTime] = useState<string>('');

    const handleSubmit = async () => {
        if (!name.trim() || !bet_deadline_date.trim() || !bet_deadline_time.trim()) {
            Alert.alert("모든 항목을 입력해주세요.");
            return;
        }

        const group = {name, bet_deadline_date, bet_deadline_time};

        try {
            await createGroup(group);

            Alert.alert('생성 완료', '그룹이 생성되었습니다.', [
                {
                    text: '확인',
                    onPress: () => router.replace('/group'),
                },
            ]);
        } catch {
            Alert.alert("그룹 생성에 실패했습니다.");
        }
    };

    return {
        name, bet_deadline_date, bet_deadline_time, setName, setBetDeadlineDate, setBetDeadlineTime, handleSubmit,
    }
};