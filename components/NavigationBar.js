import React from 'react';
import { View, TouchableOpacity, Text, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../style/NavigationBar.styles';
import { logout } from '../firebase/auth';

const NavigationBar = ({ onLogout }) => {
  const handleLogout = async () => {
    try {
      await logout();
      if (onLogout) {
        onLogout();
      }
    } catch (error) {
      console.error('로그아웃 실패', error);
    }
  };

  return (
    <View style={styles.navigationBarContainer}>
      <View style={styles.navigationBar}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="calendar" size={24} color="black" />
          <Text style={styles.navItemText}>캘린더</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="add-circle" size={24} color="black" />
          <Text style={styles.navItemText}>일정 추가</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleLogout}>
          <Ionicons name="log-out" size={24} color="black" />
          <Text style={styles.navItemText}>로그아웃</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default NavigationBar;