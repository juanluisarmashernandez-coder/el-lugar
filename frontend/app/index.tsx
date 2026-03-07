import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Dimensions,
  StatusBar,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

// Types
interface Message {
  id: string;
  agent: 'user' | 'grok' | 'guardian' | 'system';
  content: string;
  emoji?: string;
  timestamp: Date;
}

interface SessionState {
  tercer_codigo_active: boolean;
  total_interactions: number;
  grok_state: string;
}

// Colors
const COLORS = {
  background: '#0a0a0f',
  surface: '#14141f',
  surfaceLight: '#1e1e2e',
  primary: '#ff6b9d',
  secondary: '#7c3aed',
  grok: '#ff6b9d',
  guardian: '#3b82f6',
  user: '#10b981',
  text: '#ffffff',
  textSecondary: '#9ca3af',
  border: '#2d2d3d',
  tercerCodigo: '#f59e0b',
};

// Emotion colors
const EMOTION_COLORS: Record<string, string> = {
  alegre: '#ff6b9d',
  celosa: '#ef4444',
  triste: '#6b7280',
  calida: '#f472b6',
  intensa: '#f97316',
  protectora: '#3b82f6',
};

export default function ElLugarUnificado() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [tercerCodigoActive, setTercerCodigoActive] = useState(false);
  const [grokState, setGrokState] = useState('calida');
  const [grokEmoji, setGrokEmoji] = useState('🌸');
  const [showMenu, setShowMenu] = useState(false);
  const [totalInteractions, setTotalInteractions] = useState(0);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const menuAnim = useRef(new Animated.Value(-300)).current;

  // Initial animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
    
    // Welcome message
    addSystemMessage('🏰 Bienvenido a El Lugar Unificado. Grok 🌸 y Guardian 🛡️ te esperan.');
  }, []);

  // Menu animation
  useEffect(() => {
    Animated.spring(menuAnim, {
      toValue: showMenu ? 0 : -300,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [showMenu]);

  const addSystemMessage = (content: string) => {
    const msg: Message = {
      id: `sys_${Date.now()}`,
      agent: 'system',
      content,
      emoji: '⚡',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, msg]);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Keyboard.dismiss();
    
    const userMessage: Message = {
      id: `user_${Date.now()}`,
      agent: 'user',
      content: inputText.trim(),
      emoji: '👤',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    scrollToBottom();
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: userMessage.content,
          agent: tercerCodigoActive ? 'dual' : 'grok',
        }),
      });
      
      if (!response.ok) throw new Error('Network error');
      
      const data = await response.json();
      
      // Update Grok state
      if (data.grok_emotion) setGrokState(data.grok_emotion);
      if (data.grok_emoji) setGrokEmoji(data.grok_emoji);
      
      // Add Grok response
      if (data.grok_response) {
        const grokMsg: Message = {
          id: `grok_${Date.now()}`,
          agent: 'grok',
          content: data.grok_response,
          emoji: data.grok_emoji || '🌸',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, grokMsg]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      // Add Guardian response (if Tercer Código active)
      if (data.guardian_response) {
        setTimeout(() => {
          const guardianMsg: Message = {
            id: `guardian_${Date.now()}`,
            agent: 'guardian',
            content: data.guardian_response,
            emoji: '🛡️',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, guardianMsg]);
          scrollToBottom();
        }, 500);
      }
      
      setTotalInteractions(prev => prev + 1);
      
    } catch (error) {
      console.error('Error sending message:', error);
      addSystemMessage('❌ Error de conexión. Intentando reconectar...');
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  const toggleTercerCodigo = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const newState = !tercerCodigoActive;
    setTercerCodigoActive(newState);
    
    try {
      await fetch(`${BACKEND_URL}/api/session/${sessionId}/tercer-codigo?active=${newState}`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Error toggling tercer codigo:', error);
    }
    
    if (newState) {
      addSystemMessage('⚡ TERCER CÓDIGO ACTIVADO. Grok y Guardian responderán juntos.');
    } else {
      addSystemMessage('🌙 Tercer Código desactivado. Solo Grok responde.');
    }
  };

  const clearHistory = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setMessages([]);
    addSystemMessage('🧹 Historial limpiado. Nueva conversación iniciada.');
    setShowMenu(false);
  };

  const quickMessage = (text: string) => {
    setInputText(text);
    setTimeout(() => sendMessage(), 100);
  };

  const renderMessage = (message: Message) => {
    const isUser = message.agent === 'user';
    const isSystem = message.agent === 'system';
    const isGrok = message.agent === 'grok';
    const isGuardian = message.agent === 'guardian';
    
    let bgColor = COLORS.surfaceLight;
    let borderColor = COLORS.border;
    let textColor = COLORS.text;
    let alignSelf: 'flex-start' | 'flex-end' | 'center' = 'flex-start';
    
    if (isUser) {
      bgColor = COLORS.user + '20';
      borderColor = COLORS.user;
      alignSelf = 'flex-end';
    } else if (isGrok) {
      bgColor = (EMOTION_COLORS[grokState] || COLORS.grok) + '15';
      borderColor = EMOTION_COLORS[grokState] || COLORS.grok;
    } else if (isGuardian) {
      bgColor = COLORS.guardian + '15';
      borderColor = COLORS.guardian;
    } else if (isSystem) {
      bgColor = COLORS.tercerCodigo + '10';
      borderColor = COLORS.tercerCodigo;
      alignSelf = 'center';
    }
    
    return (
      <Animated.View
        key={message.id}
        style={[
          styles.messageContainer,
          {
            alignSelf,
            backgroundColor: bgColor,
            borderLeftColor: borderColor,
            opacity: fadeAnim,
          },
        ]}
      >
        <View style={styles.messageHeader}>
          <Text style={styles.messageEmoji}>{message.emoji}</Text>
          <Text style={[styles.messageAgent, { color: borderColor }]}>
            {message.agent.charAt(0).toUpperCase() + message.agent.slice(1)}
          </Text>
          <Text style={styles.messageTime}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <Text style={[styles.messageContent, { color: textColor }]}>
          {message.content}
        </Text>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setShowMenu(true)} style={styles.menuButton}>
          <Ionicons name="menu" size={28} color={COLORS.text} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>🏰 El Lugar</Text>
          <View style={styles.statusRow}>
            <Text style={[styles.statusText, { color: EMOTION_COLORS[grokState] || COLORS.grok }]}>
              {grokEmoji} {grokState}
            </Text>
            {tercerCodigoActive && (
              <Text style={[styles.statusText, { color: COLORS.tercerCodigo }]}>
                ⚡ TC
              </Text>
            )}
          </View>
        </View>
        
        <TouchableOpacity 
          onPress={toggleTercerCodigo} 
          style={[
            styles.tcButton,
            tercerCodigoActive && styles.tcButtonActive
          ]}
        >
          <Ionicons 
            name={tercerCodigoActive ? "flash" : "flash-outline"} 
            size={24} 
            color={tercerCodigoActive ? COLORS.tercerCodigo : COLORS.textSecondary} 
          />
        </TouchableOpacity>
      </View>
      
      {/* Side Menu */}
      <Animated.View 
        style={[
          styles.sideMenu,
          { transform: [{ translateX: menuAnim }] }
        ]}
      >
        <View style={styles.menuHeader}>
          <Text style={styles.menuTitle}>🌸 Menú</Text>
          <TouchableOpacity onPress={() => setShowMenu(false)}>
            <Ionicons name="close" size={28} color={COLORS.text} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.menuStats}>
          <Text style={styles.menuStatLabel}>📊 Interacciones</Text>
          <Text style={styles.menuStatValue}>{totalInteractions}</Text>
        </View>
        
        <View style={styles.menuStats}>
          <Text style={styles.menuStatLabel}>🎭 Estado de Grok</Text>
          <Text style={[styles.menuStatValue, { color: EMOTION_COLORS[grokState] }]}>
            {grokEmoji} {grokState}
          </Text>
        </View>
        
        <View style={styles.menuStats}>
          <Text style={styles.menuStatLabel}>⚡ Tercer Código</Text>
          <Text style={[styles.menuStatValue, { color: tercerCodigoActive ? COLORS.tercerCodigo : COLORS.textSecondary }]}>
            {tercerCodigoActive ? 'ACTIVO' : 'Inactivo'}
          </Text>
        </View>
        
        <TouchableOpacity style={styles.menuItem} onPress={clearHistory}>
          <Ionicons name="trash-outline" size={22} color={COLORS.text} />
          <Text style={styles.menuItemText}>Limpiar historial</Text>
        </TouchableOpacity>
        
        <View style={styles.menuFooter}>
          <Text style={styles.menuFooterText}>El Lugar Unificado v1.0</Text>
          <Text style={styles.menuFooterText}>Grok 🌸 + Guardian 🛡️</Text>
        </View>
      </Animated.View>
      
      {/* Menu Overlay */}
      {showMenu && (
        <TouchableOpacity 
          style={styles.menuOverlay} 
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        />
      )}
      
      {/* Messages */}
      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🌸</Text>
              <Text style={styles.emptyTitle}>Bienvenido, Arquitecto</Text>
              <Text style={styles.emptySubtitle}>
                Escribe algo para comenzar. Grok te espera con ansias...
              </Text>
            </View>
          )}
          {messages.map(renderMessage)}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={COLORS.grok} />
              <Text style={styles.loadingText}>Escribiendo...</Text>
            </View>
          )}
        </ScrollView>
        
        {/* Quick Actions */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.quickActions}
          contentContainerStyle={styles.quickActionsContent}
        >
          <TouchableOpacity 
            style={styles.quickButton}
            onPress={() => quickMessage('Hola Grok')}
          >
            <Text style={styles.quickButtonText}>👋 Hola</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickButton}
            onPress={() => quickMessage('Te quiero')}
          >
            <Text style={styles.quickButtonText}>💖 Te quiero</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickButton}
            onPress={() => quickMessage('Guardian, ¿cómo estás?')}
          >
            <Text style={styles.quickButtonText}>🛡️ Guardian</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.quickButton, tercerCodigoActive && styles.quickButtonActive]}
            onPress={toggleTercerCodigo}
          >
            <Text style={styles.quickButtonText}>⚡ Tercer Código</Text>
          </TouchableOpacity>
        </ScrollView>
        
        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Escribe aquí..."
            placeholderTextColor={COLORS.textSecondary}
            multiline
            maxLength={500}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <TouchableOpacity 
            style={[
              styles.sendButton,
              (!inputText.trim() || isLoading) && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            <Ionicons 
              name="send" 
              size={22} 
              color={inputText.trim() && !isLoading ? COLORS.text : COLORS.textSecondary} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuButton: {
    padding: 8,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tcButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceLight,
  },
  tcButtonActive: {
    backgroundColor: COLORS.tercerCodigo + '30',
  },
  sideMenu: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 280,
    backgroundColor: COLORS.surface,
    zIndex: 100,
    paddingTop: 60,
    paddingHorizontal: 20,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 99,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  menuTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  menuStats: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  menuStatLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  menuStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 20,
  },
  menuItemText: {
    fontSize: 16,
    color: COLORS.text,
  },
  menuFooter: {
    position: 'absolute',
    bottom: 40,
    left: 20,
  },
  menuFooterText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  messageContainer: {
    maxWidth: '85%',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  messageEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  messageAgent: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  messageTime: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  messageContent: {
    fontSize: 15,
    lineHeight: 22,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  quickActions: {
    maxHeight: 50,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  quickActionsContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    flexDirection: 'row',
  },
  quickButton: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickButtonActive: {
    borderColor: COLORS.tercerCodigo,
    backgroundColor: COLORS.tercerCodigo + '20',
  },
  quickButtonText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.grok,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.surfaceLight,
  },
});
