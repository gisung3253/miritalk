import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from './config';
import { Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { isAppleLoggedIn, getAppleUserInfo } from './appleLogin';
import { isKakaoLoggedIn, getKakaoUserInfo } from './kakaoLogin';

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

// 토큰 자동 갱신 함수
export const getValidToken = async (forceRefresh = false) => {
  try {
    const currentUser = auth.currentUser;
    console.log('토큰 갱신 시도, 현재 사용자:', currentUser ? currentUser.email : '없음');
    
    if (!currentUser) {
      console.log('토큰 갱신 실패: 로그인된 사용자가 없습니다.');
      return null;
    }
    
    // 저장된 토큰 확인
    const savedToken = await SecureStore.getItemAsync(TOKEN_KEY);
    console.log('저장된 토큰:', savedToken ? `${savedToken.substring(0, 15)}...` : '없음');
    
    // 토큰을 강제로 갱신하거나 저장된 토큰이 없는 경우 새 토큰 발급
    const token = await currentUser.getIdToken(forceRefresh);
    console.log('새로 발급된 토큰:', token ? `${token.substring(0, 15)}...` : '없음');
    
    if (token) {
      await saveToken(TOKEN_KEY, token);
      console.log('토큰 갱신 성공');
    }
    
    return token;
  } catch (error) {
    console.error('토큰 갱신 실패:', error);
    return null;
  }
};

// 자동 토큰 갱신 타이머 설정
export const setupTokenRefresh = () => {
  console.log('자동 토큰 갱신 타이머 설정 중...');
  
  if (typeof window !== 'undefined') {
    // 기존 타이머가 있으면 제거
    if (window.tokenRefreshTimer) {
      console.log('기존 토큰 갱신 타이머 제거');
      clearInterval(window.tokenRefreshTimer);
    }
    
    // 주기적으로 토큰 갱신
    window.tokenRefreshTimer = setInterval(async () => {
      const isLoggedIn = !!auth.currentUser;
      console.log('토큰 자동 갱신 시작, 로그인 상태:', isLoggedIn);
      
      if (isLoggedIn) {
        await getValidToken(true);
        console.log('토큰 자동 갱신 완료, 다음 갱신까지 남은 시간:', Math.round(TOKEN_REFRESH_INTERVAL/60000), '분');
      } else {
        console.log('사용자가 로그아웃 상태입니다. 토큰 갱신 생략');
      }
    }, TOKEN_REFRESH_INTERVAL);
    
    console.log('자동 토큰 갱신 타이머 설정 완료, 주기:', Math.round(TOKEN_REFRESH_INTERVAL/60000), '분');
    
    return () => {
      if (window.tokenRefreshTimer) {
        clearInterval(window.tokenRefreshTimer);
        console.log('토큰 갱신 타이머 제거됨');
      }
    };
  }
  return null;
};

// 통합 로그인 상태 확인 함수
export const checkIntegratedLoginStatus = async () => {
  try {
    console.log('통합 로그인 상태 확인 시작');
    
    // Firebase 로그인 상태 확인
    const currentUser = auth.currentUser;
    const firebaseLoggedIn = !!currentUser;
    console.log('Firebase 로그인 상태:', firebaseLoggedIn);
    
    // Apple 로그인 상태 확인
    let appleLoggedIn = false;
    let appleUserInfo = null;
    try {
      appleLoggedIn = await isAppleLoggedIn();
      if (appleLoggedIn) {
        appleUserInfo = await getAppleUserInfo();
      }
      console.log('Apple 로그인 상태:', appleLoggedIn);
    } catch (error) {
      console.log('Apple 로그인 상태 확인 중 오류 (무시):', error.message);
    }
    
    // 카카오 로그인 상태 확인
    let kakaoLoggedIn = false;
    let kakaoUserInfo = null;
    try {
      kakaoLoggedIn = await isKakaoLoggedIn();
      if (kakaoLoggedIn) {
        kakaoUserInfo = await getKakaoUserInfo();
      }
      console.log('카카오 로그인 상태:', kakaoLoggedIn);
    } catch (error) {
      console.log('카카오 로그인 상태 확인 중 오류 (무시):', error.message);
    }
    
    // 통합 로그인 상태 결정
    const isLoggedIn = firebaseLoggedIn || appleLoggedIn || kakaoLoggedIn;
    
    console.log('통합 로그인 상태 확인 결과:', {
      firebase: firebaseLoggedIn,
      apple: appleLoggedIn,
      kakao: kakaoLoggedIn,
      integrated: isLoggedIn
    });
    
    return {
      isLoggedIn,
      firebase: {
        loggedIn: firebaseLoggedIn,
        user: currentUser
      },
      apple: {
        loggedIn: appleLoggedIn,
        userInfo: appleUserInfo
      },
      kakao: {
        loggedIn: kakaoLoggedIn,
        userInfo: kakaoUserInfo
      }
    };
  } catch (error) {
    console.error('통합 로그인 상태 확인 실패:', error);
    return {
      isLoggedIn: false,
      firebase: { loggedIn: false, user: null },
      apple: { loggedIn: false, userInfo: null },
      kakao: { loggedIn: false, userInfo: null }
    };
  }
};

// 세션 유효성 검증 함수 (통합 로그인 지원)
export const verifySession = async () => {
  try {
    console.log('통합 세션 검증 시작');
    
    // 통합 로그인 상태 확인
    const loginStatus = await checkIntegratedLoginStatus();
    
    if (loginStatus.isLoggedIn) {
      console.log('세션 검증 성공 - 로그인 상태 유지');
      
      // Firebase 사용자가 있는 경우 토큰 갱신
      if (loginStatus.firebase.loggedIn) {
        const token = await getValidToken();
        if (token) {
          await saveToken(AUTH_STATE_KEY, 'loggedIn');
        }
      } else {
        // 소셜 로그인만 있는 경우
        await saveToken(AUTH_STATE_KEY, 'loggedIn');
      }
      
      return true;
    } else {
      console.log('세션 검증 실패 - 로그인 필요');
      await deleteToken(AUTH_STATE_KEY);
      return false;
    }
  } catch (error) {
    console.error('통합 세션 검증 실패:', error);
    return false;
  }
};

// 인증 상태 변경 리스너 설정 (통합 로그인 지원)
export const setupAuthStateListener = (callback) => {
  console.log('통합 인증 상태 변경 리스너 설정 중...');
  
  // Firebase 인증 상태 변경 리스너
  const firebaseUnsubscribe = onAuthStateChanged(auth, async (user) => {
    console.log('Firebase 인증 상태 변경 감지:', user ? `${user.email} 로그인됨` : '로그아웃됨');
    
    if (user) {
      // Firebase 사용자가 로그인됨
      console.log('Firebase 사용자 로그인 상태, 토큰 저장 중...');
      const token = await user.getIdToken();
      console.log('Firebase 사용자 토큰 획득:', token ? `${token.substring(0, 15)}...` : '없음');
      
      await saveToken(TOKEN_KEY, token);
      await saveToken(EMAIL_KEY, user.email || '');
      await saveToken(AUTH_STATE_KEY, 'loggedIn');
      console.log('Firebase 인증 상태를 저장했습니다.');
      
      setupTokenRefresh();
    }
    
    // 통합 로그인 상태 확인 후 콜백 호출
    const loginStatus = await checkIntegratedLoginStatus();
    if (callback) callback(loginStatus.isLoggedIn);
  });
  
  // 주기적으로 소셜 로그인 상태 확인 (5초마다)
  const socialLoginChecker = setInterval(async () => {
    try {
      const loginStatus = await checkIntegratedLoginStatus();
      // 현재 상태와 이전 상태가 다르면 콜백 호출
      if (callback) {
        // 간단한 상태 변화 감지를 위해 매번 호출하지 않고 필요시에만 호출
        // 실제 구현에서는 이전 상태를 저장해서 비교할 수 있음
      }
    } catch (error) {
      console.log('소셜 로그인 상태 확인 중 오류:', error.message);
    }
  }, 5000);
  
  // 정리 함수 반환
  return () => {
    firebaseUnsubscribe();
    clearInterval(socialLoginChecker);
    console.log('통합 인증 상태 리스너 정리 완료');
  };
};

// 통합 로그아웃 함수
export const integratedLogout = async () => {
  try {
    console.log('통합 로그아웃 시작...');
    
    // Firebase 로그아웃
    try {
      if (auth.currentUser) {
        await signOut(auth);
        console.log('Firebase 로그아웃 완료');
      }
    } catch (error) {
      console.error('Firebase 로그아웃 오류:', error);
    }
    
    // Apple 로그아웃
    try {
      const { appleLogout } = await import('./appleLogin');
      await appleLogout();
      console.log('Apple 로그아웃 완료');
    } catch (error) {
      console.log('Apple 로그아웃 중 오류 (무시):', error.message);
    }
    
    // 카카오 로그아웃
    try {
      const { kakaoLogout } = await import('./kakaoLogin');
      await kakaoLogout();
      console.log('카카오 로그아웃 완료');
    } catch (error) {
      console.log('카카오 로그아웃 중 오류 (무시):', error.message);
    }
    
    // 모든 토큰 및 인증 상태 삭제
    await deleteToken(TOKEN_KEY);
    await deleteToken(EMAIL_KEY);
    await deleteToken(REFRESH_TOKEN_KEY);
    await deleteToken(AUTH_STATE_KEY);
    console.log('모든 인증 정보 삭제 완료');
    
    // 타이머 제거
    if (typeof window !== 'undefined' && window.tokenRefreshTimer) {
      clearInterval(window.tokenRefreshTimer);
      console.log('토큰 갱신 타이머 중지');
    }
    
    console.log('통합 로그아웃 완료');
    return true;
  } catch (error) {
    console.error('통합 로그아웃 오류:', error);
    throw error;
  }
};

// 통합 사용자 정보 가져오기
export const getIntegratedUserInfo = async () => {
  try {
    const loginStatus = await checkIntegratedLoginStatus();
    
    let userInfo = {
      isLoggedIn: loginStatus.isLoggedIn,
      loginMethod: null,
      displayName: '사용자',
      email: null,
      profileImage: null
    };
    
    if (loginStatus.firebase.loggedIn) {
      userInfo.loginMethod = 'firebase';
      userInfo.displayName = loginStatus.firebase.user.email?.split('@')[0] || '사용자';
      userInfo.email = loginStatus.firebase.user.email;
    } else if (loginStatus.apple.loggedIn) {
      userInfo.loginMethod = 'apple';
      const appleUser = loginStatus.apple.userInfo;
      if (appleUser.fullName && (appleUser.fullName.givenName || appleUser.fullName.familyName)) {
        userInfo.displayName = `${appleUser.fullName.givenName || ''} ${appleUser.fullName.familyName || ''}`.trim();
      } else if (appleUser.email) {
        userInfo.displayName = appleUser.email.split('@')[0];
      }
      userInfo.email = appleUser.email;
    } else if (loginStatus.kakao.loggedIn) {
      userInfo.loginMethod = 'kakao';
      const kakaoUser = loginStatus.kakao.userInfo;
      userInfo.displayName = kakaoUser.nickname || '사용자';
      userInfo.profileImage = kakaoUser.profileImageUrl;
    }
    
    console.log('통합 사용자 정보:', userInfo);
    return userInfo;
  } catch (error) {
    console.error('통합 사용자 정보 가져오기 실패:', error);
    return {
      isLoggedIn: false,
      loginMethod: null,
      displayName: '사용자',
      email: null,
      profileImage: null
    };
  }
};

export const signUp = async (email, password) => {
  try {
    console.log('회원가입 시도:', email);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('Firebase 회원가입 성공');
    
    // 회원가입 후 토큰 저장
    const token = await userCredential.user.getIdToken();
    console.log('토큰 획득:', token ? `${token.substring(0, 15)}...` : '없음');
    
    await saveToken(TOKEN_KEY, token);
    await saveToken(EMAIL_KEY, email);
    await saveToken(AUTH_STATE_KEY, 'loggedIn');
    
    // 자동 토큰 갱신 설정
    setupTokenRefresh();
    console.log('회원가입 및 인증 프로세스 완료');
    
    return userCredential.user;
  } catch (error) {
    console.error("회원가입 오류:", error.code, error.message);
    throw error;
  }
};

export const signIn = async (email, password) => {
  try {
    // 이메일 형식 검증
    if (!email || !password) {
      Alert.alert('경고', '이메일과 비밀번호를 입력해주세요.');
      return null;
    }

    console.log('로그인 시도:', email);
    // Firebase 인증 시도
    const result = await signInWithEmailAndPassword(auth, email, password);
    console.log('Firebase 로그인 성공');
    
    // 로그인 성공 시 토큰 저장
    const token = await result.user.getIdToken();
    console.log('Firebase 토큰 획득:', token ? token.substring(0, 10) + '...' : '없음');
    
    await saveToken(TOKEN_KEY, token);
    await saveToken(EMAIL_KEY, email);
    await saveToken(AUTH_STATE_KEY, 'loggedIn');
    
    // 자동 토큰 갱신 설정
    setupTokenRefresh();
    console.log('자동 토큰 갱신 설정 완료');
    
    return result.user;
  } catch (error) {
    console.error('로그인 오류:', error.code, error.message);
    // Firebase 오류 코드에 따른 사용자 친화적인 메시지
    if (error.code === 'auth/invalid-email') {
      Alert.alert('경고', '유효하지 않은 이메일 형식입니다.');
    } else if (error.code === 'auth/user-not-found') {
      Alert.alert('경고', '이메일이 존재하지 않습니다. 회원가입을 먼저 해주세요.');
    } else if (error.code === 'auth/wrong-password') {
      Alert.alert('경고', '비밀번호가 틀렸습니다. 다시 시도해주세요.');
    } else if (error.code === 'auth/invalid-credential') {
      Alert.alert('경고', '이메일과 비밀번호를 다시 확인해주세요.');
    } else {
      Alert.alert('경고', '로그인에 실패했습니다. 다시 시도해주세요.');
    }
    return null;
  }
};

// 기존 logout 함수는 integratedLogout으로 대체
export const logout = integratedLogout;

