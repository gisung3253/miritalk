import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import LoginScreen from './screens/LoginScreen';
import CalendarScreen from './screens/CalendarScreen';
import SignUpScreen from './screens/SignUpScreen';
import { verifySession, setupAuthStateListener, getValidToken } from './firebase/auth';
import * as SplashScreen from 'expo-splash-screen';

// 로딩 스크린 컴포넌트
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size={36} color="#4a90e2" />
  </View>
);

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('Loading');
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);
  
  // 앱 시작 시 로그인 상태 확인
  useEffect(() => {
    // 스플래시 화면 유지
    SplashScreen.preventAutoHideAsync().catch(() => {
      /* 오류 무시 */
    });
    
    const initializeAuth = async () => {
      try {
        console.log('앱 초기화 시작');
        
        // 세션 유효성 확인
        const isValid = await verifySession();
        console.log('세션 유효성 확인 결과:', isValid);
        
        // 화면 설정
        const targetScreen = isValid ? 'Calendar' : 'Login';
        console.log('화면 설정:', targetScreen);
        setCurrentScreen(targetScreen);
        console.log('currentScreen 설정 완료:', targetScreen);
        
        // 인증 상태 변화 감지 리스너 설정
        const unsubscribe = setupAuthStateListener((isLoggedIn) => {
          console.log('인증 상태 변경:', isLoggedIn ? '로그인됨' : '로그아웃됨');
          const newScreen = isLoggedIn ? 'Calendar' : 'Login';
          console.log('화면 변경:', newScreen);
          setCurrentScreen(newScreen);
        });
        
        // 토큰 주기적 갱신 설정 (Firebase 사용자가 있을 때만)
        const tokenRefreshInterval = setInterval(async () => {
          if (currentScreen === 'Calendar') {
            try {
              await getValidToken(true);
            } catch (error) {
              console.log('토큰 갱신 중 오류 (무시):', error.message);
            }
          }
        }, 45 * 60 * 1000); // 45분마다
        
        setIsAuthInitialized(true);
        console.log('인증 초기화 완료');
        
        SplashScreen.hideAsync().catch(() => {
          /* 오류 무시 */
        });
        
        // 컴포넌트 언마운트 시 정리
        return () => {
          unsubscribe();
          clearInterval(tokenRefreshInterval);
          console.log('App 정리 함수 실행');
        };
      } catch (error) {
        console.error('인증 초기화 오류:', error);
        setCurrentScreen('Login');
        setIsAuthInitialized(true);
        SplashScreen.hideAsync().catch(() => {
          /* 오류 무시 */
        });
      }
    };
    
    initializeAuth();
  }, []);

  const navigateToCalendar = () => {
    console.log('navigateToCalendar 호출됨');
    setCurrentScreen('Calendar');
  };

  const navigateToLogin = () => {
    console.log('navigateToLogin 호출됨');
    setCurrentScreen('Login');
  };

  const navigateToSignUp = () => {
    console.log('navigateToSignUp 호출됨');
    setCurrentScreen('SignUp');
  };

  // 현재 화면 상태 로깅
  console.log('App 렌더링 - currentScreen:', currentScreen, 'isAuthInitialized:', isAuthInitialized);

  if (!isAuthInitialized) {
    console.log('로딩 화면 표시 중...');
    return <LoadingScreen />;
  }

  if (currentScreen === 'Loading') {
    console.log('Loading 화면 표시');
    return <LoadingScreen />;
  } else if (currentScreen === 'Login') {
    console.log('Login 화면 표시');
    return <LoginScreen onLoginSuccess={navigateToCalendar} onSignUpPress={navigateToSignUp} />;
  } else if (currentScreen === 'SignUp') {
    console.log('SignUp 화면 표시');
    return <SignUpScreen onSignUpSuccess={navigateToLogin} onCancel={navigateToLogin} />;
  } else if (currentScreen === 'Calendar') {
    console.log('Calendar 화면 표시');
    return <CalendarScreen onLogout={navigateToLogin} />;
  } else {
    console.log('알 수 없는 화면 상태:', currentScreen, '- Login 화면으로 대체');
    return <LoginScreen onLoginSuccess={navigateToCalendar} onSignUpPress={navigateToSignUp} />;
  }
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});

