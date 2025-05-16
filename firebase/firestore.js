import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, getDoc, getDocs, query, where, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED, initializeFirestore } from 'firebase/firestore';
import { app, auth } from './config';

// 달의 다음 달 문자열 반환 (YYYY-MM-01 형식)
const getNextMonthString = (monthString) => {
  const [year, month] = monthString.split('-');
  const nextMonth = parseInt(month) + 1;
  const nextYear = parseInt(year) + Math.floor((nextMonth - 1) / 12);
  const nextMonthStr = ((nextMonth - 1) % 12) + 1;
  return `${nextYear}-${nextMonthStr.toString().padStart(2, '0')}-01`;
};

// Firestore 초기화 (오프라인 지속성 활성화)
const db = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED
});

// 오프라인 지원 활성화
enableIndexedDbPersistence(db)
  .then(() => {
    console.log('Firestore 오프라인 지원 활성화 성공');
  })
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      // 다중 탭 환경 등에서 발생할 수 있는 오류
      console.warn('Firestore 오프라인 지원 활성화 실패: 다중 탭이 열려 있습니다');
    } else if (err.code === 'unimplemented') {
      console.warn('Firestore 오프라인 지원 실패: 브라우저가 지원하지 않습니다');
    } else {
      console.error('Firestore 오프라인 지원 활성화 오류:', err);
    }
  });

// 사용자별 이벤트 컬렉션 참조
const getUserEventsCollection = (userId) => {
  const userRef = doc(db, 'users', userId);
  return collection(userRef, 'events');
};

// 일정 추가
export const addEvent = async (eventData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('로그인이 필요합니다.');

    console.log(`일정 추가 시작: ${eventData.title} (${eventData.date})`);
    const startTime = Date.now();

    const eventsRef = getUserEventsCollection(user.uid);
    const newEvent = {
      title: eventData.title || '',
      time: eventData.time || '',
      date: eventData.date,
      userId: user.uid,
      createdAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(eventsRef, newEvent);
    console.log(`일정 추가 완료 (${Date.now() - startTime}ms): ${docRef.id}`);
    return { id: docRef.id, ...newEvent };
  } catch (error) {
    console.error('일정 추가 오류:', error);
    throw error;
  }
};

// 일정 조회 (특정 날짜)
export const getEventsByDate = async (date) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('로그인이 필요합니다.');

    const eventsRef = getUserEventsCollection(user.uid);
    const q = query(
      eventsRef,
      where('userId', '==', user.uid),
      where('date', '==', date)
    );

    const querySnapshot = await getDocs(q);
    const events = [];
    
    querySnapshot.forEach((doc) => {
      events.push({ id: doc.id, ...doc.data() });
    });
    
    return events;
  } catch (error) {
    console.error('일정 조회 오류:', error);
    throw error;
  }
};

// 달의 모든 일정 조회
export const getEventsByMonth = async (monthString) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('로그인이 필요합니다.');

    console.log(`월별 일정 조회 시작: ${monthString}`);
    const startTime = Date.now();

    const eventsRef = getUserEventsCollection(user.uid);
    
    // 최적화된 쿼리 (복합 인덱스 필요)
    const q = query(
      eventsRef,
      where('userId', '==', user.uid),
      where('date', '>=', monthString),
      where('date', '<', getNextMonthString(monthString))
    );

    // 캐시 우선 정책으로 쿼리 실행
    const querySnapshot = await getDocs(q);
    const events = [];
    
    querySnapshot.forEach((doc) => {
      events.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`월별 일정 조회 완료 (${Date.now() - startTime}ms): ${events.length}개 항목`);
    return events;
  } catch (error) {
    console.error('달의 일정 조회 오류:', error);
    throw error;
  }
};

// 모든 일정 조회
export const getAllEvents = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('로그인이 필요합니다.');

    const eventsRef = getUserEventsCollection(user.uid);
    const q = query(
      eventsRef,
      where('userId', '==', user.uid)
    );

    const querySnapshot = await getDocs(q);
    const events = [];
    
    querySnapshot.forEach((doc) => {
      events.push({ id: doc.id, ...doc.data() });
    });
    return events;
  } catch (error) {
    console.error('모든 일정 조회 오류:', error);
    throw error;
  }
};

// 일정 삭제
export const deleteEvent = async (eventId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('로그인이 필요합니다.');
    
    console.log(`일정 삭제 시작: ${eventId}`);
    const startTime = Date.now();
    
    // 직접 문서 경로를 지정하여 참조
    const eventRef = doc(db, 'users', user.uid, 'events', eventId);
    
    // 문서가 존재하는지 확인
    const docSnap = await getDoc(eventRef);
    if (!docSnap.exists()) {
      console.log('문서가 존재하지 않습니다:', eventRef.path);
      throw new Error('존재하지 않는 일정입니다.');
    }

    // 문서가 존재하면 삭제
    await deleteDoc(eventRef);
    console.log(`일정 삭제 완료 (${Date.now() - startTime}ms): ${eventId}`);
    return true;
  } catch (error) {
    console.error('일정 삭제 오류:', error);
    throw error;
  }
};