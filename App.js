import React, { useState } from 'react';
import LoginScreen from './screens/LoginScreen';
import CalendarScreen from './screens/CalendarScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('Login');

  const navigateToCalendar = () => {
    setCurrentScreen('Calendar');
  };

  const navigateToLogin = () => {
    setCurrentScreen('Login');
  };

  return currentScreen === 'Login' ? (
    <LoginScreen onLoginSuccess={navigateToCalendar} />
  ) : (
    <CalendarScreen onLogout={navigateToLogin} />
  );
}