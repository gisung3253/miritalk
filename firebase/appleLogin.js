import * as AppleAuthentication from 'expo-apple-authentication';
import * as SecureStore from 'expo-secure-store';
import { Alert, Platform } from 'react-native';
import { signInWithCredential, OAuthProvider, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

// 저장소 키 상수
const APPLE_USER_KEY = 'appleUser';
const APPLE_AUTH_STATE_KEY = 'appleAuthState';
const FIREBASE_USER_KEY = 'firebaseUser';

/**
 * 정식 Firebase Apple 로그인 함수
 * @returns {Promise<Object>} 로그인 결과 객체
 */
export const firebaseAppleLogin = async () => {
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

    console.log('Firebase Apple 로그인 시도 시작');
    
    // Apple 로그인 실행
    const appleCredential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    console.log('Apple 로그인 성공:', {
      user: appleCredential.user,
      email: appleCredential.email || '제공되지 않음',
      fullName: appleCredential.fullName ? `${appleCredential.fullName.givenName || ''} ${appleCredential.fullName.familyName || ''}`.trim() : '제공되지 않음'
    });

    // Firebase Apple 자격 증명 생성
    const provider = new OAuthProvider('apple.com');
    const firebaseCredential = provider.credential({
      idToken: appleCredential.identityToken,
      rawNonce: appleCredential.nonce, // nonce가 있는 경우
    });

    console.log('Firebase 자격 증명 생성 완료');

    // Firebase에 로그인
    const firebaseUserCredential = await signInWithCredential(auth, firebaseCredential);
    const firebaseUser = firebaseUserCredential.user;

    console.log('Firebase 로그인 성공:', {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName
    });

    // 사용자 정보 구성
    const userInfo = {
      // Apple 정보
      appleUser: appleCredential.user,
      appleEmail: appleCredential.email,
      appleFullName: appleCredential.fullName,
      identityToken: appleCredential.identityToken,
      authorizationCode: appleCredential.authorizationCode,
      realUserStatus: appleCredential.realUserStatus,
      
      // Firebase 정보
      firebaseUID: firebaseUser.uid,
      firebaseEmail: firebaseUser.email,
      firebaseDisplayName: firebaseUser.displayName,
      
      // 메타데이터
      authProvider: 'apple',
      loginDate: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };

    // Firestore에 사용자 정보 저장/업데이트 (db가 있는 경우에만)
    if (db) {
      try {
        await saveUserToFirestore(firebaseUser, appleCredential);
        console.log('Firestore 사용자 정보 저장 완료');
      } catch (error) {
        console.error('Firestore 사용자 정보 저장 실패:', error);
        // Firestore 저장 실패해도 로그인은 성공으로 처리
      }
    } else {
      console.log('Firestore가 초기화되지 않음 - 사용자 정보 저장 건너뜀');
    }

    // 로컬 저장소에 정보 저장
    await SecureStore.setItemAsync(APPLE_USER_KEY, JSON.stringify(userInfo));
    await SecureStore.setItemAsync(APPLE_AUTH_STATE_KEY, 'loggedIn');
    await SecureStore.setItemAsync(FIREBASE_USER_KEY, JSON.stringify({
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName
    }));

    console.log('사용자 정보 저장 완료');

    // 사용자 이름 처리
    let displayName = firebaseUser.displayName || '사용자';
    if (!displayName || displayName === '사용자') {
      if (appleCredential.fullName && (appleCredential.fullName.givenName || appleCredential.fullName.familyName)) {
        displayName = `${appleCredential.fullName.givenName || ''} ${appleCredential.fullName.familyName || ''}`.trim();
      } else if (firebaseUser.email) {
        displayName = firebaseUser.email.split('@')[0];
      }
    }

    return {
      success: true,
      userInfo,
      firebaseUser,
      displayName,
      message: 'Apple 로그인에 성공했습니다.'
    };

  } catch (error) {
    console.error('Firebase Apple 로그인 실패:', error);

    // 에러 타입별 처리
    let errorMessage = 'Apple 로그인에 실패했습니다.';
    
    if (error.code === 'ERR_CANCELED') {
      errorMessage = '로그인이 취소되었습니다.';
    } else if (error.code === 'auth/invalid-credential') {
      errorMessage = '인증 정보가 유효하지 않습니다.';
    } else if (error.code === 'auth/account-exists-with-different-credential') {
      errorMessage = '다른 로그인 방법으로 이미 등록된 계정입니다.';
    } else if (error.code === 'auth/operation-not-allowed') {
      errorMessage = 'Apple 로그인이 활성화되지 않았습니다.';
    } else if (error.code === 'auth/user-disabled') {
      errorMessage = '비활성화된 계정입니다.';
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
 * Firestore에 사용자 정보 저장/업데이트
 * @param {Object} firebaseUser Firebase 사용자 객체
 * @param {Object} appleCredential Apple 자격 증명
 */
const saveUserToFirestore = async (firebaseUser, appleCredential) => {
  try {
    if (!db) {
      console.log('Firestore가 초기화되지 않음');
      return;
    }

    const userRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userRef);

    const userData = {
      // Firebase 정보
      firebaseUID: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      
      // Apple 정보
      authProvider: 'apple',
      appleUserID: appleCredential.user,
      appleEmail: appleCredential.email,
      
      // 메타데이터
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    if (userDoc.exists()) {
      // 기존 사용자 업데이트
      await updateDoc(userRef, userData);
      console.log('기존 사용자 정보 업데이트 완료');
    } else {
      // 새 사용자 생성
      userData.createdAt = serverTimestamp();
      userData.preferences = {
        notifications: true,
        theme: 'light',
        language: 'ko'
      };
      
      // Apple 이름 정보가 있는 경우 저장 (첫 로그인 시에만 제공됨)
      if (appleCredential.fullName) {
        userData.appleFullName = {
          givenName: appleCredential.fullName.givenName,
          familyName: appleCredential.fullName.familyName
        };
      }
      
      await setDoc(userRef, userData);
      console.log('새 사용자 정보 생성 완료');
    }
  } catch (error) {
    console.error('Firestore 사용자 정보 저장 실패:', error);
    throw error; // 상위로 에러 전달
  }
};

/**
 * Firebase Apple 로그아웃 함수
 * @returns {Promise<boolean>} 로그아웃 성공 여부
 */
export const firebaseAppleLogout = async () => {
  try {
    console.log('Firebase Apple 로그아웃 시도');
    
    // Firebase 로그아웃
    await signOut(auth);
    console.log('Firebase 로그아웃 완료');
    
    // 로컬 저장소 정보 삭제
    await SecureStore.deleteItemAsync(APPLE_USER_KEY);
    await SecureStore.deleteItemAsync(APPLE_AUTH_STATE_KEY);
    await SecureStore.deleteItemAsync(FIREBASE_USER_KEY);
    
    console.log('Firebase Apple 로그아웃 완료');
    return true;
    
  } catch (error) {
    console.error('Firebase Apple 로그아웃 실패:', error);
    Alert.alert('로그아웃 실패', '로그아웃 중 오류가 발생했습니다.');
    return false;
  }
};

/**
 * Firebase Apple 로그인 상태 확인
 * @returns {Promise<Object>} 로그인 상태 정보
 */
export const checkFirebaseAppleLoginStatus = async () => {
  try {
    // Firebase 인증 상태 확인
    const firebaseUser = auth.currentUser;
    
    // 로컬 저장소 상태 확인
    const appleAuthState = await SecureStore.getItemAsync(APPLE_AUTH_STATE_KEY);
    const appleUserInfo = await SecureStore.getItemAsync(APPLE_USER_KEY);
    const firebaseUserInfo = await SecureStore.getItemAsync(FIREBASE_USER_KEY);
    
    const isFirebaseLoggedIn = !!firebaseUser;
    const isAppleLoggedIn = appleAuthState === 'loggedIn' && !!appleUserInfo;
    const isIntegratedLoggedIn = isFirebaseLoggedIn && isAppleLoggedIn;
    
    console.log('Firebase Apple 로그인 상태 확인:', {
      firebase: isFirebaseLoggedIn,
      apple: isAppleLoggedIn,
      integrated: isIntegratedLoggedIn,
      firebaseUID: firebaseUser?.uid
    });
    
    return {
      firebase: isFirebaseLoggedIn,
      apple: isAppleLoggedIn,
      integrated: isIntegratedLoggedIn,
      firebaseUser,
      appleUserInfo: appleUserInfo ? JSON.parse(appleUserInfo) : null,
      firebaseUserInfo: firebaseUserInfo ? JSON.parse(firebaseUserInfo) : null
    };
  } catch (error) {
    console.error('Firebase Apple 로그인 상태 확인 실패:', error);
    return {
      firebase: false,
      apple: false,
      integrated: false,
      firebaseUser: null,
      appleUserInfo: null,
      firebaseUserInfo: null
    };
  }
};

/**
 * 통합 사용자 정보 가져오기
 * @returns {Promise<Object>} 통합 사용자 정보
 */
export const getFirebaseAppleUserInfo = async () => {
  try {
    const loginStatus = await checkFirebaseAppleLoginStatus();
    
    if (!loginStatus.integrated) {
      return null;
    }
    
    // Firestore에서 사용자 정보 가져오기 (db가 있는 경우에만)
    let firestoreUserInfo = null;
    if (db && loginStatus.firebaseUser) {
      try {
        const userRef = doc(db, 'users', loginStatus.firebaseUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          firestoreUserInfo = userDoc.data();
        }
      } catch (error) {
        console.error('Firestore 사용자 정보 가져오기 실패:', error);
      }
    }
    
    // 표시용 이름 결정
    let displayName = '사용자';
    if (firestoreUserInfo?.displayName) {
      displayName = firestoreUserInfo.displayName;
    } else if (loginStatus.firebaseUser?.displayName) {
      displayName = loginStatus.firebaseUser.displayName;
    } else if (loginStatus.appleUserInfo?.appleEmail) {
      displayName = loginStatus.appleUserInfo.appleEmail.split('@')[0];
    }
    
    return {
      firebaseUID: loginStatus.firebaseUser?.uid,
      email: loginStatus.firebaseUser?.email || loginStatus.appleUserInfo?.appleEmail,
      displayName,
      authProvider: 'apple',
      firestoreData: firestoreUserInfo,
      appleData: loginStatus.appleUserInfo,
      firebaseData: loginStatus.firebaseUserInfo
    };
  } catch (error) {
    console.error('통합 사용자 정보 가져오기 실패:', error);
    return null;
  }
};

/**
 * Apple 자격 증명 상태 확인
 * @returns {Promise<string>} 자격 증명 상태
 */
export const checkAppleCredentialState = async () => {
  try {
    if (Platform.OS !== 'ios') {
      return 'NOT_SUPPORTED';
    }

    const loginStatus = await checkFirebaseAppleLoginStatus();
    if (!loginStatus.apple || !loginStatus.appleUserInfo?.appleUser) {
      return 'NOT_FOUND';
    }

    const credentialState = await AppleAuthentication.getCredentialStateAsync(
      loginStatus.appleUserInfo.appleUser
    );
    
    console.log('Apple 자격 증명 상태:', credentialState);
    
    return credentialState;
  } catch (error) {
    console.error('Apple 자격 증명 상태 확인 실패:', error);
    return 'UNKNOWN';
  }
};

// 기존 함수들과의 호환성을 위한 별칭
export const appleLogin = firebaseAppleLogin;
export const appleLogout = firebaseAppleLogout;
export const isAppleLoggedIn = async () => {
  const status = await checkFirebaseAppleLoginStatus();
  return status.integrated;
};
export const getAppleUserInfo = getFirebaseAppleUserInfo;

