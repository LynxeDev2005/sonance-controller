import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Mic, X, Sparkles, Volume2 } from 'lucide-react-native';
import { VoiceService } from '../services/voiceService';
import { PowerAction, VoiceIntentMatch } from '../types';

interface VoiceModalProps {
  visible: boolean;
  onClose: () => void;
  onExecuteAction: (action: PowerAction) => Promise<void>;
}

export const VoiceModal: React.FC<VoiceModalProps> = ({
  visible,
  onClose,
  onExecuteAction,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [matchedIntent, setMatchedIntent] = useState<VoiceIntentMatch | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (visible) {
      startListeningAnimation();
    } else {
      setTranscript('');
      setMatchedIntent(null);
      setIsListening(false);
      setIsProcessing(false);
    }
  }, [visible]);

  const startListeningAnimation = () => {
    setIsListening(true);
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.25,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleSimulateVoiceInput = async (spokenText: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {}

    setTranscript(spokenText);
    const intent = VoiceService.parseIntent(spokenText);
    setMatchedIntent(intent);

    if (intent.action !== 'unknown' && intent.action !== 'status') {
      setIsProcessing(true);
      await onExecuteAction(intent.action);
      setIsProcessing(false);
      setTimeout(() => {
        onClose();
      }, 1200);
    }
  };

  const quickPhrases = [
    'Turn on PC',
    'Restart PC',
    'Shutdown PC',
    'Sleep PC',
    'Lock Screen',
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Sparkles size={20} color="#38bdf8" />
              <Text style={styles.headerTitle}>Voice Control</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Glowing Animated Mic */}
          <View style={styles.micContainer}>
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  transform: [{ scale: pulseAnim }],
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.25],
                    outputRange: [0.6, 0.1],
                  }),
                },
              ]}
            />
            <TouchableOpacity
              style={styles.micButton}
              activeOpacity={0.85}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                } catch {}
              }}
            >
              {isProcessing ? (
                <ActivityIndicator size="large" color="#ffffff" />
              ) : (
                <Mic size={38} color="#ffffff" />
              )}
            </TouchableOpacity>
          </View>

          {/* Transcription & Intent Feedback */}
          <View style={styles.feedbackContainer}>
            {transcript ? (
              <>
                <Text style={styles.transcriptText}>"{transcript}"</Text>
                {matchedIntent && (
                  <View
                    style={[
                      styles.intentBadge,
                      {
                        backgroundColor:
                          matchedIntent.action === 'unknown'
                            ? 'rgba(239, 68, 68, 0.15)'
                            : 'rgba(34, 197, 94, 0.15)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.intentText,
                        {
                          color:
                            matchedIntent.action === 'unknown'
                              ? '#f87171'
                              : '#4ade80',
                        },
                      ]}
                    >
                      {matchedIntent.description}
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <Text style={styles.listeningHint}>
                Listening... Say a command or choose a quick action below
              </Text>
            )}
          </View>

          {/* Quick Voice Phrase Shortcuts */}
          <View style={styles.phrasesSection}>
            <View style={styles.phrasesTitleRow}>
              <Volume2 size={14} color="#64748b" />
              <Text style={styles.phrasesTitle}>Quick Voice Commands</Text>
            </View>
            <View style={styles.phrasesGrid}>
              {quickPhrases.map((phrase, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.phraseChip}
                  onPress={() => handleSimulateVoiceInput(phrase)}
                  activeOpacity={0.7}
                  disabled={isProcessing}
                >
                  <Text style={styles.phraseChipText}>{phrase}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 16, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  micContainer: {
    width: 130,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
  },
  pulseRing: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#38bdf8',
  },
  micButton: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
  },
  feedbackContainer: {
    width: '100%',
    minHeight: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    paddingHorizontal: 12,
  },
  listeningHint: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  transcriptText: {
    color: '#38bdf8',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  intentBadge: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginTop: 4,
  },
  intentText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  phrasesSection: {
    width: '100%',
    marginTop: 16,
  },
  phrasesTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  phrasesTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  phrasesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  phraseChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  phraseChipText: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '500',
  },
});
