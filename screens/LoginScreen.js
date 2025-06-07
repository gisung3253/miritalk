import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, TouchableWithoutFeedback, Keyboard, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signIn } from '../firebase/auth';
import { kakaoLogin } from '../firebase/kakaoLogin';
import { appleLogin } from '../firebase/appleLogin';
import styles from '../style/LoginScreen.styles';

const LoginScreen = ({ onLoginSuccess, onSignUpPress }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [kakaoLoading, setKakaoLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  
  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
  };
  
  const handleLogin = async () => {
    if (isLoading || kakaoLoading || appleLoading) return;
    
    if (!validateEmail(email)) {
      Alert.alert('경고', '유효한 이메일 주소를 입력해주세요.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await signIn(email, password);
      if (result) {
        onLoginSuccess();
      }
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleKakaoLogin = async () => {
    if (isLoading || kakaoLoading || appleLoading) return;
    
    setKakaoLoading(true);
    
    try {
      console.log('카카오 로그인 버튼 클릭');
      const result = await kakaoLogin();
      
      if (result.success) {
        console.log('카카오 로그인 성공, 메인 화면으로 이동');
        Alert.alert(
          '로그인 성공', 
          `${result.profile.nickname}님, 환영합니다!`,
          [
            {
              text: '확인',
              onPress: () => onLoginSuccess()
            }
          ]
        );
      } else {
        console.log('카카오 로그인 실패:', result.message);
        // kakaoLogin 함수에서 이미 Alert를 표시하므로 추가 Alert 불필요
      }
    } catch (error) {
      console.error('카카오 로그인 핸들러 오류:', error);
      Alert.alert('오류', '카카오 로그인 중 예상치 못한 오류가 발생했습니다.');
    } finally {
      setKakaoLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    if (isLoading || kakaoLoading || appleLoading) return;
    
    setAppleLoading(true);
    
    try {
      console.log('Apple 로그인 버튼 클릭');
      const result = await appleLogin();
      
      if (result.success) {
        console.log('Apple 로그인 성공, 메인 화면으로 이동');
        Alert.alert(
          '로그인 성공', 
          `${result.displayName}님, 환영합니다!`,
          [
            {
              text: '확인',
              onPress: () => onLoginSuccess()
            }
          ]
        );
      } else {
        console.log('Apple 로그인 실패:', result.message);
        // 취소가 아닌 경우에만 추가 처리
        if (result.error && result.error.code !== 'ERR_CANCELED') {
          // appleLogin 함수에서 이미 Alert를 표시하므로 추가 Alert 불필요
        }
      }
    } catch (error) {
      console.error('Apple 로그인 핸들러 오류:', error);
      Alert.alert('오류', 'Apple 로그인 중 예상치 못한 오류가 발생했습니다.');
    } finally {
      setAppleLoading(false);
    }
  };

  // 모든 로딩 상태 확인
  const isAnyLoading = isLoading || kakaoLoading || appleLoading;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>미리톡 캘린더</Text>
          <Text style={styles.subtitle}>일정을 미리 알려주는 캘린더</Text>
        </View>
      
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="이메일"
            value={email}
            onChangeText={setEmail}
            style={[styles.input, isAnyLoading && styles.disabledInput]}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isAnyLoading}
          />
          <TextInput
            placeholder="비밀번호"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={[styles.input, isAnyLoading && styles.disabledInput]}
            editable={!isAnyLoading}
          />
          <TouchableOpacity 
            style={[
              styles.loginButton, 
              isAnyLoading && styles.disabledButton
            ]} 
            onPress={handleLogin}
            disabled={isAnyLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>로그인</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>계정이 없으신가요?</Text>
          <TouchableOpacity 
            onPress={onSignUpPress}
            disabled={isAnyLoading}
          >
            <Text style={[
              styles.signupLink,
              isAnyLoading && styles.disabledText
            ]}>회원가입</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.socialLoginContainer}>
          <Text style={styles.socialLoginText}>또는 소셜 로그인</Text>
          
          <TouchableOpacity 
            style={[
              styles.kakaoLoginButton,
              isAnyLoading && styles.disabledButton
            ]}
            onPress={handleKakaoLogin}
            disabled={isAnyLoading}
          >
            <View style={styles.kakaoButtonContent}>
              {kakaoLoading ? (
                <ActivityIndicator size="small" color="rgba(0, 0, 0, 0.85)" />
              ) : (
                <>
                  <Image 
                    source={require('../assets/images/kakao.png')} 
                    style={styles.kakaoLogo} 
                    resizeMode="contain"
                  />
                  <Text style={styles.kakaoButtonText}>카카오톡으로 계속하기</Text>
                </>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.appleLoginButton,
              isAnyLoading && styles.disabledButton
            ]}
            onPress={handleAppleLogin}
            disabled={isAnyLoading}
          >
            <View style={styles.appleButtonContent}>
              {appleLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="logo-apple" size={20} color="#FFFFFF" style={styles.appleIcon} />
                  <Text style={styles.appleButtonText}>Apple로 계속하기</Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default LoginScreen;

