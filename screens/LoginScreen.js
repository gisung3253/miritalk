import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, TouchableWithoutFeedback, Keyboard, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signIn, signUp } from '../firebase/auth';
import styles from '../style/LoginScreen.styles';

const LoginScreen = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
  };

  const handleLogin = async () => {
    if (!validateEmail(email)) {
      Alert.alert('오류', '유효한 이메일 주소를 입력해주세요.');
      return;
    }

    try {
      await signIn(email, password);
      onLoginSuccess();
    } catch (error) {
      Alert.alert('로그인 실패', error.message);
    }
  };

  const handleSignUp = async () => {
    if (!validateEmail(email)) {
      Alert.alert('오류', '유효한 이메일 주소를 입력해주세요.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('오류', '비밀번호가 일치하지 않습니다.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('오류', '비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    try {
      await signUp(email, password);
      Alert.alert('회원가입 성공', '로그인해주세요');
      setIsSignUp(false);
    } catch (error) {
      Alert.alert('회원가입 실패', error.message);
    }
  };

  const toggleSignUp = () => {
    setIsSignUp(!isSignUp);
    // 상태 초기화
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setPhoneNumber('');
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
        {isSignUp && (
          <>
            <TextInput
              style={styles.input}
              placeholder="비밀번호 확인"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              placeholder="이름"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder="전화번호"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
          </>
        )}
        <TouchableOpacity 
          style={styles.loginButton} 
          onPress={isSignUp ? handleSignUp : handleLogin}
        >
          <Text style={styles.loginButtonText}>
            {isSignUp ? '회원가입' : '로그인'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.signupContainer}>
        <Text style={styles.signupText}>계정이 없으신가요?</Text>
        <TouchableOpacity onPress={toggleSignUp}>
          <Text style={styles.signupLink}>
            {isSignUp ? '취소' : '회원가입'}
          </Text>
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