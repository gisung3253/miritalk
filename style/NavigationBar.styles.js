import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default StyleSheet.create({
  navigationBarContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: width * 0.75, // 화면 너비의 75%
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    zIndex: 100,
  },
  navigationBar: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 50,
    height: '100%',
  },
  
  // 프로필 섹션
  profileSection: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 10,
  },
  profileImageContainer: {
    marginRight: 15,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  kakaoStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  statusActive: {
    backgroundColor: '#4CAF50', // 연동됨 - 초록색
  },
  statusInactive: {
    backgroundColor: '#FF9800', // 연동 필요 - 주황색
  },
  kakaoStatus: {
    fontSize: 14,
    color: '#666',
  },
  
  // 구분선
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 15,
  },
  
  // 메뉴 섹션
  menuSection: {
    width: '100%',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    width: '100%',
  },
  navItemText: {
    fontSize: 16,
    marginLeft: 15,
    color: '#333',
  },
  logoutText: {
    color: '#FF6B6B',
  },
  deleteAccountText: {
    color: '#FF3B30',
  },
  
  // 버전 정보
  versionInfo: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    width: '100%',
  },
  versionText: {
    fontSize: 12,
    color: '#999',
  },
});