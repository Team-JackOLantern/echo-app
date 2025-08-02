import React from 'react';
import { View, Text, Animated } from 'react-native';

interface User {
    name: string;
    count: number;
}

interface Props {
    users: User[];
    visible: boolean;
    animation: Animated.Value;
    styles: any;
}

const UserList = ({ users, visible, animation, styles }: Props) => {
    if (!visible) return null;

    return (
        <Animated.View
            style={[
                styles.userListContainer,
                {
                    opacity: animation,
                    maxHeight: animation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 400],
                    }),
                },
            ]}>
            {users.map((user, index) => (
                <Animated.View
                    key={index}
                    style={[
                        styles.userListItem,
                        {
                            transform: [
                                {
                                    translateY: animation.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [20, 0],
                                    }),
                                },
                            ],
                        },
                    ]}>
                    <View style={styles.userRankInfo}>
                        <Text style={styles.userRank}>{index + 1}</Text>
                        <Text style={styles.userListName}>{user.name}</Text>
                    </View>
                    <Text style={styles.userListCount}>{user.count}회</Text>
                </Animated.View>
            ))}
        </Animated.View>
    );
};

export default UserList;