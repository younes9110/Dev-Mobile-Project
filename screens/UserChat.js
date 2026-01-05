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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAppointmentMessages, sendMessage } from '../services/doctorService';
import { getCurrentUser } from '../services/firebaseAuth';

export default function UserChat({ route, navigation }) {
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
    const senderName = user.displayName || user.name || user.email?.split('@')[0] || 'Vous';
    
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

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Aujourd'hui";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
      });
    }
  };

  const renderMessage = ({ item, index }) => {
    const isUser = item.senderId === user?.uid;
    const showDate = index === 0 || 
      (messages[index - 1] && 
       new Date(item.timestamp).toDateString() !== new Date(messages[index - 1].timestamp).toDateString());

    return (
      <View>
        {showDate && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateSeparatorText}>{formatDate(item.timestamp)}</Text>
          </View>
        )}
        <View
          style={[
            styles.messageContainer,
            isUser ? styles.userMessage : styles.doctorMessage,
          ]}
        >
          <View
            style={[
              styles.messageBubble,
              isUser ? styles.userBubble : styles.doctorBubble,
            ]}
          >
            {!isUser && (
              <View style={styles.senderHeader}>
                {doctor.photo ? (
                  <Image source={{ uri: doctor.photo }} style={styles.senderAvatar} />
                ) : (
                  <View style={styles.senderAvatarPlaceholder}>
                    <Ionicons name="person" size={16} color="#00897B" />
                  </View>
                )}
                <Text style={styles.senderName}>{item.senderName}</Text>
              </View>
            )}
            <Text
              style={[
                styles.messageText,
                isUser ? styles.userMessageText : styles.doctorMessageText,
              ]}
            >
              {item.message}
            </Text>
            <Text
              style={[
                styles.messageTime,
                isUser ? styles.userMessageTime : styles.doctorMessageTime,
              ]}
            >
              {formatTime(item.timestamp)}
            </Text>
          </View>
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
          {doctor.photo ? (
            <Image source={{ uri: doctor.photo }} style={styles.headerAvatar} />
          ) : (
            <View style={styles.headerAvatarPlaceholder}>
              <Ionicons name="person" size={24} color="#00897B" />
            </View>
          )}
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Dr. {doctor.name}</Text>
            <Text style={styles.headerSubtitle}>
              Rendez-vous du {new Date(appointment.date).toLocaleDateString('fr-FR')} à {appointment.time}
            </Text>
          </View>
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
            <Text style={styles.emptySubtext}>Commencez la conversation avec votre médecin</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  headerAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  headerText: {
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
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 15,
  },
  dateSeparatorText: {
    fontSize: 12,
    color: '#999',
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  messageContainer: {
    marginBottom: 15,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  doctorMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 15,
  },
  userBubble: {
    backgroundColor: '#00897B',
    borderBottomRightRadius: 5,
  },
  doctorBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 5,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  senderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  senderAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 5,
  },
  senderAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0F2F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00897B',
  },
  userMessageText: {
    color: '#fff',
  },
  doctorMessageText: {
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
  userMessageTime: {
    color: '#E0F2F1',
  },
  doctorMessageTime: {
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

