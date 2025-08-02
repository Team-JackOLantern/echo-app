import React from 'react';
import { View, Text } from 'react-native';

interface User {
    name: string;
    count: number;
}

interface Props {
    sortedUsers: User[];
    styles: any;
}

const Podium = ({ sortedUsers, styles }: Props) => {
    return (
        <View style={styles.podiumContainer}>
            <View style={styles.secondPlace}>
                <View style={styles.iconPlaceholder} />
                <View style={styles.secondPodium}>
                    <Text style={styles.rankNumber}>2</Text>
                </View>
                <Text style={styles.userName}>{sortedUsers[1]?.name}</Text>
                <Text style={styles.userCount}>{sortedUsers[1]?.count}회</Text>
            </View>

            <View style={styles.firstPlace}>
                <View style={styles.iconPlaceholder} />
                <View style={styles.firstPodium}>
                    <Text style={styles.rankNumber}>1</Text>
                </View>
                <Text style={styles.userName}>{sortedUsers[0]?.name}</Text>
                <Text style={styles.userCount}>{sortedUsers[0]?.count}회</Text>
            </View>

            <View style={styles.thirdPlace}>
                <View style={styles.iconPlaceholder} />
                <View style={styles.thirdPodium}>
                    <Text style={styles.rankNumber}>3</Text>
                </View>
                <Text style={styles.userName}>{sortedUsers[2]?.name}</Text>
                <Text style={styles.userCount}>{sortedUsers[2]?.count}회</Text>
            </View>
        </View>
    );
};

export default Podium;