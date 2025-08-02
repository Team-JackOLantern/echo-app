import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface Props {
    keywords: string[];
    onDelete: (keyword: string) => void;
    onAddModalOpen: () => void;
    styles: any;
}

const KeywordList = ({ keywords, onDelete, onAddModalOpen, styles }: Props) => {
    return (
        <View style={styles.keywordSection}>
            <View style={styles.keywordHeader}>
                <Text style={styles.keywordTitle}>금지어 설정</Text>
                <TouchableOpacity style={styles.addKeywordButton} onPress={onAddModalOpen}>
                    <Text style={styles.addKeywordButtonText}>+</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.keywordGrid}>
                {keywords.map((keyword, index) => (
                    <TouchableOpacity key={index} style={styles.keywordTag} onLongPress={() => onDelete(keyword)}>
                        <Text style={styles.keywordText}>{keyword}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

export default KeywordList;