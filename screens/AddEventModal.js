import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal } from 'react-native';
import styles from '../style/AddEventModal.styles';

const AddEventModal = ({ visible, onClose, onSave, defaultDate }) => {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState(''); // HH:MM

  const handleSave = () => {
    if (!title.trim()) return;
    const saveTime = time && time.length === 5 ? time : '00:00';
    onSave({ title, time: saveTime, date: defaultDate });
    setTitle('');
    setTime('');
    onClose();
  };

  const handleClose = () => {
    setTitle('');
    setTime('');
    onClose();
  };

  // HH:MM만 허용하는 입력 제한
  const handleTimeChange = (text) => {
    // 0~2자리 숫자, : , 0~2자리 숫자
    let filtered = text.replace(/[^0-9:]/g, '');
    if (filtered.length === 2 && time.length === 1) filtered += ':';
    if (filtered.length > 5) filtered = filtered.slice(0, 5);
    setTime(filtered);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>일정 등록</Text>
          <TextInput
            style={styles.input}
            placeholder="일정을 입력하세요"
            value={title}
            onChangeText={setTitle}
            maxLength={30}
            autoFocus={false}
          />
          <TextInput
            style={styles.input}
            placeholder="시간 (예: 09:30)"
            value={time}
            onChangeText={handleTimeChange}
            maxLength={5}
            keyboardType="numeric"
          />
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
              <Text style={styles.cancelBtnText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>저장</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AddEventModal;
