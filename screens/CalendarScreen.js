import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, TouchableWithoutFeedback, PanResponder, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import AddEventModal from './AddEventModal';
import AllEventsScreen from './AllEventsScreen';
import { Calendar } from 'react-native-calendars';
import NavigationBar from '../components/NavigationBar';
import { auth } from '../firebase/config';
import { getEventsByMonth, addEvent, deleteEvent } from '../firebase/firestore';



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
  const [calendarKey, setCalendarKey] = useState(Date.now()); // 캘린더 강제 리렌더링을 위한 키
  const [showAllEvents, setShowAllEvents] = useState(false); // 일정 한눈에 보기 화면 표시 여부
  
  // 스와이프 제스처 처리를 위한 PanResponder 생성
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // 오른쪽으로 스와이프하는 경우에만 반응
        return gestureState.dx > 5 && showNavigationBar;
      },
      onPanResponderRelease: (evt, gestureState) => {
        // 오른쪽으로 스와이프하면 네비게이션 바 닫기
        if (gestureState.dx > 50 && showNavigationBar) {
          setShowNavigationBar(false);
        }
      },
    })
  ).current;

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
  const loadEvents = async (date) => {
    try {
      setLoading(true);
      // 현재 월의 모든 일정 로드
      const monthString = date ? 
        `${date.split('-')[0]}-${date.split('-')[1]}-01` : 
        getCurrentMonthString();
      const monthEvents = await getEventsByMonth(monthString);
      // 월의 모든 일정을 상태에 저장
      setEvents(monthEvents);
    } catch (error) {
      console.error('일정 로드 실패:', error);
      Alert.alert('오류', '일정을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  // 선택된 날짜의 일정만 필터링
  const getFilteredEvents = (date) => {
    return events.filter(event => event.date === date);
  };

  // 초기 로딩
  useEffect(() => {
    loadEvents();
  }, []);
  
  // 선택된 날짜가 변경될 때마다 해당 일정 불러오기
  useEffect(() => {
    if (selectedDate) {
      loadEvents(selectedDate);
    }
  }, [selectedDate]);

  // 현재 달의 첫날(YYYY-MM-01) 문자열 반환
  const getCurrentMonthString = () => `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
  
  // 날짜를 'YYYY년 MM월 DD일' 형식으로 변환
  const formatDate = (dateString) => {
    const [year, month, day] = dateString.split('-');
    return `${year}년 ${month}월 ${day}일`;
  };


  // 일정 한눈에 보기 함수
  const handleViewAllEvents = () => {
    // 네비게이션 바 닫고 일정 한눈에 보기 화면으로 전환
    setShowNavigationBar(false);
    setShowAllEvents(true);
  };
  
  // 일정 한눈에 보기 화면에서 돌아오기
  const handleBackFromAllEvents = () => {
    setShowAllEvents(false);
  };
  
  // 일정 한눈에 보기 화면이 활성화되어 있으면 해당 화면을 렌더링
  if (showAllEvents) {
    return <AllEventsScreen onBack={handleBackFromAllEvents} />;
  }
  
  // 기본 캘린더 화면 렌더링
  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* 네비게이션 바와 오버레이 */}
      {showNavigationBar && (
        <>
          {/* 배경 오버레이 - 터치하면 네비게이션 바 닫힘 */}
          <TouchableWithoutFeedback onPress={() => setShowNavigationBar(false)}>
            <View style={styles.overlay} />
          </TouchableWithoutFeedback>
          
          {/* 네비게이션 바 */}
          <NavigationBar 
            onLogout={onLogout} 
            onViewAllEvents={handleViewAllEvents}
          />
        </>
      )}
      
      {/* 상단 월/년 표시 */}
      <View style={styles.header}>
        {/* 오늘 버튼 - 왼쪽에 배치 */}
        <TouchableOpacity 
          style={styles.todayButtonHeader}
          onPress={() => {
            const today = new Date();
            const todayString = today.toISOString().slice(0, 10);
            
            // 상태 업데이트
            setCurrentMonth(today.getMonth() + 1);
            setCurrentYear(today.getFullYear());
            setSelectedDate(todayString);
            
            // 캘린더 강제 리렌더링을 위한 키 업데이트
            setCalendarKey(Date.now());
          }}
        >
          <MaterialIcons name="today" size={20} color="white" />
          <Text style={styles.todayButtonHeaderText}>오늘</Text>
        </TouchableOpacity>
        
        {/* 월/년 표시 - 가운데 배치 */}
        <View style={{flex: 1, alignItems: 'center'}}>
          <Text style={styles.headerText}>{currentYear}년 {currentMonth}월</Text>
        </View>
        
        {/* 네비게이션 버튼 - 오른쪽에 배치 */}
        <TouchableOpacity onPress={() => setShowNavigationBar(!showNavigationBar)} style={styles.navIconContainerRight}>
          <Ionicons name="menu" size={24} color="white" />
        </TouchableOpacity>
      </View>
      {/* 일정 등록 모달 */}
      <AddEventModal
        visible={showAddEventModal}
        onClose={() => setShowAddEventModal(false)}
        onSave={({ title, time, date }) => {
          const eventData = {
            title,
            time,
            date
          };
          
          addEvent(eventData)
            .then(() => {
              loadEvents();
              Alert.alert('성공', '일정이 추가되었습니다.');
            })
            .catch(error => {
              console.error('일정 추가 실패:', error);
              Alert.alert('오류', '일정 추가에 실패했습니다.');
            });
        }}
        defaultDate={selectedDate}
      />

      {/* 오늘로 이동하는 버튼은 헤더로 이동했습니다 */}

      {/* 캘린더 - 날짜별 일정 제목 일부 표시 */}
      <Calendar
        key={calendarKey}
        current={`${currentYear}-${String(currentMonth).padStart(2, '0')}-01`}
        markedDates={{
          [selectedDate]: { selected: true, selectedColor: '#4F8EF7' }
        }}
        enableSwipeMonths={true}
        onDayPress={day => {
          setSelectedDate(day.dateString);
        }}
        onMonthChange={(month) => {
          setCurrentMonth(month.month);
          setCurrentYear(month.year);
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
        <Text style={styles.eventTitle}>{formatDate(selectedDate)} 일정</Text>
        {getFilteredEvents(selectedDate).length === 0 ? (
          <Text style={styles.noEvent}>일정이 없습니다.</Text>
        ) : (
          <FlatList
            data={getFilteredEvents(selectedDate)}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
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
                              await deleteEvent(item.id);
                              loadEvents();
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
