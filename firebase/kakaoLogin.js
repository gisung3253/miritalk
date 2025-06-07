import { login, logout, getProfile, unlink } from '@react-native-seoul/kakao-login';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';

// 저장소 키 상수
const KAKAO_TOKEN_KEY = 'kakaoToken';
const KAKAO_USER_KEY = 'kakaoUser';
const KAKAO_AUTH_STATE_KEY = 'kakaoAuthState';

/**
 * 카카오 로그인 함수
 * @returns {Promise<Object>} 로그인 결과 객체
 */
export const kakaoLogin = async () => {
  try {
    console.log('카카오 로그인 시도 시작');
    
    // 카카오 로그인 실행
    const token = await login();
    console.log('카카오 토큰 획득 성공:', {
      accessToken: token.accessToken ? `${token.accessToken.substring(0, 10)}...` : '없음',
      refreshToken: token.refreshToken ? `${token.refreshToken.substring(0, 10)}...` : '없음',
      expiresIn: token.expiresIn
    });
    
    // 사용자 프로필 정보 가져오기
    const profile = await getProfile();
    console.log('카카오 프로필 획득 성공:', {
      id: profile.id,
      nickname: profile.nickname,
      profileImageUrl: profile.profileImageUrl ? '있음' : '없음'
    });
    
    // 토큰과 사용자 정보를 보안 저장소에 저장
    await SecureStore.setItemAsync(KAKAO_TOKEN_KEY, JSON.stringify(token));
    await SecureStore.setItemAsync(KAKAO_USER_KEY, JSON.stringify(profile));
    await SecureStore.setItemAsync(KAKAO_AUTH_STATE_KEY, 'loggedIn');
    
    console.log('카카오 로그인 정보 저장 완료');
    
    return {
      success: true,
      token,
      profile,
      message: '카카오 로그인에 성공했습니다.'
    };
    
  } catch (error) {
    console.error('카카오 로그인 실패:', error);
    
    // 에러 타입별 처리
    let errorMessage = '카카오 로그인에 실패했습니다.';
    
    if (error.code === 'CANCELLED') {
      errorMessage = '로그인이 취소되었습니다.';
    } else if (error.code === 'NETWORK_ERROR') {
      errorMessage = '네트워크 연결을 확인해주세요.';
    } else if (error.code === 'NOT_SUPPORTED') {
      errorMessage = '카카오톡이 설치되지 않았습니다. 카카오계정으로 로그인합니다.';
    }
    
    Alert.alert('로그인 실패', errorMessage);
    
    return {
      success: false,
      error,
      message: errorMessage
    };
  }
};

/**
 * 카카오 로그아웃 함수
 * @returns {Promise<boolean>} 로그아웃 성공 여부
 */
export const kakaoLogout = async () => {
  try {
    console.log('카카오 로그아웃 시도');
    
    // 카카오 로그아웃 실행
    await logout();
    
    // 저장된 정보 삭제
    await SecureStore.deleteItemAsync(KAKAO_TOKEN_KEY);
    await SecureStore.deleteItemAsync(KAKAO_USER_KEY);
    await SecureStore.deleteItemAsync(KAKAO_AUTH_STATE_KEY);
    
    console.log('카카오 로그아웃 완료');
    return true;
    
  } catch (error) {
    console.error('카카오 로그아웃 실패:', error);
    Alert.alert('로그아웃 실패', '로그아웃 중 오류가 발생했습니다.');
    return false;
  }
};

/**
 * 카카오 계정 연결 해제 함수
 * @returns {Promise<boolean>} 연결 해제 성공 여부
 */
export const kakaoUnlink = async () => {
  try {
    console.log('카카오 계정 연결 해제 시도');
    
    await unlink();
    
    // 저장된 정보 삭제
    await SecureStore.deleteItemAsync(KAKAO_TOKEN_KEY);
    await SecureStore.deleteItemAsync(KAKAO_USER_KEY);
    await SecureStore.deleteItemAsync(KAKAO_AUTH_STATE_KEY);
    
    console.log('카카오 계정 연결 해제 완료');
    return true;
    
  } catch (error) {
    console.error('카카오 계정 연결 해제 실패:', error);
    Alert.alert('연결 해제 실패', '계정 연결 해제 중 오류가 발생했습니다.');
    return false;
  }
};

/**
 * 저장된 카카오 사용자 정보 가져오기
 * @returns {Promise<Object|null>} 사용자 정보 또는 null
 */
export const getKakaoUserInfo = async () => {
  try {
    const userInfo = await SecureStore.getItemAsync(KAKAO_USER_KEY);
    if (userInfo) {
      const parsedInfo = JSON.parse(userInfo);
      console.log('저장된 카카오 사용자 정보 조회:', {
        id: parsedInfo.id,
        nickname: parsedInfo.nickname
      });
      return parsedInfo;
    }
    return null;
  } catch (error) {
    console.error('카카오 사용자 정보 가져오기 실패:', error);
    return null;
  }
};

/**
 * 저장된 카카오 토큰 가져오기
 * @returns {Promise<Object|null>} 토큰 정보 또는 null
 */
export const getKakaoToken = async () => {
  try {
    const token = await SecureStore.getItemAsync(KAKAO_TOKEN_KEY);
    if (token) {
      const parsedToken = JSON.parse(token);
      console.log('저장된 카카오 토큰 조회:', {
        hasAccessToken: !!parsedToken.accessToken,
        hasRefreshToken: !!parsedToken.refreshToken,
        expiresIn: parsedToken.expiresIn
      });
      return parsedToken;
    }
    return null;
  } catch (error) {
    console.error('카카오 토큰 가져오기 실패:', error);
    return null;
  }
};

/**
 * 카카오 로그인 상태 확인
 * @returns {Promise<boolean>} 로그인 상태
 */
export const isKakaoLoggedIn = async () => {
  try {
    const authState = await SecureStore.getItemAsync(KAKAO_AUTH_STATE_KEY);
    const hasToken = await getKakaoToken();
    const isLoggedIn = authState === 'loggedIn' && hasToken !== null;
    
    console.log('카카오 로그인 상태 확인:', {
      authState,
      hasToken: !!hasToken,
      isLoggedIn
    });
    
    return isLoggedIn;
  } catch (error) {
    console.error('카카오 로그인 상태 확인 실패:', error);
    return false;
  }
};

/**
 * 통합 로그아웃 (카카오 + Firebase)
 * @param {Function} firebaseLogout Firebase 로그아웃 함수
 * @returns {Promise<boolean>} 통합 로그아웃 성공 여부
 */
export const integratedLogout = async (firebaseLogout) => {
  try {
    console.log('통합 로그아웃 시작');
    
    // 카카오 로그인 상태 확인
    const isKakaoLogin = await isKakaoLoggedIn();
    
    // 카카오 로그아웃
    if (isKakaoLogin) {
      await kakaoLogout();
      console.log('카카오 로그아웃 완료');
    }
    
    // Firebase 로그아웃
    if (firebaseLogout) {
      await firebaseLogout();
      console.log('Firebase 로그아웃 완료');
    }
    
    console.log('통합 로그아웃 완료');
    return true;
    
  } catch (error) {
    console.error('통합 로그아웃 실패:', error);
    return false;
  }
};

/**
 * 통합 사용자 정보 가져오기 (카카오 + Firebase)
 * @param {Function} getFirebaseUser Firebase 사용자 정보 함수
 * @returns {Promise<Object>} 통합 사용자 정보
 */
export const getIntegratedUserInfo = async (getFirebaseUser) => {
  try {
    const kakaoUser = await getKakaoUserInfo();
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

