import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from './config';
import { Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Apple 로그인 함수들 import (정식 Firebase 연동 버전)
import { 
  checkFirebaseAppleLoginStatus, 
  getFirebaseAppleUserInfo, 
  firebaseAppleLogout 
} from './appleLogin';

// 카카오 로그인 함수들 import
import { isKakaoLoggedIn, getKakaoUserInfo, kakaoLogout } from './kakaoLogin';

// 상수 정의
const TOKEN_REFRESH_INTERVAL = 30 * 60 * 1000; // 30분마다 토큰 갱신
const TOKEN_KEY = 'userToken';
const EMAIL_KEY = 'userEmail';
const REFRESH_TOKEN_KEY = 'refreshToken';
const AUTH_STATE_KEY = 'authState';

// 토큰 저장 함수
const saveToken = async (key, value) => {
  try {
    await SecureStore.setItemAsync(key, value);
    console.log(`토큰 저장 성공: ${key}${key === TOKEN_KEY ? ' (' + value.substring(0, 15) + '...)' : ''}`);
    return true;
  } catch (error) {
    console.error('Error saving token:', error);
    return false;
  }
};

// 토큰 가져오기 함수
export const getToken = async (key) => {
  try {
    const value = await SecureStore.getItemAsync(key);
    if (key === TOKEN_KEY && value) {
      console.log(`토큰 가져오기: ${key} - 성공 (${value.substring(0, 15)}...)`);
    } else {
      console.log(`토큰 가져오기: ${key} - ${value ? '성공' : '없음'}`);
    }
    return value;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

// 토큰 삭제 함수
const deleteToken = async (key) => {
  try {
    await SecureStore.deleteItemAsync(key);
    console.log(`토큰 삭제 완료: ${key}`);
  } catch (error) {
    console.error(`토큰 삭제 실패 (${key}):`, error);
  }
};

// 통합 로그인 상태 확인 (Firebase + Apple + 카카오)
export const checkIntegratedLoginStatus = async () => {
  try {
    console.log('통합 로그인 상태 확인 시작');
    
    // Firebase 로그인 상태 확인
    const firebaseUser = auth.currentUser;
    const isFirebaseLoggedIn = !!firebaseUser;
    console.log('Firebase 로그인 상태:', isFirebaseLoggedIn);
    
    // Apple 로그인 상태 확인
    let isAppleLoggedIn = false;
    try {
      const appleStatus = await checkFirebaseAppleLoginStatus();
      isAppleLoggedIn = appleStatus.integrated;
      console.log('Apple 로그인 상태:', isAppleLoggedIn);
    } catch (error) {
      console.log('Apple 로그인 모듈 없음 또는 오류:', error.message);
    }
    
    // 카카오 로그인 상태 확인
    let isKakaoLoggedIn = false;
    try {
      isKakaoLoggedIn = await isKakaoLoggedIn();
      console.log('카카오 로그인 상태:', isKakaoLoggedIn);
    } catch (error) {
      console.log('카카오 로그인 모듈 없음 또는 오류:', error.message);
    }
    
    // 통합 로그인 상태 (Firebase 또는 소셜 로그인 중 하나라도 있으면 로그인됨)
    const isIntegratedLoggedIn = isFirebaseLoggedIn || isAppleLoggedIn || isKakaoLoggedIn;
    
    const result = {
      firebase: isFirebaseLoggedIn,
      apple: isAppleLoggedIn,
      kakao: isKakaoLoggedIn,
      integrated: isIntegratedLoggedIn
    };
    
    console.log('통합 로그인 상태 확인 결과:', result);
    return result;
  } catch (error) {
    console.error('통합 로그인 상태 확인 실패:', error);
    return {
      firebase: false,
      apple: false,
      kakao: false,
      integrated: false
    };
  }
};

// 세션 유효성 확인 (통합 버전)
export const verifySession = async () => {
  try {
    console.log('세션 유효성 확인 시작');
    
    const loginStatus = await checkIntegratedLoginStatus();
    
    if (loginStatus.integrated) {
      console.log('세션 유효성 확인 결과: 유효함');
      return true;
    } else {
      console.log('세션 유효성 확인 결과: 유효하지 않음');
      return false;
    }
  } catch (error) {
    console.error('세션 유효성 확인 실패:', error);
    return false;
  }
};

// 통합 사용자 정보 가져오기
export const getIntegratedUserInfo = async () => {
  try {
    const loginStatus = await checkIntegratedLoginStatus();
    
    if (!loginStatus.integrated) {
      return null;
    }
    
    let userInfo = {
      authType: null,
      displayName: '사용자',
      email: null,
      uid: null
    };
    
    // Firebase 사용자 정보 우선
    if (loginStatus.firebase) {
      const firebaseUser = auth.currentUser;
      userInfo = {
        authType: 'firebase',
        displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '사용자',
        email: firebaseUser.email,
        uid: firebaseUser.uid
      };
    }
    // Apple 사용자 정보
    else if (loginStatus.apple) {
      try {
        const appleUserInfo = await getFirebaseAppleUserInfo();
        if (appleUserInfo) {
          userInfo = {
            authType: 'apple',
            displayName: appleUserInfo.displayName || '사용자',
            email: appleUserInfo.email,
            uid: appleUserInfo.firebaseUID
          };
        }
      } catch (error) {
        console.log('Apple 사용자 정보 가져오기 실패:', error.message);
      }
    }
    // 카카오 사용자 정보
    else if (loginStatus.kakao) {
      try {
        const kakaoUserInfo = await getKakaoUserInfo();
        if (kakaoUserInfo) {
          userInfo = {
            authType: 'kakao',
            displayName: kakaoUserInfo.nickname || '사용자',
            email: kakaoUserInfo.email,
            uid: kakaoUserInfo.id
          };
        }
      } catch (error) {
        console.log('카카오 사용자 정보 가져오기 실패:', error.message);
      }
    }
    
    console.log('통합 사용자 정보:', userInfo);
    return userInfo;
  } catch (error) {
    console.error('통합 사용자 정보 가져오기 실패:', error);
    return null;
  }
};

// 통합 로그아웃
export const integratedLogout = async () => {
  try {
    console.log('통합 로그아웃 시작');
    
    const loginStatus = await checkIntegratedLoginStatus();
    
    // Firebase 로그아웃
    if (loginStatus.firebase) {
      try {
        await signOut(auth);
        console.log('Firebase 로그아웃 완료');
      } catch (error) {
        console.error('Firebase 로그아웃 실패:', error);
      }
    }
    
    // Apple 로그아웃
    if (loginStatus.apple) {
      try {
        await firebaseAppleLogout();
        console.log('Apple 로그아웃 완료');
      } catch (error) {
        console.error('Apple 로그아웃 실패:', error);
      }
    }
    
    // 카카오 로그아웃
    if (loginStatus.kakao) {
      try {
        await kakaoLogout();
        console.log('카카오 로그아웃 완료');
      } catch (error) {
        console.error('카카오 로그아웃 실패:', error);
      }
    }
    
    // 모든 토큰 삭제
    await deleteToken(TOKEN_KEY);
    await deleteToken(EMAIL_KEY);
    await deleteToken(REFRESH_TOKEN_KEY);
    await deleteToken(AUTH_STATE_KEY);
    
    console.log('통합 로그아웃 완료');
    return true;
  } catch (error) {
    console.error('통합 로그아웃 실패:', error);
    return false;
  }
};

// 인증 상태 리스너 설정 (통합 버전)
export const setupAuthStateListener = (callback) => {
  console.log('통합 인증 상태 리스너 설정');
  
  // Firebase 인증 상태 변화 리스너
  const unsubscribeFirebase = onAuthStateChanged(auth, async (user) => {
    console.log('Firebase 인증 상태 변화:', user ? '로그인됨' : '로그아웃됨');
    
    // 통합 로그인 상태 확인
    const loginStatus = await checkIntegratedLoginStatus();
    
    if (loginStatus.integrated) {
      console.log('인증 상태 변경: 로그인됨');
      callback(true);
    } else {
      console.log('인증 상태 변경: 로그아웃됨');
      callback(false);
    }
  });
  
  // 소셜 로그인 상태 변화 감지를 위한 주기적 확인 (선택사항)
  const socialLoginChecker = setInterval(async () => {
    try {
      const loginStatus = await checkIntegratedLoginStatus();
      // 필요시 상태 변화 감지 로직 추가
    } catch (error) {
      console.error('소셜 로그인 상태 확인 실패:', error);
    }
  }, 10000); // 10초마다 확인
  
  // 정리 함수 반환
  return () => {
    unsubscribeFirebase();
    clearInterval(socialLoginChecker);
    console.log('통합 인증 상태 리스너 정리 완료');
  };
};

// 기존 Firebase 전용 함수들 (호환성 유지)
export const signUp = async (email, password) => {
  try {
    console.log('회원가입 시도:', email);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // 토큰 저장
    const token = await user.getIdToken();
    await saveToken(TOKEN_KEY, token);
    await saveToken(EMAIL_KEY, email);
    await saveToken(AUTH_STATE_KEY, 'loggedIn');
    
    console.log('회원가입 성공:', user.uid);
    return { success: true, user };
  } catch (error) {
    console.error('회원가입 실패:', error);
    
    let errorMessage = '회원가입에 실패했습니다.';
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = '이미 사용 중인 이메일입니다.';
        break;
      case 'auth/weak-password':
        errorMessage = '비밀번호가 너무 약합니다. 6자 이상 입력해주세요.';
        break;
      case 'auth/invalid-email':
        errorMessage = '유효하지 않은 이메일 형식입니다.';
        break;
    }
    
    Alert.alert('회원가입 실패', errorMessage);
    return { success: false, error: errorMessage };
  }
};

export const signIn = async (email, password) => {
  try {
    console.log('로그인 시도:', email);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // 토큰 저장
    const token = await user.getIdToken();
    await saveToken(TOKEN_KEY, token);
    await saveToken(EMAIL_KEY, email);
    await saveToken(AUTH_STATE_KEY, 'loggedIn');
    
    console.log('로그인 성공:', user.uid);
    return { success: true, user };
  } catch (error) {
    console.error('로그인 실패:', error);
    
    let errorMessage = '로그인에 실패했습니다.';
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage = '등록되지 않은 이메일입니다.';
        break;
      case 'auth/wrong-password':
        errorMessage = '비밀번호가 올바르지 않습니다.';
        break;
      case 'auth/invalid-email':
        errorMessage = '유효하지 않은 이메일 형식입니다.';
        break;
      case 'auth/too-many-requests':
        errorMessage = '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.';
        break;
    }
    
    Alert.alert('로그인 실패', errorMessage);
    return { success: false, error: errorMessage };
  }
};

export const logout = async () => {
  try {
    console.log('Firebase 로그아웃 시도');
    await signOut(auth);
    
    // 토큰 삭제
    await deleteToken(TOKEN_KEY);
    await deleteToken(EMAIL_KEY);
    await deleteToken(REFRESH_TOKEN_KEY);
    await deleteToken(AUTH_STATE_KEY);
    
    console.log('Firebase 로그아웃 성공');
    return { success: true };
  } catch (error) {
    console.error('Firebase 로그아웃 실패:', error);
    Alert.alert('로그아웃 실패', '로그아웃 중 오류가 발생했습니다.');
    return { success: false, error: error.message };
  }
};

