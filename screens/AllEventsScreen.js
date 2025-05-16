import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { getAllEvents } from '../firebase/firestore';
import styles from '../style/AllEventsScreen.styles';

const AllEventsScreen = ({ onBack }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // 모든 일정 로드
  useEffect(() => {
    loadAllEvents();
  }, []);

  const loadAllEvents = async () => {
    try {
      setLoading(true);
      const allEvents = await getAllEvents();
      
      // 오늘 날짜 가져오기 - 현재 날짜 사용
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const todayString = `${year}-${month}-${day}`;
      
      // 오늘 이후의 일정만 필터링 - 정확한 문자열 비교
      const filteredEvents = allEvents.filter(event => {
        // 정확한 날짜 비교를 위해 문자열 비교 사용
        return event.date >= todayString; // '2025-05-16' 이후 일정만 포함
      });
      
      // 날짜와 시간으로 정렬 (가까운 일정이 먼저 표시)
      const sortedEvents = filteredEvents.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA - dateB;
      });
      
      setEvents(sortedEvents);
    } catch (error) {
      console.error('일정 로드 실패:', error);
      Alert.alert('오류', '일정을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 날짜 형식 변환 (YYYY-MM-DD -> YYYY년 MM월 DD일)
  const formatDate = (dateString) => {
    const [year, month, day] = dateString.split('-');
    return `${year}년 ${month}월 ${day}일`;
  };

  // 일정 항목 렌더링
  const renderEventItem = ({ item, index }) => {
    // 오늘 날짜 가져오기 - 필터링과 동일한 방식 사용
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayString = `${year}-${month}-${day}`;
    
    const isToday = item.date === todayString;
    const isPast = new Date(`${item.date}T${item.time}`) < new Date();
    
    // 이전 항목과 날짜가 다른지 확인
    const isNewDate = index === 0 || item.date !== events[index - 1].date;
    
    return (
      <View>
        {isNewDate && (
          <View style={styles.dateHeader}>
            <Text style={styles.dateHeaderText}>
              {formatDate(item.date)}
              {isToday && <Text style={styles.todayIndicator}> (오늘)</Text>}
            </Text>
          </View>
        )}
        
        <View style={[
          styles.eventItem, 
          isPast ? styles.pastEvent : null,
          isToday ? styles.todayEvent : null
        ]}>
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{item.time}</Text>
            {isPast ? (
              <MaterialIcons name="done" size={16} color="#4CAF50" style={styles.statusIcon} />
            ) : (
              <MaterialIcons name="schedule" size={16} color="#FF9800" style={styles.statusIcon} />
            )}
          </View>
          
          <View style={styles.eventContent}>
            <Text style={styles.eventTitle}>{item.title}</Text>
          </View>
        </View>
      </View>
    );
  };

  // 빈 일정 표시
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="event-busy" size={64} color="#ccc" />
      <Text style={styles.emptyText}>등록된 일정이 없습니다</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>일정 한눈에 보기</Text>
      </View>

      {/* 일정 목록 */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F8EF7" />
          <Text style={styles.loadingText}>일정을 불러오는 중...</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          renderItem={renderEventItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.eventList}
          ListEmptyComponent={renderEmptyList}
        />
      )}
    </View>
  );
};

export default AllEventsScreen;
