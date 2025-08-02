import { useState, useMemo } from 'react';

export const useGroupState = () => {
    const [selectedGroup, setSelectedGroup] = useState('책오렌탄');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [keywords, setKeywords] = useState<string[]>([
        'tlqkf', 'qudtls', 'wlfkf', 'whwrkkxek', '대충', '욕', '대충...', '욕설......', '마인', '축구', '오열', '대충웃음웃음웃음',
    ]);
    const [newKeyword, setNewKeyword] = useState('');
    const [showAddKeywordModal, setShowAddKeywordModal] = useState(false);

    const users = [
        { name: '김철수', count: 12 },
        { name: '이영희', count: 8 },
        { name: '박민수', count: 15 },
        { name: '정수정', count: 3 },
        { name: '홍길동', count: 20 },
    ];

    const sortedUsers = useMemo(() => {
        return [...users].sort((a, b) => (sortOrder === 'asc' ? a.count - b.count : b.count - a.count));
    }, [sortOrder, users]);

    return {
        selectedGroup,
        setSelectedGroup,
        sortOrder,
        setSortOrder,
        keywords,
        setKeywords,
        newKeyword,
        setNewKeyword,
        showAddKeywordModal,
        setShowAddKeywordModal,
        sortedUsers,
    };
};