import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import axios from 'axios';

interface Group {
    id: number;
    name: string;
    bet_deadline: string; // "YYYY-MM-DD HH:mm:ss"
}

interface Props {
    group: Group;
    styles: any;
}

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL;
const USER = "ae8fb765";

const GroupDown = ({ group, styles }: Props) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const deadline = new Date(group.bet_deadline.replace(' ', 'T'));

        const updateCountdown = () => {
            const now = new Date();
            const diff = deadline.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeLeft('00:00:00');
                return;
            }

            const hours = String(Math.floor(diff / 1000 / 60 / 60)).padStart(2, '0');
            const minutes = String(Math.floor((diff / 1000 / 60) % 60)).padStart(2, '0');
            const seconds = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');

            setTimeLeft(`${hours}:${minutes}:${seconds}`);
        };

        updateCountdown();

        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, [group.bet_deadline]);

    return (
        <View style={styles.bettingItem}>
            <Text style={styles.bettingText}>{group.name}</Text>
            <View style={styles.timerInfo}>
                <Text style={styles.timerText}>{timeLeft}</Text>
            </View>
        </View>
    );
};

export const GroupDownList = ({ styles }: { styles: any }) => {
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const response = await axios.get(`${SERVER_URL}/groups/my`, {
                    headers: {
                        'user-id': USER
                    }
                });
                setGroups(response.data.groups);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchGroups();
    }, []);

    if (loading) {
        return <ActivityIndicator size="large" color="#FF6B35" />;
    }

    return (
        <View style={styles.bettingSection}>
            <View style={styles.bettingSectionHeader}>
                <Text style={styles.bettingTitle}>진행중인 내기</Text>
            </View>
            {groups.map((group) => (
                <GroupDown key={group.id} group={group} styles={styles} />
            ))}
        </View>
    );
};

export default GroupDown;