import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Modal, 
  Alert, 
  Platform, 
  KeyboardAvoidingView, 
  TouchableWithoutFeedback, 
  Keyboard 
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import styles from '../style/AddEventModal.styles';

// 시간을 00:00으로 초기화하는 함수
const getInitialTime = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const AddEventModal = ({ visible, onClose, onSave, defaultDate }) => {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState(getInitialTime());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  
  // 모달이 열릴 때마다 상태 초기화
  useEffect(() => {
    if (visible) {
      setTitle('');
      setTime(getInitialTime());
      setShowTimePicker(false);
      setIsFormValid(false);
    }
  }, [visible]);
  
  // 제목이 유효한지 확인
  useEffect(() => {
    setIsFormValid(title.trim().length > 0);
  }, [title]);

  const handleSave = () => {
    if (!isFormValid) return;
    
    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}`;
    
    onSave({ 
      title: title.trim(),
      time: timeString, 
      date: defaultDate 
    });
    
    // 폼 초기화
    setTitle('');
    setTime(new Date());
    onClose();
  };

  const handleClose = () => {
    // 폼 초기화
    setTitle('');
    setTime(new Date());
    onClose();
  };
  
  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setTime(selectedTime);
    }
  };
  
  const toggleTimePicker = () => {
    setShowTimePicker(prev => !prev);
  };
  
  const formatTime = (date) => {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <Modal 
      visible={visible} 
      transparent 
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.overlay}>
            <View style={styles.content}>
              <Text style={styles.title}>새 일정 추가</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>제목</Text>
                <TextInput
                  style={[styles.input, !title && styles.inputEmpty]}
                  placeholder="일정 제목을 입력하세요"
                  placeholderTextColor="#999"
                  value={title}
                  onChangeText={setTitle}
                  maxLength={30}
                  autoFocus={true}
                  returnKeyType="next"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>시간</Text>
                <TouchableOpacity 
                  style={[styles.timeInput, styles.input]}
                  onPress={toggleTimePicker}
                >
                  <Text style={styles.timeText}>
                    {formatTime(time)}
                  </Text>
                  <Ionicons name="time-outline" size={20} color="#4F8EF7" />
                </TouchableOpacity>
                {showTimePicker && (
                  <DateTimePicker
                    value={time}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleTimeChange}
                    style={styles.timePicker}
                    textColor="#333"
                  />
                )}
              </View>
              
              <View style={styles.btnRow}>
                <TouchableOpacity 
                  style={[styles.button, styles.cancelBtn]} 
                  onPress={() => handleClose && handleClose()}
                >
                  <Text style={styles.cancelBtnText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.button, 
                    styles.saveBtn, 
                    !isFormValid && styles.saveBtnDisabled
                  ]} 
                  onPress={() => isFormValid && handleSave && handleSave()}
                  disabled={!isFormValid}
                >
                  <Text style={styles.saveBtnText}>저장</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default AddEventModal;
