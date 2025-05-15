import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from './config';
import { Alert } from 'react-native';

export const signUp = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Sign Up Error:", error);
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

    // Firebase 인증 시도
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
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

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout Error:", error);
    throw error;
  }
};