import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AddEventModal from './AddEventModal';
import { Calendar } from 'react-native-calendars';
import NavigationBar from '../components/NavigationBar';
import { auth } from '../firebase/config';
import { getEventsByMonth } from '../firebase/firestore';
import { addEvent } from '../firebase/firestore';



const CalendarScreen = ({ onLogout }) => {
  // 사용자 인증 확인
  const user = auth.currentUser;
  if (!user) {
    return null;
  }

  // 상태 관리
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today.toISOString().slice(0, 10));
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1~12
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // 일정 렌더링
  const renderEvent = ({ item }) => (
    <View style={styles.eventItem}>
      <Text style={styles.eventTime}>{item.time}</Text>
      <Text style={styles.eventText}>{item.title}</Text>
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => {
          Alert.alert(
            '일정 삭제',
            '이 일정을 삭제하시겠습니까?',
            [
              { text: '취소', style: 'cancel' },
              { 
                text: '삭제', 
                style: 'destructive',
                onPress: async () => {
                  try {
                    console.log('삭제 시도 - 이벤트 데이터:', item);
                    // Firestore에서 생성된 ID를 사용하여 삭제
                    await deleteEvent(item.id);
                    await loadEvents(selectedDate);
                    Alert.alert('성공', '일정이 삭제되었습니다.');
                  } catch (error) {
                    console.error('일정 삭제 실패:', error);
                    Alert.alert('오류', error.message);
                  }
                }
              }
            ]
          );
        }}
      >
        <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
      </TouchableOpacity>
    </View>
  );

  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showNavigationBar, setShowNavigationBar] = useState(false);
  const [refresh, setRefresh] = useState(false); // 강제 리렌더용
  // 일정 로드
  const loadEvents = async () => {
    try {
      setLoading(true);
      const events = await getEventsByMonth(getCurrentMonthString());
      setEvents(events);
    } catch (error) {
      console.error('일정 로드 실패:', error);
      Alert.alert('오류', '일정을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 초기 로딩
  useEffect(() => {
    loadEvents();
  }, []);

  // 현재 달의 첫날(YYYY-MM-01) 문자열 반환
  const getCurrentMonthString = () => `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;


  return (
    <View style={styles.container}>
      {/* 네비게이션 바 */}
      {showNavigationBar && <NavigationBar onLogout={onLogout} />}
      
      {/* 상단 월/년 표시 */}
      <View style={styles.header}>
        <Text style={styles.headerText}>{currentYear}년 {currentMonth}월</Text>
        <TouchableOpacity onPress={() => setShowNavigationBar(!showNavigationBar)} style={styles.navIconContainer}>
          <Ionicons name="menu" size={24} color="white" />
        </TouchableOpacity>
      </View>
      {/* 일정 등록 모달 */}
      <AddEventModal
        visible={showAddEventModal}
        onClose={() => setShowAddEventModal(false)}
        onSave={({ title = '', memo = '', time = '', date }) => {
          const eventData = {
            title,
            memo,
            time,
            date
          };
          
          addEvent(eventData)
            .then(() => {
              loadEvents(date);
            })
            .catch(error => {
              console.error('일정 추가 실패:', error);
              Alert.alert('오류', error.message);
            });
        }}
        defaultDate={selectedDate}
      />

      {/* 캘린더 - 날짜별 일정 제목 일부 표시 */}
      <Calendar
        current={getCurrentMonthString()}
        onDayPress={day => {
          setSelectedDate(day.dateString);
          loadEvents();
        }}
        dayComponent={({ date, state }) => {
          const dayEvents = events.filter(event => event.date === date.dateString);
          const firstEvent = dayEvents[0];
          const isWeekend = new Date(date.year, date.month - 1, date.day).getDay() === 0 || // 일요일
                        new Date(date.year, date.month - 1, date.day).getDay() === 6; // 토요일
          
          return (
            <TouchableOpacity
              style={[
                styles.dayContainer,
                date.dateString === selectedDate && styles.selectedDay,
              ]}
              onPress={() => {
                setSelectedDate(date.dateString);
                loadEvents(date.dateString);
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dayText,
                  state === 'disabled' && styles.dayDisabled,
                  date.dateString === selectedDate && styles.dayTextSelected,
                  date.dateString === new Date().toISOString().slice(0, 10) && styles.todayText,
                  isWeekend && styles.weekendText,
                ]}
              >
                {date.day}
              </Text>
              {/* 일정 제목 일부 표시 */}
              {dayEvents.length > 0 && (
                <View style={styles.eventPreviewWrap}>
                  <Text numberOfLines={1} style={styles.eventPreviewText}>
                    {firstEvent.title.length > 6
                      ? firstEvent.title.slice(0, 6) + '...'
                      : firstEvent.title}
                  </Text>
                  {dayEvents.length > 1 && (
                    <Text style={styles.eventPreviewMore}>외 {dayEvents.length - 1}개</Text>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        theme={{
          todayTextColor: '#4F8EF7',
          arrowColor: '#4F8EF7',
        }}
        style={styles.calendar}
      />
      {/* 선택된 날짜의 일정 리스트 */}
      <View style={styles.eventSection}>
        <Text style={styles.eventTitle}>{selectedDate} 일정</Text>
        {events.filter(event => event.date === selectedDate).length === 0 ? (
          <Text style={styles.noEvent}>일정이 없습니다.</Text>
        ) : (
          <FlatList
            data={events.filter(event => event.date === selectedDate)}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.eventItem}>
                <Text style={styles.eventTime}>{item.time}</Text>
                <Text style={styles.eventText}>{item.title}</Text>
              </View>
            )}
          />
        )}
      </View>

      {/* + 버튼 (FAB) */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowAddEventModal(true)}>
        <Text style={{ color: '#fff', fontSize: 32, fontWeight: 'bold' }}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

import styles from '../style/CalendarScreen.styles';

export default CalendarScreen;
