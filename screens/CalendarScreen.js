import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  const [eventsCache, setEventsCache] = useState({}); // 캐싱을 위한 상태
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

  // 이벤트 항목 컴포넌트 (메모이제이션)
  const EventItem = useCallback(({ item, onDelete }) => (
    <View style={styles.eventItem}>
      <Text style={styles.eventTime}>{item.time}</Text>
      <Text style={styles.eventText}>{item.title}</Text>
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => onDelete(item)}
      >
        <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
      </TouchableOpacity>
    </View>
  ), []);

  // 일정 삭제 처리 함수
  const handleDeleteEvent = useCallback((item) => {
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
              // UI에서 먼저 제거 (낙관적 업데이트)
              const newEvents = events.filter(event => event.id !== item.id);
              setEvents(newEvents);
              
              // 캐시 업데이트
              const monthString = item.date.substring(0, 8) + '01'; // YYYY-MM-01 형식
              if (eventsCache[monthString]) {
                setEventsCache(prev => ({
                  ...prev, 
                  [monthString]: prev[monthString].filter(event => event.id !== item.id)
                }));
              }
              
              // 즉시 성공 알림 표시
              Alert.alert('성공', '일정이 삭제되었습니다.');
              
              // Firestore에서 실제 삭제 (백그라운드)
              deleteEvent(item.id).catch(error => {
                console.error('일정 삭제 실패:', error);
                // 실패 시 원상복구
                loadEvents(selectedDate);
                Alert.alert('오류', '일정 삭제 중 문제가 발생했습니다.');
              });
            } catch (error) {
              console.error('일정 삭제 실패:', error);
              // 실패 시 원상복구
              loadEvents(selectedDate);
              Alert.alert('오류', error.message);
            }
          }
        }
      ]
    );
  }, [events, eventsCache, selectedDate]);

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
      
      // 캐시에 이미 저장된 데이터가 있는지 확인
      if (eventsCache[monthString]) {
        console.log('캐시된 이벤트 사용:', monthString);
        setEvents(eventsCache[monthString]);
        setLoading(false);
        
        // 백그라운드에서 최신 데이터 업데이트 (동기화)
        getEventsByMonth(monthString).then(freshEvents => {
          if (JSON.stringify(eventsCache[monthString]) !== JSON.stringify(freshEvents)) {
            console.log('백그라운드 이벤트 업데이트:', monthString);
            setEventsCache(prev => ({...prev, [monthString]: freshEvents}));
            setEvents(freshEvents);
          }
        }).catch(err => console.log('백그라운드 업데이트 실패:', err));
        
        return;
      }

      // 캐시에 없으면 Firestore에서 로드
      const monthEvents = await getEventsByMonth(monthString);
      
      // 캐시와 상태에 저장
      setEventsCache(prev => ({...prev, [monthString]: monthEvents}));
      setEvents(monthEvents);
    } catch (error) {
      console.error('일정 로드 실패:', error);
      Alert.alert('오류', '일정을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  // 선택된 날짜의 일정만 필터링 (메모이제이션)
  const getFilteredEvents = useCallback((date) => {
    return events.filter(event => event.date === date);
  }, [events]);

  // 최근 이용한 마지막 달을 기억하는 함수
  const getLastViewedMonth = useCallback(async () => {
    try {
      // 여기에 AsyncStorage 등을 통해 마지막으로 본 월 정보를 가져오는 코드 추가
      return getCurrentMonthString(); // 마지막 데이터가 없으면 현재 월
    } catch (error) {
      console.warn('마지막 조회 월 정보를 가져오는데 실패:', error);
      return getCurrentMonthString();
    }
  }, [getCurrentMonthString]);

  // 초기 로딩
  useEffect(() => {
    const initializeCalendar = async () => {
      // 로그인 후 첫 화면 렌더링 시 즉시 기본 레이아웃 표시
      setLoading(true);
      
      // 최근에 본 월 정보 불러오기
      loadEvents();
      
      // 배치 로딩을 위한 12개월 사전 준비 (현재 월의 앞뒤 6개월)
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth(); // 0-11
      
      // 백그라운드에서 여러 달 데이터 가져오기
      setTimeout(() => {
        const preloadMonths = [];
        for (let i = -2; i <= 2; i++) {
          if (i === 0) continue; // 현재 월은 이미 로딩됨
          
          let targetMonth = currentMonth + i;
          let targetYear = currentYear;
          
          if (targetMonth < 0) {
            targetYear--;
            targetMonth += 12;
          } else if (targetMonth > 11) {
            targetYear++;
            targetMonth -= 12;
          }
          
          const monthString = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-01`;
          preloadMonths.push(monthString);
        }
        
        // 백그라운드에서 한꺼번에 가져오기
        Promise.allSettled(preloadMonths.map(month => 
          getEventsByMonth(month)
            .then(events => {
              setEventsCache(prev => ({...prev, [month]: events}));
            })
            .catch(err => console.log(`${month} 사전 로딩 실패:`, err))
        ));
      }, 1000); // 현재 달이 렌더링된 후 백그라운드에서 로딩
    };
    
    initializeCalendar();
  }, []);
  
  // 선택된 날짜가 변경될 때마다 해당 일정 불러오기
  useEffect(() => {
    if (selectedDate) {
      loadEvents(selectedDate);
    }
  }, [selectedDate]);

  // 현재 달의 첫날(YYYY-MM-01) 문자열 반환
  const getCurrentMonthString = useCallback(() => 
    `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`, 
    [currentYear, currentMonth]
  );
  
  // 다음 달의 첫날 문자열 반환 (페이지네이션용)
  const getNextMonthString = useCallback((monthString) => {
    const [year, month] = monthString.split('-');
    if (month === '12') {
      return `${parseInt(year) + 1}-01-01`;
    } else {
      return `${year}-${String(parseInt(month) + 1).padStart(2, '0')}-01`;
    }
  }, []);
  
  // 날짜를 'YYYY년 MM월 DD일' 형식으로 변환
  const formatDate = useCallback((dateString) => {
    const [year, month, day] = dateString.split('-');
    return `${year}년 ${month}월 ${day}일`;
  }, []);


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
        <View style={{width: 80, alignItems: 'flex-start'}}>
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
        </View>
        
        {/* 월/년 표시 - 가운데 배치 */}
        <View style={{flex: 1, alignItems: 'center'}}>
          <Text style={styles.headerText}>{currentYear}년 {currentMonth}월</Text>
        </View>
        
        {/* 네비게이션 버튼 - 오른쪽에 배치 */}
        <View style={{width: 80, alignItems: 'flex-end'}}>
          <TouchableOpacity onPress={() => setShowNavigationBar(!showNavigationBar)} style={styles.navIconContainerRight}>
            <Ionicons name="menu" size={24} color="white" />
          </TouchableOpacity>
        </View>
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
          
          // 임시 ID로 낙관적 업데이트
          const tempId = `temp-${Date.now()}`;
          const tempEvent = { ...eventData, id: tempId };
          
          // 먼저 UI에 일정을 추가
          setEvents(prev => [...prev, tempEvent]);
          
          // 캐시 업데이트
          const monthString = date.substring(0, 8) + '01'; // YYYY-MM-01 형식
          if (eventsCache[monthString]) {
            setEventsCache(prev => ({
              ...prev,
              [monthString]: [...prev[monthString], tempEvent]
            }));
          }
          
          // 모달 즉시 닫고 알림 표시
          setShowAddEventModal(false);
          Alert.alert('성공', '일정이 추가되었습니다.');
          
          // Firestore에 실제 저장 (백그라운드)
          addEvent(eventData)
            .then((savedEvent) => {
              // 임시 ID를 실제 ID로 대체
              setEvents(prev => 
                prev.map(event => event.id === tempId ? savedEvent : event)
              );
              
              // 캐시 업데이트
              if (eventsCache[monthString]) {
                setEventsCache(prev => ({
                  ...prev,
                  [monthString]: prev[monthString].map(event => 
                    event.id === tempId ? savedEvent : event
                  )
                }));
              }
            })
            .catch(error => {
              console.error('일정 추가 실패:', error);
              
              // 실패 시 임시 일정 제거
              setEvents(prev => prev.filter(event => event.id !== tempId));
              
              if (eventsCache[monthString]) {
                setEventsCache(prev => ({
                  ...prev,
                  [monthString]: prev[monthString].filter(event => event.id !== tempId)
                }));
              }
              
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
        animateScroll={true}
        scrollEnabled={true}
        pagingEnabled={true}
        horizontalSwipe={true}
        animateScrollEasing={(t) => t * t * t}
        animateScrollSpeed={300}
        onDayPress={day => {
          setSelectedDate(day.dateString);
        }}
        onMonthChange={(month) => {
          setCurrentMonth(month.month);
          setCurrentYear(month.year);
          
          // 날짜도 현재 달에 맞게 업데이트 (같은 날짜로 변경)
          const currentDay = selectedDate.split('-')[2];
          let newSelectedDate;
          
          // 현재 선택된 날짜의 일자가 새 달에 존재하는지 확인
          const lastDayOfMonth = new Date(month.year, month.month, 0).getDate();
          const targetDay = Math.min(parseInt(currentDay), lastDayOfMonth);
          
          newSelectedDate = `${month.year}-${String(month.month).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
          setSelectedDate(newSelectedDate);
          
          // 월 변경 시 해당 월의 일정을 즉시 로드
          const newMonthString = `${month.year}-${String(month.month).padStart(2, '0')}-01`;
          loadEvents(newMonthString);
          
          // 미리 다음 달과 이전 달도 로드해 두기
          const nextMonth = month.month === 12 ? 1 : month.month + 1;
          const nextYear = month.month === 12 ? month.year + 1 : month.year;
          const nextMonthString = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
          
          const prevMonth = month.month === 1 ? 12 : month.month - 1;
          const prevYear = month.month === 1 ? month.year - 1 : month.year;
          const prevMonthString = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
          
          // 백그라운드에서 로딩
          if (!eventsCache[nextMonthString]) {
            getEventsByMonth(nextMonthString)
              .then(events => setEventsCache(prev => ({...prev, [nextMonthString]: events})))
              .catch(err => console.log('다음 달 로딩 실패:', err));
          }
          
          if (!eventsCache[prevMonthString]) {
            getEventsByMonth(prevMonthString)
              .then(events => setEventsCache(prev => ({...prev, [prevMonthString]: events})))
              .catch(err => console.log('이전 달 로딩 실패:', err));
          }
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
        {loading ? (
          <ActivityIndicator size="small" color="#4F8EF7" style={{marginTop: 20}} />
        ) : getFilteredEvents(selectedDate).length === 0 ? (
          <Text style={styles.noEvent}>일정이 없습니다.</Text>
        ) : (
          <FlatList
            data={getFilteredEvents(selectedDate)}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <EventItem item={item} onDelete={handleDeleteEvent} />
            )}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={10}
            removeClippedSubviews={true}
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
