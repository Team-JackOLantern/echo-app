import React from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity } from 'react-native';

interface Props {
    visible: boolean;
    keyword: string;
    onChange: (text: string) => void;
    onCancel: () => void;
    onConfirm: () => void;
    styles: any;
}

const AddKeywordModal = ({ visible, keyword, onChange, onCancel, onConfirm, styles }: Props) => {
    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>금지어 추가</Text>
                    <TextInput
                        style={styles.modalInput}
                        placeholder="금지어를 입력하세요"
                        placeholderTextColor="#AAAAAA"
                        value={keyword}
                        onChangeText={onChange}
                        autoFocus
                    />
                    <View style={styles.modalButtons}>
                        <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={onCancel}>
                            <Text style={styles.cancelButtonText}>취소</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={onConfirm}>
                            <Text style={styles.confirmButtonText}>추가</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default AddKeywordModal;