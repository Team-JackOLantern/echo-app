import React from 'react';
import { View, Text } from 'react-native';

interface Props {
    styles: any;
}

const BettingSection = ({ styles }: Props) => {
    return (
        <View style={styles.bettingSection}>
            <View style={styles.bettingSectionHeader}>
                <Text style={styles.bettingTitle}>진행중인 내기</Text>
                <Text style={styles.plusButton}>+</Text>
            </View>

            <View style={styles.bettingItem}>
                <Text style={styles.bettingText}>제일 많이 한 사람이 아이스크림 사기</Text>
                <View style={styles.timerInfo}>
                    <Text style={styles.timerText}>23:45:12</Text>
                </View>
            </View>
        </View>
    );
};

export default BettingSection;