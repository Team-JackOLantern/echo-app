import React, { useState } from 'react';
import { Text, StyleSheet, View, TouchableOpacity, ScrollView, Modal, TextInput, Alert, Animated } from 'react-native';

const Group = () => {
	const [selectedGroup, setSelectedGroup] = useState('책오렌탄');
	const [showGroupDropdown, setShowGroupDropdown] = useState(false);
	const [showUserList, setShowUserList] = useState(false);
	const [sortOrder, setSortOrder] = useState('asc'); // 'asc' = 작게 한 순, 'desc' = 많이 한 순
	const [showAddKeywordModal, setShowAddKeywordModal] = useState(false);
	const [newKeyword, setNewKeyword] = useState('');
	const [keywords, setKeywords] = useState([
		'tlqkf',
		'qudtls',
		'wlfkf',
		'whwrkkxek',
		'대충',
		'욕',
		'대충...',
		'욕설......',
		'마인',
		'축구',
		'오열',
		'대충웃음웃음웃음',
	]);
	const [userListAnimation] = useState(new Animated.Value(0));
	const [dropdownAnimation] = useState(new Animated.Value(0));

	const groups = ['책오렌탄', '구상한 그룹', '그룹A'];
	const users = [
		{ name: '김철수', count: 12 },
		{ name: '이영희', count: 8 },
		{ name: '박민수', count: 15 },
		{ name: '정수정', count: 3 },
		{ name: '홍길동', count: 20 },
	];

	const sortedUsers = [...users].sort((a, b) => (sortOrder === 'asc' ? a.count - b.count : b.count - a.count));

	const handleAddKeyword = () => {
		if (newKeyword.trim()) {
			setKeywords([...keywords, newKeyword.trim()]);
			setNewKeyword('');
			setShowAddKeywordModal(false);
		}
	};

	const handleDeleteKeyword = (keyword: any) => {
		Alert.alert('금지어 제거', '이 금지어를 제거하시겠습니까?', [
			{ text: '취소', style: 'cancel' },
			{
				text: '제거',
				onPress: () => setKeywords(keywords.filter((k) => k !== keyword)),
				style: 'destructive',
			},
		]);
	};

	const toggleUserList = () => {
		if (showUserList) {
			Animated.timing(userListAnimation, {
				toValue: 0,
				duration: 300,
				useNativeDriver: false,
			}).start(() => setShowUserList(false));
		} else {
			setShowUserList(true);
			Animated.timing(userListAnimation, {
				toValue: 1,
				duration: 300,
				useNativeDriver: false,
			}).start();
		}
	};

	const toggleGroupDropdown = () => {
		if (showGroupDropdown) {
			Animated.timing(dropdownAnimation, {
				toValue: 0,
				duration: 200,
				useNativeDriver: false,
			}).start(() => setShowGroupDropdown(false));
		} else {
			setShowGroupDropdown(true);
			Animated.timing(dropdownAnimation, {
				toValue: 1,
				duration: 200,
				useNativeDriver: false,
			}).start();
		}
	};

	return (
		<View style={styles.container}>
			<ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
				{/* 상단 그룹 선택 및 추가 */}
				<View style={styles.topSection}>
					<View style={styles.groupSection}>
						<TouchableOpacity style={styles.groupDropdown} onPress={toggleGroupDropdown}>
							<Text style={styles.groupDropdownText}>{selectedGroup}</Text>
							<Text style={styles.dropdownArrow}>⌄</Text>
						</TouchableOpacity>

						{showGroupDropdown && (
							<Animated.View
								style={[
									styles.dropdownMenu,
									{
										opacity: dropdownAnimation,
										transform: [
											{
												scaleY: dropdownAnimation,
											},
										],
									},
								]}>
								{groups.map((group, index) => (
									<TouchableOpacity
										key={index}
										style={styles.dropdownItem}
										onPress={() => {
											setSelectedGroup(group);
											toggleGroupDropdown();
										}}>
										<Text style={styles.dropdownItemText}>{group}</Text>
									</TouchableOpacity>
								))}
							</Animated.View>
						)}
					</View>

					<TouchableOpacity style={styles.addGroupButton}>
						<Text style={styles.addGroupText}>+ 그룹 추가</Text>
					</TouchableOpacity>
				</View>

				{/* 순위 정렬 버튼 */}
				<View style={styles.sortSection}>
					<View style={styles.sortButtonContainer}>
						<TouchableOpacity
							style={[styles.sortButton, sortOrder === 'asc' ? styles.activeSortButton : styles.inactiveSortButton]}
							onPress={() => setSortOrder('asc')}>
							<Text style={[styles.sortButtonText, sortOrder === 'asc' ? styles.activeSortText : styles.inactiveSortText]}>작게 한 순</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[styles.sortButton, sortOrder === 'desc' ? styles.activeSortButton : styles.inactiveSortButton]}
							onPress={() => setSortOrder('desc')}>
							<Text style={[styles.sortButtonText, sortOrder === 'desc' ? styles.activeSortText : styles.inactiveSortText]}>
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
							<View style={styles.iconPlaceholder} />
							<View style={styles.secondPodium}>
								<Text style={styles.rankNumber}>2</Text>
							</View>
							<Text style={styles.userName}>{sortedUsers[1]?.name}</Text>
							<Text style={styles.userCount}>{sortedUsers[1]?.count}회</Text>
						</View>

						{/* 1등 */}
						<View style={styles.firstPlace}>
							<View style={styles.iconPlaceholder} />
							<View style={styles.firstPodium}>
								<Text style={styles.rankNumber}>1</Text>
							</View>
							<Text style={styles.userName}>{sortedUsers[0]?.name}</Text>
							<Text style={styles.userCount}>{sortedUsers[0]?.count}회</Text>
						</View>

						{/* 3등 */}
						<View style={styles.thirdPlace}>
							<View style={styles.iconPlaceholder} />
							<View style={styles.thirdPodium}>
								<Text style={styles.rankNumber}>3</Text>
							</View>
							<Text style={styles.userName}>{sortedUsers[2]?.name}</Text>
							<Text style={styles.userCount}>{sortedUsers[2]?.count}회</Text>
						</View>
					</View>

					{/* 화살표 */}
					<TouchableOpacity style={styles.arrowContainer} onPress={toggleUserList}>
						<Text style={styles.arrow}>{showUserList ? '⌃' : '⌄'}</Text>
					</TouchableOpacity>

					{/* 유저 리스트 */}
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
							]}>
							{sortedUsers.map((user, index) => (
								<Animated.View
									key={index}
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
									]}>
									<View style={styles.userRankInfo}>
										<Text style={styles.userRank}>{index + 1}</Text>
										<Text style={styles.userListName}>{user.name}</Text>
									</View>
									<Text style={styles.userListCount}>{user.count}회</Text>
								</Animated.View>
							))}
						</Animated.View>
					)}

					{/* 진행중인 내기 섹션 */}
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
				</View>

				{/* 금지어 설정 섹션 */}
				<View style={styles.keywordSection}>
					<View style={styles.keywordHeader}>
						<Text style={styles.keywordTitle}>금지어 설정</Text>
						<TouchableOpacity style={styles.addKeywordButton} onPress={() => setShowAddKeywordModal(true)}>
							<Text style={styles.addKeywordButtonText}>+</Text>
						</TouchableOpacity>
					</View>

					<View style={styles.keywordGrid}>
						{keywords.map((keyword, index) => (
							<TouchableOpacity key={index} style={styles.keywordTag} onLongPress={() => handleDeleteKeyword(keyword)}>
								<Text style={styles.keywordText}>{keyword}</Text>
							</TouchableOpacity>
						))}
					</View>
				</View>
			</ScrollView>

			{/* 금지어 추가 모달 */}
			<Modal visible={showAddKeywordModal} transparent={true} animationType="fade">
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<Text style={styles.modalTitle}>금지어 추가</Text>
						<TextInput
							style={styles.modalInput}
							placeholder="금지어를 입력하세요"
							placeholderTextColor="#AAAAAA"
							value={newKeyword}
							onChangeText={setNewKeyword}
							autoFocus={true}
						/>
						<View style={styles.modalButtons}>
							<TouchableOpacity
								style={[styles.modalButton, styles.cancelButton]}
								onPress={() => {
									setShowAddKeywordModal(false);
									setNewKeyword('');
								}}>
								<Text style={styles.cancelButtonText}>취소</Text>
							</TouchableOpacity>
							<TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={handleAddKeyword}>
								<Text style={styles.confirmButtonText}>추가</Text>
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
	topSection: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 20,
		paddingTop: 60,
		paddingBottom: 20,
	},
	groupSection: {
		position: 'relative',
		zIndex: 10,
	},
	groupDropdown: {
		backgroundColor: '#FF6B35',
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 20,
		gap: 8,
	},
	groupDropdownText: {
		color: '#FFFFFF',
		fontSize: 14,
		fontWeight: '600',
	},
	dropdownArrow: {
		color: '#FFFFFF',
		fontSize: 12,
	},
	dropdownMenu: {
		position: 'absolute',
		top: 40,
		left: 0,
		backgroundColor: '#333333',
		borderRadius: 12,
		minWidth: 120,
		zIndex: 20,
		overflow: 'hidden',
	},
	dropdownItem: {
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	dropdownItemText: {
		color: '#FFFFFF',
		fontSize: 14,
	},
	addGroupButton: {
		backgroundColor: 'transparent',
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 20,
		borderWidth: 1,
		borderColor: '#FF6B35',
	},
	addGroupText: {
		color: '#FF6B35',
		fontSize: 14,
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
