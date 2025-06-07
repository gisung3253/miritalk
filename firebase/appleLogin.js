import * as AppleAuthentication from 'expo-apple-authentication';
import * as SecureStore from 'expo-secure-store';
import { Alert, Platform } from 'react-native';

// 저장소 키 상수
const APPLE_USER_KEY = 'appleUser';
const APPLE_AUTH_STATE_KEY = 'appleAuthState';

/**
 * Apple 로그인 함수
 * @returns {Promise<Object>} 로그인 결과 객체
 */
export const appleLogin = async () => {
  try {
    // iOS 플랫폼 확인
    if (Platform.OS !== 'ios') {
      Alert.alert('알림', 'Apple 로그인은 iOS에서만 사용 가능합니다.');
      return {
        success: false,
        message: 'Apple 로그인은 iOS에서만 사용 가능합니다.'
      };
    }

    // Apple 로그인 지원 여부 확인
    const isAvailable = await AppleAuthentication.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert('알림', '이 기기에서는 Apple 로그인을 사용할 수 없습니다.');
      return {
        success: false,
        message: '이 기기에서는 Apple 로그인을 사용할 수 없습니다.'
      };
    }

    console.log('Apple 로그인 시도 시작');
    
    // Apple 로그인 실행
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    console.log('Apple 로그인 성공:', {
      user: credential.user,
      email: credential.email || '제공되지 않음',
      fullName: credential.fullName ? `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim() : '제공되지 않음'
    });

    // 사용자 정보 구성
    const userInfo = {
      user: credential.user,
      email: credential.email,
      fullName: credential.fullName,
      identityToken: credential.identityToken,
      authorizationCode: credential.authorizationCode,
      realUserStatus: credential.realUserStatus,
      state: credential.state,
      loginDate: new Date().toISOString()
    };

    // 사용자 정보를 보안 저장소에 저장
    await SecureStore.setItemAsync(APPLE_USER_KEY, JSON.stringify(userInfo));
    await SecureStore.setItemAsync(APPLE_AUTH_STATE_KEY, 'loggedIn');

    console.log('Apple 로그인 정보 저장 완료');

    // 사용자 이름 처리 (이름이 없는 경우 이메일 사용)
    let displayName = '사용자';
    if (credential.fullName && (credential.fullName.givenName || credential.fullName.familyName)) {
      displayName = `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim();
    } else if (credential.email) {
      displayName = credential.email.split('@')[0];
    }

    return {
      success: true,
      userInfo,
      displayName,
      message: 'Apple 로그인에 성공했습니다.'
    };

  } catch (error) {
    console.error('Apple 로그인 실패:', error);

    // 에러 타입별 처리
    let errorMessage = 'Apple 로그인에 실패했습니다.';
    
    if (error.code === 'ERR_CANCELED') {
      errorMessage = '로그인이 취소되었습니다.';
    } else if (error.code === 'ERR_INVALID_RESPONSE') {
      errorMessage = '잘못된 응답입니다. 다시 시도해주세요.';
    } else if (error.code === 'ERR_NOT_HANDLED') {
      errorMessage = '로그인 처리 중 오류가 발생했습니다.';
    } else if (error.code === 'ERR_UNKNOWN') {
      errorMessage = '알 수 없는 오류가 발생했습니다.';
    }

    // 취소가 아닌 경우에만 Alert 표시
    if (error.code !== 'ERR_CANCELED') {
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
 * Apple 로그아웃 함수
 * @returns {Promise<boolean>} 로그아웃 성공 여부
 */
export const appleLogout = async () => {
  try {
    console.log('Apple 로그아웃 시도');
    
    // 저장된 정보 삭제
    await SecureStore.deleteItemAsync(APPLE_USER_KEY);
    await SecureStore.deleteItemAsync(APPLE_AUTH_STATE_KEY);
    
    console.log('Apple 로그아웃 완료');
    return true;
    
  } catch (error) {
    console.error('Apple 로그아웃 실패:', error);
    Alert.alert('로그아웃 실패', '로그아웃 중 오류가 발생했습니다.');
    return false;
  }
};

/**
 * 저장된 Apple 사용자 정보 가져오기
 * @returns {Promise<Object|null>} 사용자 정보 또는 null
 */
export const getAppleUserInfo = async () => {
  try {
    const userInfo = await SecureStore.getItemAsync(APPLE_USER_KEY);
    if (userInfo) {
      const parsedInfo = JSON.parse(userInfo);
      console.log('저장된 Apple 사용자 정보 조회:', {
        user: parsedInfo.user,
        email: parsedInfo.email || '제공되지 않음'
      });
      return parsedInfo;
    }
    return null;
  } catch (error) {
    console.error('Apple 사용자 정보 가져오기 실패:', error);
    return null;
  }
};

/**
 * Apple 로그인 상태 확인
 * @returns {Promise<boolean>} 로그인 상태
 */
export const isAppleLoggedIn = async () => {
  try {
    const authState = await SecureStore.getItemAsync(APPLE_AUTH_STATE_KEY);
    const hasUserInfo = await getAppleUserInfo();
    const isLoggedIn = authState === 'loggedIn' && hasUserInfo !== null;
    
    console.log('Apple 로그인 상태 확인:', {
      authState,
      hasUserInfo: !!hasUserInfo,
      isLoggedIn
    });
    
    return isLoggedIn;
  } catch (error) {
    console.error('Apple 로그인 상태 확인 실패:', error);
    return false;
  }
};

/**
 * Apple 로그인 자격 증명 상태 확인
 * @returns {Promise<string>} 자격 증명 상태
 */
export const checkAppleCredentialState = async () => {
  try {
    if (Platform.OS !== 'ios') {
      return 'NOT_SUPPORTED';
    }

    const userInfo = await getAppleUserInfo();
    if (!userInfo || !userInfo.user) {
      return 'NOT_FOUND';
    }

    const credentialState = await AppleAuthentication.getCredentialStateAsync(userInfo.user);
    
    console.log('Apple 자격 증명 상태:', credentialState);
    
    return credentialState;
  } catch (error) {
    console.error('Apple 자격 증명 상태 확인 실패:', error);
    return 'UNKNOWN';
  }
};

/**
 * 통합 로그아웃 (Apple + Firebase)
 * @param {Function} firebaseLogout Firebase 로그아웃 함수
 * @returns {Promise<boolean>} 통합 로그아웃 성공 여부
 */
export const integratedAppleLogout = async (firebaseLogout) => {
  try {
    console.log('통합 Apple 로그아웃 시작');
    
    // Apple 로그인 상태 확인
    const isAppleLogin = await isAppleLoggedIn();
    
    // Apple 로그아웃
    if (isAppleLogin) {
      await appleLogout();
      console.log('Apple 로그아웃 완료');
    }
    
    // Firebase 로그아웃
    if (firebaseLogout) {
      await firebaseLogout();
      console.log('Firebase 로그아웃 완료');
    }
    
    console.log('통합 Apple 로그아웃 완료');
    return true;
    
  } catch (error) {
    console.error('통합 Apple 로그아웃 실패:', error);
    return false;
  }
};

/**
 * 통합 사용자 정보 가져오기 (Apple + Firebase)
 * @param {Function} getFirebaseUser Firebase 사용자 정보 함수
 * @returns {Promise<Object>} 통합 사용자 정보
 */
export const getIntegratedAppleUserInfo = async (getFirebaseUser) => {
  try {
    const appleUser = await getAppleUserInfo();
    const firebaseUser = getFirebaseUser ? await getFirebaseUser() : null;
    
    return {
      apple: appleUser,
      firebase: firebaseUser,
      hasApple: !!appleUser,
      hasFirebase: !!firebaseUser
    };
  } catch (error) {
    console.error('통합 Apple 사용자 정보 가져오기 실패:', error);
    return {
      apple: null,
      firebase: null,
      hasApple: false,
      hasFirebase: false
    };
  }
};

