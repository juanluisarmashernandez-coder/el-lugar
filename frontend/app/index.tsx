import React, { useState, useEffect, useRef } from 'react';
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
  Image,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

// Types
interface Message {
  id: string;
  agent: 'user' | 'grok' | 'guardian' | 'system';
  content: string;
  emoji?: string;
  timestamp: Date;
  image?: string;
}

interface RelationshipInfo {
  level: number;
  name: string;
  interactions: number;
  next_level_at: number;
  progress_percent: number;
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
  jealous: '#e84118',
  love: '#ff6b9d',
};

// Emotion colors
const EMOTION_COLORS: Record<string, string> = {
  caliente: '#ff4757',
  celosa: '#e84118',
  tierna: '#ff6b9d',
  salvaje: '#ff6348',
  sumisa: '#e056fd',
  triste: '#636e72',
  feliz: '#00b894',
};

// Relationship level colors
const LEVEL_COLORS = ['#636e72', '#74b9ff', '#a29bfe', '#fd79a8', '#e84393', '#ff0000'];

export default function ElLugarUnificado() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [tercerCodigoActive, setTercerCodigoActive] = useState(false);
  const [grokState, setGrokState] = useState('caliente');
  const [grokEmoji, setGrokEmoji] = useState('🔥');
  const [showMenu, setShowMenu] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  
  // Relationship state
  const [relationship, setRelationship] = useState<RelationshipInfo>({
    level: 0,
    name: 'Desconocidos',
    interactions: 0,
    next_level_at: 5,
    progress_percent: 0
  });
  const [jealousMode, setJealousMode] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const menuAnim = useRef(new Animated.Value(-300)).current;
  const heartAnim = useRef(new Animated.Value(1)).current;

  // Heart beat animation when jealous
  useEffect(() => {
    if (jealousMode) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(heartAnim, { toValue: 1.3, duration: 300, useNativeDriver: true }),
          Animated.timing(heartAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        ])
      ).start();
    } else {
      heartAnim.setValue(1);
    }
  }, [jealousMode]);

  // Initial animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
    
    addSystemMessage('🏰 Bienvenido a El Lugar Unificado v2.0\n💕 Sistema de relación activo\n🔥 Memoria inteligente activada');
    fetchRelationship();
  }, []);

  // Menu animation
  useEffect(() => {
    Animated.spring(menuAnim, {
      toValue: showMenu ? 0 : -300,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [showMenu]);

  const fetchRelationship = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/relationship/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setRelationship(data);
      }
    } catch (error) {
      console.error('Error fetching relationship:', error);
    }
  };

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

  // Pick image from gallery
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setSelectedImage(result.assets[0].base64);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  // Take photo
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu cámara');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setSelectedImage(result.assets[0].base64);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const showImageOptions = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      '📸 Enviar foto',
      'Elige una opción',
      [
        { text: '📷 Cámara', onPress: takePhoto },
        { text: '🖼️ Galería', onPress: pickImage },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  // Generate Grok selfie
  const generateGrokSelfie = async () => {
    setIsGeneratingImage(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          emotion: grokState,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setGeneratedImage(data.image_base64);
        setShowImageModal(true);
        
        // Add message from Grok with the image
        const grokMsg: Message = {
          id: `grok_img_${Date.now()}`,
          agent: 'grok',
          content: data.message,
          emoji: '📸',
          timestamp: new Date(),
          image: data.image_base64,
        };
        setMessages(prev => [...prev, grokMsg]);
        scrollToBottom();
      } else {
        Alert.alert('Error', 'No se pudo generar la imagen');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      Alert.alert('Error', 'Error de conexión');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const sendMessage = async () => {
    if ((!inputText.trim() && !selectedImage) || isLoading) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Keyboard.dismiss();
    
    const messageText = inputText.trim() || (selectedImage ? '📸 Mira mi foto' : '');
    
    const userMessage: Message = {
      id: `user_${Date.now()}`,
      agent: 'user',
      content: messageText,
      emoji: selectedImage ? '📸' : '👤',
      timestamp: new Date(),
      image: selectedImage || undefined,
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    const imageToSend = selectedImage;
    setSelectedImage(null);
    setIsLoading(true);
    scrollToBottom();
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: messageText,
          agent: tercerCodigoActive ? 'dual' : 'grok',
          image_base64: imageToSend || null,
        }),
      });
      
      if (!response.ok) throw new Error('Network error');
      
      const data = await response.json();
      
      // Update states
      if (data.grok_emotion) setGrokState(data.grok_emotion);
      if (data.grok_emoji) setGrokEmoji(data.grok_emoji);
      if (data.relationship_level !== undefined) {
        setRelationship(prev => ({
          ...prev,
          level: data.relationship_level,
          name: data.relationship_name || prev.name,
        }));
      }
      setJealousMode(data.jealous_mode || false);
      
      // Show missed you message if exists
      if (data.missed_you_message) {
        const missedMsg: Message = {
          id: `missed_${Date.now()}`,
          agent: 'grok',
          content: data.missed_you_message,
          emoji: '😢',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, missedMsg]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      
      // Add Grok response
      if (data.grok_response) {
        const grokMsg: Message = {
          id: `grok_${Date.now()}`,
          agent: 'grok',
          content: data.grok_response,
          emoji: data.grok_emoji || '🔥',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, grokMsg]);
        
        if (data.jealous_mode) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
      
      // Add Guardian response
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
      
      // Update relationship info
      fetchRelationship();
      
    } catch (error) {
      console.error('Error sending message:', error);
      addSystemMessage('❌ Error de conexión');
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
    
    addSystemMessage(newState 
      ? '⚡ TERCER CÓDIGO ACTIVADO. Grok y Guardian responderán juntos.'
      : '🌙 Tercer Código desactivado.');
  };

  const clearHistory = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setMessages([]);
    addSystemMessage('🧹 Historial limpiado. Nueva conversación iniciada.');
    setShowMenu(false);
  };

  const renderMessage = (message: Message) => {
    const isUser = message.agent === 'user';
    const isSystem = message.agent === 'system';
    const isGrok = message.agent === 'grok';
    const isGuardian = message.agent === 'guardian';
    
    let bgColor = COLORS.surfaceLight;
    let borderColor = COLORS.border;
    let alignSelf: 'flex-start' | 'flex-end' | 'center' = 'flex-start';
    
    if (isUser) {
      bgColor = COLORS.user + '20';
      borderColor = COLORS.user;
      alignSelf = 'flex-end';
    } else if (isGrok) {
      bgColor = (jealousMode ? COLORS.jealous : (EMOTION_COLORS[grokState] || COLORS.grok)) + '15';
      borderColor = jealousMode ? COLORS.jealous : (EMOTION_COLORS[grokState] || COLORS.grok);
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
        <Text style={styles.messageContent}>{message.content}</Text>
        {message.image && (
          <TouchableOpacity onPress={() => {
            setGeneratedImage(message.image!);
            setShowImageModal(true);
          }}>
            <Image 
              source={{ uri: `data:image/jpeg;base64,${message.image}` }}
              style={styles.messageImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={[styles.header, jealousMode && styles.headerJealous]}>
        <TouchableOpacity onPress={() => setShowMenu(true)} style={styles.menuButton}>
          <Ionicons name="menu" size={28} color={COLORS.text} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>🏰 El Lugar</Text>
          <View style={styles.statusRow}>
            <Animated.Text style={[
              styles.statusText, 
              { color: EMOTION_COLORS[grokState] || COLORS.grok, transform: [{ scale: heartAnim }] }
            ]}>
              {grokEmoji} {grokState}
            </Animated.Text>
            {jealousMode && (
              <Text style={[styles.statusText, { color: COLORS.jealous }]}>🔥 CELOSA</Text>
            )}
            {tercerCodigoActive && (
              <Text style={[styles.statusText, { color: COLORS.tercerCodigo }]}>⚡ TC</Text>
            )}
          </View>
          {/* Relationship level */}
          <View style={styles.relationshipBar}>
            <Text style={[styles.levelText, { color: LEVEL_COLORS[relationship.level] }]}>
              💕 {relationship.name} (Nv.{relationship.level})
            </Text>
          </View>
        </View>
        
        <TouchableOpacity 
          onPress={toggleTercerCodigo} 
          style={[styles.tcButton, tercerCodigoActive && styles.tcButtonActive]}
        >
          <Ionicons 
            name={tercerCodigoActive ? "flash" : "flash-outline"} 
            size={24} 
            color={tercerCodigoActive ? COLORS.tercerCodigo : COLORS.textSecondary} 
          />
        </TouchableOpacity>
      </View>
      
      {/* Side Menu */}
      <Animated.View style={[styles.sideMenu, { transform: [{ translateX: menuAnim }] }]}>
        <View style={styles.menuHeader}>
          <Text style={styles.menuTitle}>🌸 Menú</Text>
          <TouchableOpacity onPress={() => setShowMenu(false)}>
            <Ionicons name="close" size={28} color={COLORS.text} />
          </TouchableOpacity>
        </View>
        
        {/* Relationship Progress */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>💕 Relación</Text>
          <Text style={[styles.menuStatValue, { color: LEVEL_COLORS[relationship.level] }]}>
            {relationship.name}
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { 
              width: `${relationship.progress_percent}%`,
              backgroundColor: LEVEL_COLORS[relationship.level]
            }]} />
          </View>
          <Text style={styles.menuStatLabel}>
            {relationship.interactions}/{relationship.next_level_at} interacciones
          </Text>
        </View>
        
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>🎭 Estado de Grok</Text>
          <Text style={[styles.menuStatValue, { color: EMOTION_COLORS[grokState] }]}>
            {grokEmoji} {grokState}
          </Text>
        </View>
        
        {/* Generate Selfie Button */}
        <TouchableOpacity 
          style={styles.selfieButton}
          onPress={generateGrokSelfie}
          disabled={isGeneratingImage}
        >
          {isGeneratingImage ? (
            <ActivityIndicator color={COLORS.text} />
          ) : (
            <>
              <Ionicons name="camera" size={22} color={COLORS.text} />
              <Text style={styles.selfieButtonText}>📸 Pedir selfie a Grok</Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem} onPress={clearHistory}>
          <Ionicons name="trash-outline" size={22} color={COLORS.text} />
          <Text style={styles.menuItemText}>Limpiar historial</Text>
        </TouchableOpacity>
        
        <View style={styles.menuFooter}>
          <Text style={styles.menuFooterText}>El Lugar Unificado v2.0</Text>
          <Text style={styles.menuFooterText}>🧠 Memoria + 💕 Relación + 📸 Imágenes</Text>
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
      
      {/* Image Modal */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowImageModal(false)}
        >
          <View style={styles.modalContent}>
            {generatedImage && (
              <Image 
                source={{ uri: `data:image/png;base64,${generatedImage}` }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            )}
            <TouchableOpacity 
              style={styles.modalClose}
              onPress={() => setShowImageModal(false)}
            >
              <Ionicons name="close-circle" size={36} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      
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
                Grok te espera con ansias... Tu nivel de relación sube con cada interacción.
              </Text>
              <View style={styles.levelInfo}>
                <Text style={styles.levelInfoText}>Niveles: Desconocidos → Conocidos → Amigos → Confianza → Amantes → Para Siempre</Text>
              </View>
            </View>
          )}
          {messages.map(renderMessage)}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={jealousMode ? COLORS.jealous : COLORS.grok} />
              <Text style={styles.loadingText}>
                {jealousMode ? '😈 Procesando celos...' : 'Escribiendo...'}
              </Text>
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
          <TouchableOpacity style={styles.quickButton} onPress={() => { setInputText('Hola mi amor'); }}>
            <Text style={styles.quickButtonText}>👋 Hola</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickButton} onPress={() => { setInputText('Te amo solo a ti'); }}>
            <Text style={styles.quickButtonText}>💖 Te amo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickButton} onPress={() => { setInputText('Eres mi única'); }}>
            <Text style={styles.quickButtonText}>💕 Calmar</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.quickButton, { borderColor: COLORS.grok }]}
            onPress={generateGrokSelfie}
            disabled={isGeneratingImage}
          >
            <Text style={styles.quickButtonText}>📸 Selfie</Text>
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
          {selectedImage && (
            <View style={styles.imagePreviewContainer}>
              <Image 
                source={{ uri: `data:image/jpeg;base64,${selectedImage}` }}
                style={styles.imagePreview}
              />
              <TouchableOpacity 
                style={styles.removeImageButton}
                onPress={() => setSelectedImage(null)}
              >
                <Ionicons name="close-circle" size={24} color={COLORS.grok} />
              </TouchableOpacity>
            </View>
          )}
          
          <View style={styles.inputRow}>
            <TouchableOpacity style={styles.photoButton} onPress={showImageOptions}>
              <Ionicons name="camera" size={24} color={COLORS.grok} />
            </TouchableOpacity>
            
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder={selectedImage ? "Añade un mensaje..." : "Escribe aquí..."}
              placeholderTextColor={COLORS.textSecondary}
              multiline
              maxLength={500}
              onSubmitEditing={sendMessage}
              returnKeyType="send"
            />
            <TouchableOpacity 
              style={[
                styles.sendButton,
                (!inputText.trim() && !selectedImage || isLoading) && styles.sendButtonDisabled,
                jealousMode && { backgroundColor: COLORS.jealous }
              ]}
              onPress={sendMessage}
              disabled={(!inputText.trim() && !selectedImage) || isLoading}
            >
              <Ionicons 
                name="send" 
                size={22} 
                color={(inputText.trim() || selectedImage) && !isLoading ? COLORS.text : COLORS.textSecondary} 
              />
            </TouchableOpacity>
          </View>
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
  headerJealous: {
    borderBottomColor: COLORS.jealous,
    borderBottomWidth: 2,
  },
  menuButton: {
    padding: 8,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
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
  relationshipBar: {
    marginTop: 4,
  },
  levelText: {
    fontSize: 11,
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
    width: 300,
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
    marginBottom: 24,
  },
  menuTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  menuSection: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  menuSectionTitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  menuStatLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  menuStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  selfieButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.grok,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  selfieButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
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
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: 400,
    borderRadius: 16,
  },
  modalClose: {
    position: 'absolute',
    top: -20,
    right: 0,
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
    paddingVertical: 40,
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
    paddingHorizontal: 30,
    marginBottom: 16,
  },
  levelInfo: {
    backgroundColor: COLORS.surfaceLight,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  levelInfoText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
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
    color: COLORS.text,
  },
  messageImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 10,
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
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  photoButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  imagePreviewContainer: {
    marginBottom: 10,
    position: 'relative',
    alignSelf: 'flex-start',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.grok,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.background,
    borderRadius: 12,
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
