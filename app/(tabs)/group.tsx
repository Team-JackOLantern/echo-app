import React, {useEffect, useState} from 'react';
import {Text, StyleSheet, View, TouchableOpacity, ScrollView, Modal, TextInput, Alert, Animated, Clipboard} from 'react-native';
import {router, useFocusEffect} from "expo-router";
import AddKeywordModal from "@/components/addKeyword";
import axios from "axios";

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL;
const USER = "ae8fb765";

export type GroupProps = {
    id: number;
    name: string;
    invite_code: string;
    bet_deadline: string;
    member_count: number;
    banned_words: string[];
    most_profanity_users: { username: string; count: number }[];
    least_profanity_users: { username: string; count: number }[];
}

interface Props {
    groups: GroupProps[];
    selectedGroupId: number | null;
    onSelect: (groupId: number) => void;
}

const Group = () => {
    const [groups, setGroups] = useState<GroupProps[]>([]);
    const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
    const [keywords, setKeywords] = useState<string[]>([]);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // 기본값을 'desc'로 변경 (많이 한 순)
    const [showAddKeywordModal, setShowAddKeywordModal] = useState(false);
    const [showUserList, setShowUserList] = useState(false); // 기본값을 false로 변경 (top3만 보이게)
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [inviteCode, setInviteCode] = useState('');

    const selectedGroup = groups[currentGroupIndex] || null;

    // 정렬 순서에 따라 사용자 목록 결정
    const userList = sortOrder === 'desc'
        ? selectedGroup?.most_profanity_users || []
        : selectedGroup?.least_profanity_users || [];

    const top3 = userList.slice(0, 3);
    const [userListAnimation] = useState(new Animated.Value(0));

    // 애니메이션 효과 추가
    useEffect(() => {
        Animated.timing(userListAnimation, {
            toValue: showUserList ? 1 : 0,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [showUserList]);

    const fetchKeywordList = async (groupId: number) => {
        try {
            const response = await axios.get(`${SERVER_URL}/groups/${groupId}/banned-words`, {
                headers: {
                    'user-id': USER,
                },
            });

            // 응답 구조 확인 및 적절한 데이터 추출
            if (response.data && Array.isArray(response.data.banned_words)) {
                setKeywords(response.data.banned_words);
            } else if (Array.isArray(response.data)) {
                setKeywords(response.data);
            } else {
                console.warn('예상치 못한 응답:', response.data);
                setKeywords([]);
            }
        } catch (error) {
            console.error('금지어 목록 불러오기 실패:', error);
            setKeywords([]);
        }
    };

    const handleDeleteKeyword = (keyword: any) => {
        Alert.alert('금지어 제거', '이 금지어를 제거하시겠습니까?', [
            {text: '취소', style: 'cancel'},
            {
                text: '제거',
                onPress: () => setKeywords(keywords.filter((k) => k !== keyword)),
                style: 'destructive',
            },
        ]);
    };

    useEffect(() => {
        if (selectedGroup?.id) {
            fetchKeywordList(selectedGroup.id);
        }
    }, [selectedGroup?.id]);

    // 그룹 참여 함수
    const handleJoinGroup = async () => {
        if (!inviteCode.trim()) {
            Alert.alert('오류', '초대 코드를 입력해주세요.');
            return;
        }

        try {
            const response = await axios.post(`${SERVER_URL}/groups/join`, {
                invite_code: inviteCode.trim()
            }, {
                headers: {
                    'user-id': USER,
                    'Content-Type': 'application/json'
                },
            });

            if (response.status === 200) {
                Alert.alert('성공', '그룹에 성공적으로 참여했습니다!', [
                    {
                        text: '확인',
                        onPress: () => {
                            setShowJoinModal(false);
                            setInviteCode('');
                            console.log('✅ 그룹 참여 성공 - 목록 새로고침');
                            fetchGroups();
                        }
                    }
                ]);
            }
        } catch (error: any) {
            console.error('그룹 참여 실패:', error);

            let errorMessage = '그룹 참여에 실패했습니다.';
            if (error.response?.status === 404) {
                errorMessage = '존재하지 않는 초대 코드입니다.';
            } else if (error.response?.status === 409) {
                errorMessage = '이미 참여한 그룹입니다.';
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }

            Alert.alert('오류', errorMessage);
        }
    };

    // 초대코드 복사 함수
    const handleCopyInviteCode = () => {
        if (selectedGroup?.invite_code) {
            Clipboard.setString(selectedGroup.invite_code);
            Alert.alert('초대코드가 복사되었습니다!', `초대코드: ${selectedGroup.invite_code}`);
        } else {
            Alert.alert('오류', '초대코드를 찾을 수 없습니다.');
        }
    };

    // 그룹 목록 새로고침 함수
    const fetchGroups = async () => {
        try {
            const res = await axios.get(`${SERVER_URL}/groups/my`, {
                headers: {'user-id': USER},
            });

            const groupsData = res.data?.groups || [];

            setGroups(groupsData);

            if (groupsData.length > 0 && currentGroupIndex >= groupsData.length) {
                setCurrentGroupIndex(0);
            }
        } catch (error: any) {
            setGroups([]);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    // 화면이 포커스될 때마다 그룹 목록 새로고침
    useFocusEffect(
        React.useCallback(() => {
            console.log('🔄 화면 포커스 - 그룹 목록 새로고침');
            fetchGroups();
        }, [])
    );

    // 이전/다음 그룹으로 이동
    const goToPreviousGroup = () => {
        setCurrentGroupIndex(prev => prev > 0 ? prev - 1 : groups.length - 1);
    };

    const goToNextGroup = () => {
        setCurrentGroupIndex(prev => prev < groups.length - 1 ? prev + 1 : 0);
    };

    // 그룹이 없을 때 렌더링
    if (!groups || groups.length === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>참여한 그룹이 없습니다</Text>
                    <Text style={styles.emptySubtitle}>그룹을 생성하거나 초대 코드로 참여해보세요</Text>

                    <View style={styles.emptyButtonContainer}>
                        <TouchableOpacity
                            style={styles.emptyCreateButton}
                            onPress={() => router.push("/create")}
                        >
                            <Text style={styles.emptyCreateButtonText}>+ 그룹 생성</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.emptyJoinButton}
                            onPress={() => setShowJoinModal(true)}
                        >
                            <Text style={styles.emptyJoinButtonText}>초대 코드로 참여</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 초대 코드 입력 모달 */}
                <Modal
                    visible={showJoinModal}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowJoinModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>그룹 참여</Text>
                            <Text style={styles.modalSubtitle}>초대 코드를 입력해주세요</Text>

                            <TextInput
                                style={styles.modalInput}
                                placeholder="초대 코드 입력"
                                placeholderTextColor="#999"
                                value={inviteCode}
                                onChangeText={setInviteCode}
                                autoCapitalize="characters"
                                maxLength={10}
                            />

                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.cancelButton]}
                                    onPress={() => {
                                        setShowJoinModal(false);
                                        setInviteCode('');
                                    }}
                                >
                                    <Text style={styles.cancelButtonText}>취소</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.modalButton, styles.confirmButton]}
                                    onPress={handleJoinGroup}
                                >
                                    <Text style={styles.confirmButtonText}>참여</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bounces={true}
            >
                {/* 상단 여백 추가 */}
                <View style={styles.topSpacer} />

                {/* 그룹 헤더 */}
                <View style={styles.groupHeader}>
                    <View style={styles.groupNavigation}>
                        {groups.length > 1 && (
                            <TouchableOpacity style={styles.navButton} onPress={goToPreviousGroup}>
                                <Text style={styles.navButtonText}>‹</Text>
                            </TouchableOpacity>
                        )}

                        <View style={styles.groupInfo}>
                            <Text style={styles.groupName}>{selectedGroup?.name}</Text>
                            <Text style={styles.groupMemberCount}>{selectedGroup?.member_count}명 참여</Text>
                        </View>

                        {groups.length > 1 && (
                            <TouchableOpacity style={styles.navButton} onPress={goToNextGroup}>
                                <Text style={styles.navButtonText}>›</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* 그룹 인디케이터 */}
                    {groups.length > 1 && (
                        <View style={styles.groupIndicator}>
                            {groups.map((_, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.indicatorDot,
                                        index === currentGroupIndex && styles.indicatorDotActive
                                    ]}
                                />
                            ))}
                        </View>
                    )}
                </View>

                {/* 초대 코드 복사 영역 */}
                <TouchableOpacity style={styles.inviteCodeSection} onPress={handleCopyInviteCode}>
                    <Text style={styles.inviteCodeLabel}>초대 코드</Text>
                    <Text style={styles.inviteCodeText}>{selectedGroup?.invite_code}</Text>
                    <Text style={styles.inviteCodeHint}>탭해서 복사하기</Text>
                </TouchableOpacity>

                {/* 액션 버튼들 */}
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={styles.addGroupButton}
                        onPress={() => router.push("/create")}
                    >
                        <Text style={styles.addGroupText}>+ 그룹 생성</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.joinGroupButton}
                        onPress={() => setShowJoinModal(true)}
                    >
                        <Text style={styles.joinGroupText}>초대 코드로 참여</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.sortSection}>
                    <View style={styles.sortButtonContainer}>
                        <TouchableOpacity
                            style={[styles.sortButton, sortOrder === 'asc' ? styles.activeSortButton : styles.inactiveSortButton]}
                            onPress={() => setSortOrder('asc')}>
                            <Text
                                style={[styles.sortButtonText, sortOrder === 'asc' ? styles.activeSortText : styles.inactiveSortText]}>작게
                                한 순</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.sortButton, sortOrder === 'desc' ? styles.activeSortButton : styles.inactiveSortButton]}
                            onPress={() => setSortOrder('desc')}>
                            <Text
                                style={[styles.sortButtonText, sortOrder === 'desc' ? styles.activeSortText : styles.inactiveSortText]}>
                                많이 한 순
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.up}>
                    {/* 순위 표시 영역 */}
                    <View style={styles.podiumContainer}>
                        {/* 2등 */}
                        <View style={styles.secondPlace}>
                            <View style={styles.iconPlaceholder}/>
                            <View style={styles.secondPodium}>
                                <Text style={styles.rankNumber}>2</Text>
                            </View>
                            <Text style={styles.userName}>{top3[1]?.username || '-'}</Text>
                            <Text style={styles.userCount}>{top3[1]?.count ?? 0}회</Text>
                        </View>

                        {/* 1등 */}
                        <View style={styles.firstPlace}>
                            <View style={styles.iconPlaceholder}/>
                            <View style={styles.firstPodium}>
                                <Text style={styles.rankNumber}>1</Text>
                            </View>
                            <Text style={styles.userName}>{top3[0]?.username || '-'}</Text>
                            <Text style={styles.userCount}>{top3[0]?.count ?? 0}회</Text>
                        </View>

                        {/* 3등 */}
                        <View style={styles.thirdPlace}>
                            <View style={styles.iconPlaceholder}/>
                            <View style={styles.thirdPodium}>
                                <Text style={styles.rankNumber}>3</Text>
                            </View>
                            <Text style={styles.userName}>{top3[2]?.username || '-'}</Text>
                            <Text style={styles.userCount}>{top3[2]?.count ?? 0}회</Text>
                        </View>
                    </View>

                    {/* 화살표 */}
                    <TouchableOpacity
                        style={styles.arrowContainer}
                        onPress={() => setShowUserList(prev => !prev)}
                    >
                        <Text style={styles.arrow}>{showUserList ? '⌃' : '⌄'}</Text>
                    </TouchableOpacity>

                    {showUserList && (
                        <Animated.View
                            style={[
                                styles.userListContainer,
                                {
                                    opacity: userListAnimation,
                                    maxHeight: userListAnimation.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0, 400],
                                    }),
                                },
                            ]}
                        >
                            {userList.map((user, index) => (
                                <Animated.View
                                    key={`${user.username}-${index}`}
                                    style={[
                                        styles.userListItem,
                                        {
                                            transform: [
                                                {
                                                    translateY: userListAnimation.interpolate({
                                                        inputRange: [0, 1],
                                                        outputRange: [20, 0],
                                                    }),
                                                },
                                            ],
                                        },
                                    ]}
                                >
                                    <View style={styles.userRankInfo}>
                                        <Text style={styles.userRank}>{index + 1}</Text>
                                        <Text style={styles.userListName}>{user.username}</Text>
                                    </View>
                                    <Text style={styles.userListCount}>{user.count}회</Text>
                                </Animated.View>
                            ))}
                        </Animated.View>
                    )}
                </View>

                <View style={styles.keywordSection}>
                    <View style={styles.keywordHeader}>
                        <Text style={styles.keywordTitle}>금지어 설정</Text>
                        <TouchableOpacity style={styles.addKeywordButton} onPress={() => setShowAddKeywordModal(true)}>
                            <Text style={styles.addKeywordButtonText}>+</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.keywordGrid}>
                        {keywords.map((word, index) => (
                            <Text key={index} style={styles.keywordTag}>{word}</Text>
                        ))}
                    </View>
                </View>

                {/* 하단 여백 추가 */}
                <View style={styles.bottomSpacer} />
            </ScrollView>

            {selectedGroup && (
                <AddKeywordModal
                    visible={showAddKeywordModal}
                    onClose={() => setShowAddKeywordModal(false)}
                    groupId={selectedGroup.id}
                    onSuccess={() => fetchKeywordList(selectedGroup.id)}
                />
            )}

            {/* 초대 코드 입력 모달 */}
            <Modal
                visible={showJoinModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowJoinModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>그룹 참여</Text>
                        <Text style={styles.modalSubtitle}>초대 코드를 입력해주세요</Text>

                        <TextInput
                            style={styles.modalInput}
                            placeholder="초대 코드 입력"
                            placeholderTextColor="#999"
                            value={inviteCode}
                            onChangeText={setInviteCode}
                            autoCapitalize="characters"
                            maxLength={10}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => {
                                    setShowJoinModal(false);
                                    setInviteCode('');
                                }}
                            >
                                <Text style={styles.cancelButtonText}>취소</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButton, styles.confirmButton]}
                                onPress={handleJoinGroup}
                            >
                                <Text style={styles.confirmButtonText}>참여</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 20,
    },
    topSpacer: {
        height: 60,
    },
    bottomSpacer: {
        height: 40,
    },
    // 빈 상태 스타일
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    emptySubtitle: {
        color: '#AAAAAA',
        fontSize: 16,
        marginBottom: 40,
        textAlign: 'center',
    },
    emptyButtonContainer: {
        gap: 15,
        width: '100%',
    },
    emptyCreateButton: {
        backgroundColor: '#FF6B35',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 25,
        alignItems: 'center',
    },
    emptyCreateButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    emptyJoinButton: {
        backgroundColor: 'transparent',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: '#FF6B35',
        alignItems: 'center',
    },
    emptyJoinButtonText: {
        color: '#FF6B35',
        fontSize: 16,
        fontWeight: '600',
    },
    // 그룹 헤더 스타일
    groupHeader: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    groupNavigation: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
    },
    navButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#333333',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 20,
    },
    navButtonText: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: 'bold',
    },
    groupInfo: {
        alignItems: 'center',
        flex: 1,
    },
    groupName: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    groupMemberCount: {
        color: '#AAAAAA',
        fontSize: 14,
    },
    groupIndicator: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    indicatorDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#333333',
    },
    indicatorDotActive: {
        backgroundColor: '#FF6B35',
    },
    // 초대 코드 섹션
    inviteCodeSection: {
        backgroundColor: '#FF6B35',
        marginHorizontal: 20,
        borderRadius: 15,
        paddingVertical: 20,
        paddingHorizontal: 20,
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#FF6B35',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    inviteCodeLabel: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    inviteCodeText: {
        color: '#FFFFFF',
        fontSize: 28,
        fontWeight: 'bold',
        fontFamily: 'monospace',
        letterSpacing: 4,
        marginBottom: 8,
    },
    inviteCodeHint: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 12,
        fontStyle: 'italic',
    },
    // 액션 버튼들
    actionButtons: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 10,
        marginBottom: 20,
    },
    addGroupButton: {
        backgroundColor: 'transparent',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#FF6B35',
        flex: 1,
        alignItems: 'center',
    },
    addGroupText: {
        color: '#FF6B35',
        fontSize: 14,
    },
    joinGroupButton: {
        backgroundColor: '#333333',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        flex: 1,
        alignItems: 'center',
    },
    joinGroupText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    sortSection: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    sortButtonContainer: {
        flexDirection: 'row',
        backgroundColor: '#3F3F42',
        borderRadius: 25,
        padding: 2,
    },
    sortButton: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 23,
        alignItems: 'center',
    },
    activeSortButton: {
        backgroundColor: '#6B6B6B',
    },
    inactiveSortButton: {
        backgroundColor: 'transparent',
    },
    sortButtonText: {
        fontSize: 14,
        fontFamily: 'PretendardRegular',
    },
    activeSortText: {
        color: '#FFFFFF',
    },
    inactiveSortText: {
        color: '#9E9E9E',
    },
    up: {
        backgroundColor: '#2E2E2E',
        marginHorizontal: 20,
        borderRadius: 20,
        paddingTop: 30,
        paddingBottom: 20,
        marginBottom: 20,
        shadowColor: '#FF6B35',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
    },
    podiumContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingHorizontal: 20,
        height: 200,
    },
    firstPlace: {
        alignItems: 'center',
        marginHorizontal: 10,
    },
    secondPlace: {
        alignItems: 'center',
        marginHorizontal: 10,
    },
    thirdPlace: {
        alignItems: 'center',
        marginHorizontal: 10,
    },
    iconPlaceholder: {
        width: 30,
        height: 30,
        backgroundColor: 'transparent',
        marginBottom: 10,
    },
    firstPodium: {
        backgroundColor: '#FF6B35',
        width: 80,
        height: 100,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        shadowColor: '#FF6B35',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    secondPodium: {
        backgroundColor: '#FF8C42',
        width: 70,
        height: 80,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        shadowColor: '#FF8C42',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 6,
    },
    thirdPodium: {
        backgroundColor: '#FF9A56',
        width: 70,
        height: 60,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        shadowColor: '#FF9A56',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 6,
    },
    rankNumber: {
        color: '#FFFFFF',
        fontSize: 32,
        fontFamily: 'PretendardSemiBold',
    },
    userName: {
        color: '#FFFFFF',
        fontSize: 12,
        fontFamily: 'PretendardMedium',
    },
    userCount: {
        color: '#AAAAAA',
        fontSize: 10,
    },
    arrowContainer: {
        alignItems: 'center',
        marginVertical: 15,
    },
    arrow: {
        color: '#AAAAAA',
        fontSize: 20,
    },
    userListContainer: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    userListItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#1E1E1E',
        borderRadius: 8,
        marginBottom: 8,
    },
    userRankInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    userRank: {
        color: '#FF6B35',
        fontSize: 16,
        fontWeight: 'bold',
        width: 20,
    },
    userListName: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    userListCount: {
        color: '#AAAAAA',
        fontSize: 14,
    },
    bettingSection: {
        paddingHorizontal: 20,
    },
    bettingSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    bettingTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontFamily: 'PretendardMedium',
    },
    plusButton: {
        color: '#FF6B35',
        fontSize: 24,
        fontWeight: '300',
    },
    bettingItem: {
        backgroundColor: '#1E1E1E',
        padding: 16,
        borderRadius: 12,
    },
    bettingText: {
        color: '#FFB366',
        fontSize: 14,
        marginBottom: 8,
    },
    timerInfo: {
        alignItems: 'flex-start',
    },
    timerText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'monospace',
    },
    keywordSection: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    keywordHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    keywordTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontFamily: 'PretendardMedium',
    },
    addKeywordButton: {
        backgroundColor: '#FF6B35',
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addKeywordButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    keywordGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    keywordTag: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#FF6B35',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginBottom: 8,
        flexShrink: 0,
        color: '#FF6B35',
        fontSize: 14,
    },
    keywordText: {
        color: '#FF6B35',
        fontSize: 14,
        flexShrink: 1,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#2E2E2E',
        borderRadius: 12,
        padding: 20,
        width: '80%',
        maxWidth: 300,
    },
    modalTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontFamily: 'PretendardMedium',
        textAlign: 'center',
        marginBottom: 20,
    },
    modalSubtitle: {
        color: "#EAE3EE"
    },
    modalInput: {
        backgroundColor: '#1E1E1E',
        color: '#FFFFFF',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#555555',
    },
    confirmButton: {
        backgroundColor: '#FF6B35',
    },
    cancelButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'PretendardMedium',
    },
    confirmButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'PretendardMedium',
    },
});

export default Group;