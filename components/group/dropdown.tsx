import React from 'react';
import { Text, View, TouchableOpacity, Animated } from 'react-native';

interface Props {
    visible: boolean;
    animation: Animated.Value;
    groups: string[];
    selectedGroup: string;
    onSelect: (group: string) => void;
    onClose: () => void;
    styles: any;
}

const GroupDropdown = ({ visible, animation, groups, selectedGroup, onSelect, onClose, styles }: Props) => {
    if (!visible) return null;

    return (
        <Animated.View
            style={[
                styles.dropdownMenu,
                {
                    opacity: animation,
                    transform: [{ scaleY: animation }],
                },
            ]}>
            {groups.map((group, index) => (
                <TouchableOpacity
                    key={index}
                    style={styles.dropdownItem}
                    disabled={group === selectedGroup}
                    onPress={() => {
                        onSelect(group);
                        onClose();
                    }}>
                    <Text style={styles.dropdownItemText}>{group}</Text>
                </TouchableOpacity>
            ))}
        </Animated.View>
    );
};

export default GroupDropdown;