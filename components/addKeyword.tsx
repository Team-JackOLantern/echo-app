import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import axios from 'axios';

const USER_ID = 'ae8fb765';

interface AddKeywordModalProps {
    visible: boolean;
    onClose: () => void;
    groupId: number;
    onSuccess?: () => void;
}

const AddKeywordModal = ({ visible, onClose, groupId, onSuccess }: AddKeywordModalProps) => {
    const [keyword, setKeyword] = useState('');

    const handleAdd = async () => {
        if (!keyword.trim()) {
            Alert.alert('금지어를 입력해주세요.');
            return;
        }

        try {
            await axios.post(
                `${process.env.EXPO_PUBLIC_SERVER_URL}/groups/banned-words`,
                {
                    group_id: groupId,
                    word: keyword.trim(),
                },
                {
                    headers: {
                        'user-id': USER_ID,
                    },
                }
            );

            onSuccess?.();
            setKeyword('');
            onClose();
        } catch (e) {
            console.error('금지어 추가 실패:', e);
            Alert.alert('추가 실패', '네트워크 또는 권한 문제일 수 있습니다.');
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    <Text style={styles.title}>금지어 추가</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="금지어 입력"
                        value={keyword}
                        onChangeText={setKeyword}
                        autoFocus
                        placeholderTextColor="#aaa"
                    />
                    <View style={styles.buttonRow}>
                        <TouchableOpacity style={styles.cancel} onPress={onClose}>
                            <Text style={styles.cancelText}>취소</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.add} onPress={handleAdd}>
                            <Text style={styles.addText}>추가</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modal: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        width: '80%',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    input: {
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        paddingVertical: 8,
        marginBottom: 20,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    cancel: {
        marginRight: 10,
    },
    cancelText: {
        color: '#666',
    },
    add: {},
    addText: {
        color: '#007BFF',
    },
});

export default AddKeywordModal;