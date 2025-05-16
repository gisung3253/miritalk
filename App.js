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
        
        setCurrentScreen(isValid ? 'Calendar' : 'Login');
        
        // 인증 상태 변화 감지 리스너 설정
        const unsubscribe = setupAuthStateListener((isLoggedIn) => {
          console.log('인증 상태 변경:', isLoggedIn ? '로그인됨' : '로그아웃됨');
          setCurrentScreen(isLoggedIn ? 'Calendar' : 'Login');
        });
        
        // 토큰 주기적 갱신 설정 (1시간 토큰 만료 시간보다 짧게)
        const tokenRefreshInterval = setInterval(async () => {
          if (currentScreen === 'Calendar') {
            await getValidToken(true);
          }
        }, 45 * 60 * 1000); // 45분마다
        
        setIsAuthInitialized(true);
        SplashScreen.hideAsync().catch(() => {
          /* 오류 무시 */
        });
        
        // 컴포넌트 언마운트 시 정리
        return () => {
          unsubscribe();
          clearInterval(tokenRefreshInterval);
        };
      } catch (error) {
        console.error('인증 초기화 오류:', error);
        setCurrentScreen('Login');
        SplashScreen.hideAsync().catch(() => {
          /* 오류 무시 */
        });
      }
    };
    
    initializeAuth();
  }, []);

  const navigateToCalendar = () => {
    setCurrentScreen('Calendar');
  };

  const navigateToLogin = () => {
    setCurrentScreen('Login');
  };

  const navigateToSignUp = () => {
    setCurrentScreen('SignUp');
  };

  if (currentScreen === 'Loading') {
    return <LoadingScreen />;
  } else if (currentScreen === 'Login') {
    return <LoginScreen onLoginSuccess={navigateToCalendar} onSignUpPress={navigateToSignUp} />;
  } else if (currentScreen === 'SignUp') {
    return <SignUpScreen onSignUpSuccess={navigateToLogin} onCancel={navigateToLogin} />;
  } else {
    return <CalendarScreen onLogout={navigateToLogin} />;
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