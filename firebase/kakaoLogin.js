import KakaoLogin from '@react-native-seoul/kakao-login';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import { signInWithCustomToken, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './config';

// Firebase Functions URL
const FUNCTIONS_BASE_URL = 'https://us-central1-calender-1676d.cloudfunctions.net';
const CREATE_CUSTOM_TOKEN_URL = `${FUNCTIONS_BASE_URL}/createKakaoCustomToken`;
const GET_USER_INFO_URL = `${FUNCTIONS_BASE_URL}/getKakaoUserInfo`;

// 저장소 키 상수
const KAKAO_TOKEN_KEY = 'kakaoToken';
const KAKAO_USER_KEY = 'kakaoUser';
const KAKAO_AUTH_STATE_KEY = 'kakaoAuthState';
const FIREBASE_USER_KEY = 'firebaseUser';

/**
 * Firebase Custom Token 방식 카카오 로그인 함수
 * @returns {Promise<Object>} 로그인 결과 객체
 */
export const firebaseKakaoLogin = async () => {
  try {
    console.log('Firebase Custom Token 카카오 로그인 시도 시작');
    
    // 카카오 로그인 실행
    const token = await KakaoLogin.login();
    console.log('카카오 토큰 획득 성공:', {
      accessToken: token.accessToken ? `${token.accessToken.substring(0, 10)}...` : '없음',
      refreshToken: token.refreshToken ? `${token.refreshToken.substring(0, 10)}...` : '없음',
      expiresIn: token.expiresIn
    });
    
    // 사용자 프로필 정보 가져오기
    const profile = await KakaoLogin.getProfile();
    console.log('카카오 프로필 획득 성공:', {
      id: profile.id,
      nickname: profile.nickname,
      profileImageUrl: profile.profileImageUrl ? '있음' : '없음',
      email: profile.email || '제공되지 않음'
    });

    // Firebase Functions를 통해 Custom Token 생성
    console.log('Firebase Functions 호출 시작');
    const customTokenResponse = await fetch(CREATE_CUSTOM_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accessToken: token.accessToken
      })
    });

    if (!customTokenResponse.ok) {
      const errorData = await customTokenResponse.json();
      throw new Error(errorData.error || 'Custom Token 생성 실패');
    }

    const customTokenData = await customTokenResponse.json();
    console.log('Custom Token 생성 성공:', {
      success: customTokenData.success,
      hasToken: !!customTokenData.customToken,
      user: customTokenData.user
    });

    // Custom Token으로 Firebase 로그인
    console.log('Firebase Custom Token 로그인 시작');
    const firebaseCredential = await signInWithCustomToken(auth, customTokenData.customToken);
    const firebaseUser = firebaseCredential.user;
    
    console.log('Firebase 로그인 성공:', {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName
    });

    // 사용자 정보 구성
    const userInfo = {
      // 카카오 정보
      kakaoId: profile.id,
      kakaoNickname: profile.nickname,
      kakaoEmail: profile.email,
      kakaoProfileImageUrl: profile.profileImageUrl,
      kakaoToken: token,
      
      // Firebase 정보
      firebaseUID: firebaseUser.uid,
      firebaseEmail: firebaseUser.email,
      firebaseDisplayName: firebaseUser.displayName,
      
      // 메타데이터
      authProvider: 'kakao',
      loginDate: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };
    
    // 로컬 저장소에 정보 저장
    await SecureStore.setItemAsync(KAKAO_TOKEN_KEY, JSON.stringify(token));
    await SecureStore.setItemAsync(KAKAO_USER_KEY, JSON.stringify(profile));
    await SecureStore.setItemAsync(KAKAO_AUTH_STATE_KEY, 'loggedIn');
    await SecureStore.setItemAsync(FIREBASE_USER_KEY, JSON.stringify({
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName
    }));
    
    console.log('카카오 로그인 정보 저장 완료');
    
    return {
      success: true,
      token,
      profile,
      firebaseUser,
      userInfo,
      customTokenData,
      message: '카카오 로그인에 성공했습니다.'
    };
    
  } catch (error) {
    console.error('Firebase Custom Token 카카오 로그인 실패:', error);
    
    // 에러 타입별 처리
    let errorMessage = '카카오 로그인에 실패했습니다.';
    
    if (error.code === 'CANCELLED') {
      errorMessage = '로그인이 취소되었습니다.';
    } else if (error.code === 'NETWORK_ERROR') {
      errorMessage = '네트워크 연결을 확인해주세요.';
    } else if (error.code === 'NOT_SUPPORTED') {
      errorMessage = '카카오톡이 설치되지 않았습니다. 카카오계정으로 로그인합니다.';
    } else if (error.code?.startsWith('auth/')) {
      errorMessage = 'Firebase 인증 중 오류가 발생했습니다.';
    } else if (error.message?.includes('Custom Token')) {
      errorMessage = '서버 인증 처리 중 오류가 발생했습니다.';
    } else if (error.message?.includes('fetch')) {
      errorMessage = '서버 연결에 실패했습니다.';
    } else if (error.message?.includes('null')) {
      errorMessage = '카카오 로그인 라이브러리 초기화 오류입니다. 앱을 재시작해주세요.';
    }
    
    // 취소가 아닌 경우에만 Alert 표시
    if (error.code !== 'CANCELLED') {
      Alert.alert('로그인 실패', errorMessage);
    }
    
    return {
      success: false,
      error,
      message: errorMessage
    };
  }
};

/**
 * Firebase Custom Token 카카오 로그아웃 함수
 * @returns {Promise<boolean>} 로그아웃 성공 여부
 */
export const firebaseKakaoLogout = async () => {
  try {
    console.log('Firebase Custom Token 카카오 로그아웃 시도');
    
    // 카카오 로그아웃 실행
    await KakaoLogin.logout();
    console.log('카카오 로그아웃 완료');
    
    // Firebase 로그아웃
    if (auth.currentUser) {
      await signOut(auth);
      console.log('Firebase 로그아웃 완료');
    }
    
    // 저장된 정보 삭제
    await SecureStore.deleteItemAsync(KAKAO_TOKEN_KEY);
    await SecureStore.deleteItemAsync(KAKAO_USER_KEY);
    await SecureStore.deleteItemAsync(KAKAO_AUTH_STATE_KEY);
    await SecureStore.deleteItemAsync(FIREBASE_USER_KEY);
    
    console.log('Firebase Custom Token 카카오 로그아웃 완료');
    return true;
    
  } catch (error) {
    console.error('Firebase Custom Token 카카오 로그아웃 실패:', error);
    Alert.alert('로그아웃 실패', '로그아웃 중 오류가 발생했습니다.');
    return false;
  }
};

/**
 * Firebase Custom Token 카카오 로그인 상태 확인
 * @returns {Promise<Object>} 로그인 상태 정보
 */
export const checkFirebaseKakaoLoginStatus = async () => {
  try {
    // Firebase 인증 상태 확인
    const firebaseUser = auth.currentUser;
    
    // 로컬 저장소 상태 확인
    const kakaoAuthState = await SecureStore.getItemAsync(KAKAO_AUTH_STATE_KEY);
    const kakaoUserInfo = await SecureStore.getItemAsync(KAKAO_USER_KEY);
    const kakaoToken = await SecureStore.getItemAsync(KAKAO_TOKEN_KEY);
    const firebaseUserInfo = await SecureStore.getItemAsync(FIREBASE_USER_KEY);
    
    const isFirebaseLoggedIn = !!firebaseUser;
    const isKakaoLoggedIn = kakaoAuthState === 'loggedIn' && !!kakaoUserInfo && !!kakaoToken;
    const isIntegratedLoggedIn = isFirebaseLoggedIn && isKakaoLoggedIn;
    
    // Firebase 사용자가 카카오 로그인으로 생성된 사용자인지 확인
    const isKakaoFirebaseUser = firebaseUser && firebaseUser.uid.startsWith('kakao_');
    
    console.log('Firebase Custom Token 카카오 로그인 상태 확인:', {
      firebase: isFirebaseLoggedIn,
      kakao: isKakaoLoggedIn,
      integrated: isIntegratedLoggedIn,
      isKakaoFirebaseUser,
      firebaseUID: firebaseUser?.uid
    });
    
    return {
      firebase: isFirebaseLoggedIn,
      kakao: isKakaoLoggedIn,
      integrated: isIntegratedLoggedIn,
      isKakaoFirebaseUser,
      firebaseUser,
      kakaoUserInfo: kakaoUserInfo ? JSON.parse(kakaoUserInfo) : null,
      kakaoToken: kakaoToken ? JSON.parse(kakaoToken) : null,
      firebaseUserInfo: firebaseUserInfo ? JSON.parse(firebaseUserInfo) : null
    };
  } catch (error) {
    console.error('Firebase Custom Token 카카오 로그인 상태 확인 실패:', error);
    return {
      firebase: false,
      kakao: false,
      integrated: false,
      isKakaoFirebaseUser: false,
      firebaseUser: null,
      kakaoUserInfo: null,
      kakaoToken: null,
      firebaseUserInfo: null
    };
  }
};

/**
 * 통합 카카오 사용자 정보 가져오기 (Firestore + 로컬)
 * @returns {Promise<Object>} 통합 사용자 정보
 */
export const getFirebaseKakaoUserInfo = async () => {
  try {
    const loginStatus = await checkFirebaseKakaoLoginStatus();
    
    if (!loginStatus.integrated) {
      return null;
    }
    
    // Firestore에서 사용자 정보 가져오기
    let firestoreUserInfo = null;
    if (db && loginStatus.firebaseUser) {
      try {
        const userRef = doc(db, 'users', loginStatus.firebaseUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          firestoreUserInfo = userDoc.data();
        }
      } catch (error) {
        console.error('Firestore 카카오 사용자 정보 가져오기 실패:', error);
      }
    }
    
    // 표시용 이름 결정
    let displayName = '카카오 사용자';
    if (firestoreUserInfo?.displayName) {
      displayName = firestoreUserInfo.displayName;
    } else if (firestoreUserInfo?.kakaoNickname) {
      displayName = firestoreUserInfo.kakaoNickname;
    } else if (loginStatus.kakaoUserInfo?.nickname) {
      displayName = loginStatus.kakaoUserInfo.nickname;
    }
    
    return {
      firebaseUID: loginStatus.firebaseUser?.uid,
      email: firestoreUserInfo?.email || loginStatus.kakaoUserInfo?.email,
      displayName,
      authProvider: 'kakao',
      kakaoId: firestoreUserInfo?.kakaoId || loginStatus.kakaoUserInfo?.id,
      kakaoNickname: firestoreUserInfo?.kakaoNickname || loginStatus.kakaoUserInfo?.nickname,
      profileImageUrl: firestoreUserInfo?.kakaoProfileImageUrl || loginStatus.kakaoUserInfo?.profileImageUrl,
      firestoreData: firestoreUserInfo,
      kakaoData: loginStatus.kakaoUserInfo,
      firebaseData: loginStatus.firebaseUserInfo,
      kakaoToken: loginStatus.kakaoToken
    };
  } catch (error) {
    console.error('통합 카카오 사용자 정보 가져오기 실패:', error);
    return null;
  }
};

/**
 * 카카오 계정 연결 해제 함수 (Firebase Custom Token 방식)
 * @returns {Promise<boolean>} 연결 해제 성공 여부
 */
export const firebaseKakaoUnlink = async () => {
  try {
    console.log('Firebase Custom Token 카카오 계정 연결 해제 시도');
    
    // 카카오 계정 연결 해제
    await KakaoLogin.unlink();
    console.log('카카오 계정 연결 해제 완료');
    
    // Firebase 로그아웃 (Custom Token으로 생성된 사용자 삭제는 별도 처리 필요)
    if (auth.currentUser) {
      await signOut(auth);
      console.log('Firebase 로그아웃 완료');
    }
    
    // 저장된 정보 삭제
    await SecureStore.deleteItemAsync(KAKAO_TOKEN_KEY);
    await SecureStore.deleteItemAsync(KAKAO_USER_KEY);
    await SecureStore.deleteItemAsync(KAKAO_AUTH_STATE_KEY);
    await SecureStore.deleteItemAsync(FIREBASE_USER_KEY);
    
    console.log('Firebase Custom Token 카카오 계정 연결 해제 완료');
    return true;
    
  } catch (error) {
    console.error('Firebase Custom Token 카카오 계정 연결 해제 실패:', error);
    Alert.alert('연결 해제 실패', '계정 연결 해제 중 오류가 발생했습니다.');
    return false;
  }
};

/**
 * Functions를 통한 사용자 정보 조회
 * @param {string} uid Firebase UID
 * @returns {Promise<Object>} 사용자 정보
 */
export const getKakaoUserInfoFromServer = async (uid) => {
  try {
    const response = await fetch(`${GET_USER_INFO_URL}?uid=${uid}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error('사용자 정보 조회 실패');
    }

    const data = await response.json();
    return data.success ? data.user : null;
  } catch (error) {
    console.error('서버에서 사용자 정보 조회 실패:', error);
    return null;
  }
};

// 기존 함수들과의 호환성을 위한 별칭
export const kakaoLogin = firebaseKakaoLogin;
export const kakaoLogout = firebaseKakaoLogout;
export const kakaoUnlink = firebaseKakaoUnlink;
export const isKakaoLoggedIn = async () => {
  const status = await checkFirebaseKakaoLoginStatus();
  return status.integrated;
};
export const getKakaoUserInfo = getFirebaseKakaoUserInfo;
export const getKakaoToken = async () => {
  const status = await checkFirebaseKakaoLoginStatus();
  return status.kakaoToken;
};

// 통합 함수들
export const integratedLogout = async (firebaseLogout) => {
  try {
    console.log('통합 로그아웃 시작');
    
    // 카카오 로그인 상태 확인
    const loginStatus = await checkFirebaseKakaoLoginStatus();
    
    // 카카오 로그아웃
    if (loginStatus.kakao) {
      await firebaseKakaoLogout();
      console.log('카카오 로그아웃 완료');
    }
    
    // 추가 Firebase 로그아웃 (다른 인증 방식용)
    if (firebaseLogout) {
      await firebaseLogout();
      console.log('추가 Firebase 로그아웃 완료');
    }
    
    console.log('통합 로그아웃 완료');
    return true;
    
  } catch (error) {
    console.error('통합 로그아웃 실패:', error);
    return false;
  }
};

export const getIntegratedUserInfo = async (getFirebaseUser) => {
  try {
    const kakaoUser = await getFirebaseKakaoUserInfo();
    const firebaseUser = getFirebaseUser ? await getFirebaseUser() : null;
    
    return {
      kakao: kakaoUser,
      firebase: firebaseUser,
      hasKakao: !!kakaoUser,
      hasFirebase: !!firebaseUser
    };
  } catch (error) {
    console.error('통합 사용자 정보 가져오기 실패:', error);
    return {
      kakao: null,
      firebase: null,
      hasKakao: false,
      hasFirebase: false
    };
  }
};

