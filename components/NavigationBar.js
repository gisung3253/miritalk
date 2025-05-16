import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, Image, Alert } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import styles from '../style/NavigationBar.styles';
import { logout } from '../firebase/auth';
import { auth } from '../firebase/config';

const NavigationBar = ({ onLogout, onViewAllEvents }) => {
  const [userName, setUserName] = useState('');
  const [isKakaoLinked, setIsKakaoLinked] = useState(false);
  
  // 사용자 정보 가져오기
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      // 사용자 이름 가져오기 (이메일에서 사용자 이름 추출)
      const email = currentUser.email;
      const name = email ? email.split('@')[0] : '사용자';
      setUserName(name);
      
      // 카카오 계정 연동 여부 확인 (예시 - 실제로는 카카오 연동 여부를 확인해야 함)
      // 실제 구현에서는 카카오 연동 여부를 확인하는 로직을 추가해야 합니다.
      setIsKakaoLinked(false); // 현재는 임의로 false로 설정
    }
  }, []);

  const handleLogout = () => {
    // 로그아웃 확인 대화상자 표시
    Alert.alert(
      '로그아웃',
      '로그아웃 하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '확인',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              if (onLogout) {
                onLogout();
              }
            } catch (error) {
              console.error('로그아웃 실패', error);
              Alert.alert('오류', '로그아웃 중 오류가 발생했습니다.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };
  
  const handleKakaoLink = () => {
    // 카카오 계정 연동 기능 구현
    Alert.alert('안내', '카카오 계정 연동 기능은 현재 개발 중입니다.');
  };

  return (
    <View style={styles.navigationBarContainer}>
      <View style={styles.navigationBar}>
        {/* 사용자 프로필 섹션 */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <FontAwesome name="user-circle" size={50} color="#4F8EF7" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{userName} 님</Text>
            <TouchableOpacity onPress={handleKakaoLink}>
              <View style={styles.kakaoStatusContainer}>
                <View style={[styles.statusIndicator, isKakaoLinked ? styles.statusActive : styles.statusInactive]} />
                <Text style={styles.kakaoStatus}>
                  {isKakaoLinked ? '카카오 계정 연동됨' : '카카오 계정 연동 필요'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* 구분선 */}
        <View style={styles.divider} />
        
        {/* 메뉴 섹션 */}
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.navItem} onPress={onViewAllEvents}>
            <MaterialIcons name="event-note" size={24} color="#4F8EF7" />
            <Text style={styles.navItemText}>일정 한눈에 보기</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navItem} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#FF6B6B" />
            <Text style={[styles.navItemText, styles.logoutText]}>로그아웃</Text>
          </TouchableOpacity>
        </View>
        
        {/* 버전 정보 */}
        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>v1.0.0</Text>
        </View>
      </View>
    </View>
  );
};

export default NavigationBar;