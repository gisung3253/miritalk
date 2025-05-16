import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { app, auth } from './config';

// 달의 다음 달 문자열 반환 (YYYY-MM-01 형식)
const getNextMonthString = (monthString) => {
  const [year, month] = monthString.split('-');
  const nextMonth = parseInt(month) + 1;
  const nextYear = parseInt(year) + Math.floor((nextMonth - 1) / 12);
  const nextMonthStr = ((nextMonth - 1) % 12) + 1;
  return `${nextYear}-${nextMonthStr.toString().padStart(2, '0')}-01`;
};

// Firestore 초기화
const db = getFirestore(app);

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

    const eventsRef = getUserEventsCollection(user.uid);
    const newEvent = {
      title: eventData.title || '',
      time: eventData.time || '',
      date: eventData.date,
      userId: user.uid,
      createdAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(eventsRef, newEvent);
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

    const eventsRef = getUserEventsCollection(user.uid);
    const q = query(
      eventsRef,
      where('userId', '==', user.uid),
      where('date', '>=', monthString),
      where('date', '<', getNextMonthString(monthString))
    );

    const querySnapshot = await getDocs(q);
    const events = [];
    
    querySnapshot.forEach((doc) => {
      events.push({ id: doc.id, ...doc.data() });
    });
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
    
    console.log('삭제 시도 - 사용자 ID:', user.uid);
    console.log('삭제 시도 - 이벤트 ID:', eventId);

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
    return true;
  } catch (error) {
    console.error('일정 삭제 오류:', error);
    throw error;
  }
};