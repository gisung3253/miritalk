import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { signUp } from '../firebase/auth';
import styles from '../style/LoginScreen.styles';

const SignUpScreen = ({ onSignUpSuccess, onCancel }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
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
      onSignUpSuccess();
    } catch (error) {
      Alert.alert('회원가입 실패', error.message);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>미리톡 캘린더</Text>
          <Text style={styles.subtitle}>회원가입</Text>
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
          
          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={handleSignUp}
          >
            <Text style={styles.loginButtonText}>회원가입</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>이미 계정이 있으신가요?</Text>
          <TouchableOpacity onPress={onCancel}>
            <Text style={styles.signupLink}>로그인</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default SignUpScreen;
