import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAppointmentMessages, sendMessage } from '../services/doctorService';
import { getCurrentUser } from '../services/firebaseAuth';

export default function DoctorChat({ route, navigation }) {
  const { appointment, doctor } = route.params;
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);
  const user = getCurrentUser();

  useEffect(() => {
    const unsubscribe = getAppointmentMessages(appointment.id, (messagesList) => {
      setMessages(messagesList);
      // Scroll to bottom when new messages arrive
      setTimeout(() => {
        if (flatListRef.current && messagesList.length > 0) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
    });

    return () => unsubscribe();
  }, [appointment.id]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !user) return;

    setSending(true);
    const senderName = doctor?.name || 'Médecin';
    
    const result = await sendMessage(
      appointment.id,
      user.uid,
      senderName,
      messageText.trim()
    );

    if (result.success) {
      setMessageText('');
    } else {
      Alert.alert('Erreur', result.error || 'Impossible d\'envoyer le message');
    }
    setSending(false);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderMessage = ({ item }) => {
    const isDoctor = item.senderId === user?.uid;
    
    return (
      <View
        style={[
          styles.messageContainer,
          isDoctor ? styles.doctorMessage : styles.patientMessage,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isDoctor ? styles.doctorBubble : styles.patientBubble,
          ]}
        >
          <Text style={styles.senderName}>{item.senderName}</Text>
          <Text
            style={[
              styles.messageText,
              isDoctor ? styles.doctorMessageText : styles.patientMessageText,
            ]}
          >
            {item.message}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isDoctor ? styles.doctorMessageTime : styles.patientMessageTime,
            ]}
          >
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Chat avec {appointment.userName}</Text>
          <Text style={styles.headerSubtitle}>
            Rendez-vous du {appointment.date} à {appointment.time}
          </Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => {
          if (flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: true });
          }
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Aucun message</Text>
            <Text style={styles.emptySubtext}>Commencez la conversation</Text>
          </View>
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Tapez votre message..."
          value={messageText}
          onChangeText={setMessageText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!messageText.trim() || sending) && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={!messageText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#E0F2F1',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00897B',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  messagesList: {
    padding: 15,
  },
  messageContainer: {
    marginBottom: 15,
  },
  doctorMessage: {
    alignItems: 'flex-end',
  },
  patientMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 15,
  },
  doctorBubble: {
    backgroundColor: '#00897B',
    borderBottomRightRadius: 5,
  },
  patientBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 5,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 5,
  },
  doctorMessageText: {
    color: '#fff',
  },
  patientMessageText: {
    color: '#333',
  },
  messageText: {
    fontSize: 16,
    marginBottom: 5,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 5,
  },
  doctorMessageTime: {
    color: '#E0F2F1',
  },
  patientMessageTime: {
    color: '#999',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
    marginRight: 10,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#00897B',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 5,
  },
});

