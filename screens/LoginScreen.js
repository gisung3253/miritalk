import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, TouchableWithoutFeedback, Keyboard, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signIn, signUp } from '../firebase/auth';
import styles from '../style/LoginScreen.styles';

const LoginScreen = ({ onLoginSuccess, onSignUpPress }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
  };
  
  const handleLogin = async () => {
    if (!validateEmail(email)) {
      Alert.alert('경고', '유효한 이메일 주소를 입력해주세요.');
      return;
    }
    
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
    }
  };

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
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          placeholder="비밀번호"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />
        <TouchableOpacity 
          style={styles.loginButton} 
          onPress={handleLogin}
        >
          <Text style={styles.loginButtonText}>로그인</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.signupContainer}>
        <Text style={styles.signupText}>계정이 없으신가요?</Text>
        <TouchableOpacity onPress={onSignUpPress}>
          <Text style={styles.signupLink}>회원가입</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.socialLoginContainer}>
        <Text style={styles.socialLoginText}>또는 소셜 로그인</Text>
        
        <TouchableOpacity 
          style={styles.kakaoLoginButton}
          onPress={() => {}}
        >
          <View style={styles.kakaoButtonContent}>
            <Image 
              source={require('../assets/images/kakao.png')} 
              style={styles.kakaoLogo} 
              resizeMode="contain"
            />
            <Text style={styles.kakaoButtonText}>카카오톡으로 계속하기</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.appleLoginButton}
          onPress={() => {}}
        >
          <View style={styles.appleButtonContent}>
            <Ionicons name="logo-apple" size={20} color="#FFFFFF" style={styles.appleIcon} />
            <Text style={styles.appleButtonText}>Apple로 계속하기</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
    </TouchableWithoutFeedback>
  );
};

export default LoginScreen;