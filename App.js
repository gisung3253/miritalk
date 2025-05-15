import React, { useState } from 'react';
import LoginScreen from './screens/LoginScreen';
import CalendarScreen from './screens/CalendarScreen';
import SignUpScreen from './screens/SignUpScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('Login');

  const navigateToCalendar = () => {
    setCurrentScreen('Calendar');
  };

  const navigateToLogin = () => {
    setCurrentScreen('Login');
  };

  const navigateToSignUp = () => {
    setCurrentScreen('SignUp');
  };

  if (currentScreen === 'Login') {
    return <LoginScreen onLoginSuccess={navigateToCalendar} onSignUpPress={navigateToSignUp} />;
  } else if (currentScreen === 'SignUp') {
    return <SignUpScreen onSignUpSuccess={navigateToLogin} onCancel={navigateToLogin} />;
  } else {
    return <CalendarScreen onLogout={navigateToLogin} />;
  }
}