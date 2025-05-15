import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AddEventModal from './AddEventModal';
import { Calendar } from 'react-native-calendars';
import NavigationBar from '../components/NavigationBar';

// 더미 일정 데이터
const dummyEvents = {
  '2025-05-12': [
    { id: 1, time: '10:00', title: '회의' },
    { id: 2, time: '15:00', title: '카카오톡 알림 테스트' },
  ],
  '2025-05-13': [
    { id: 3, time: '09:00', title: '아침 운동' },
  ],
  '2025-05-15': [
    { id: 4, time: '13:00', title: '점심 약속' },
    { id: 5, time: '18:00', title: '스터디' },
    { id: 6, time: '20:00', title: '저녁 약속' },
  ],
};

const CalendarScreen = ({ onLogout }) => {
  // 날짜 상태
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today.toISOString().slice(0, 10));
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1~12
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showNavigationBar, setShowNavigationBar] = useState(false);
  const [refresh, setRefresh] = useState(false); // 강제 리렌더용
  const events = dummyEvents[selectedDate] || [];

  // 각 날짜별 일정 정보 반환
  const getEventsForDate = (dateString) => dummyEvents[dateString] || [];

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
        onSave={({ title, memo, time, date }) => {
          if (!dummyEvents[date]) dummyEvents[date] = [];
          dummyEvents[date].push({ id: Date.now(), title, time: time || '', memo });
          setRefresh(r => !r);
        }}
        defaultDate={selectedDate}
      />

      {/* 캘린더 - 날짜별 일정 제목 일부 표시 */}
      <Calendar
        current={getCurrentMonthString()}
        onDayPress={day => setSelectedDate(day.dateString)}
        dayComponent={({ date, state }) => {
          const dayEvents = getEventsForDate(date.dateString);
          return (
            <TouchableOpacity
              style={[
                styles.dayContainer,
                date.dateString === selectedDate && styles.selectedDay,
              ]}
              onPress={() => setSelectedDate(date.dateString)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dayText,
                  state === 'disabled' && styles.dayDisabled,
                  date.dateString === selectedDate && styles.dayTextSelected,
                  date.dateString === new Date().toISOString().slice(0, 10) && styles.todayText,
                ]}
              >
                {date.day}
              </Text>
              {/* 일정 제목 일부 표시 */}
              {dayEvents.length > 0 && (
                <View style={styles.eventPreviewWrap}>
                  <Text numberOfLines={1} style={styles.eventPreviewText}>
                    {dayEvents[0].title.length > 6
                      ? dayEvents[0].title.slice(0, 6) + '...'
                      : dayEvents[0].title}
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
      {/* 오늘의 일정 리스트 */}
      <View style={styles.eventSection}>
        <Text style={styles.eventTitle}>{selectedDate} 일정</Text>
        {events.length === 0 ? (
          <Text style={styles.noEvent}>일정이 없습니다.</Text>
        ) : (
          <FlatList
            data={events}
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
