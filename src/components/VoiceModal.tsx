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
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
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
      }, 1000);
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
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Sparkles size={16} color="#ffffff" />
              <Text style={styles.headerTitle}>VOICE COMMANDS</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={16} color="#a1a1aa" />
            </TouchableOpacity>
          </View>

          {/* Minimalist Glowing Animated Mic */}
          <View style={styles.micContainer}>
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  transform: [{ scale: pulseAnim }],
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.2],
                    outputRange: [0.4, 0.05],
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
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <Mic size={28} color="#000000" />
              )}
            </TouchableOpacity>
          </View>

          {/* Transcription & Intent Feedback */}
          <View style={styles.feedbackContainer}>
            {transcript ? (
              <>
                <Text style={styles.transcriptText}>"{transcript}"</Text>
                {matchedIntent && (
                  <View style={styles.intentBadge}>
                    <Text style={styles.intentText}>
                      {matchedIntent.description}
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <Text style={styles.listeningHint}>
                Listening for commands... Or tap a quick action below
              </Text>
            )}
          </View>

          {/* Quick Voice Phrase Shortcuts */}
          <View style={styles.phrasesSection}>
            <View style={styles.phrasesTitleRow}>
              <Volume2 size={12} color="#71717a" />
              <Text style={styles.phrasesTitle}>Suggested Actions</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#111116',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 22,
    paddingBottom: 38,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 1,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#181820',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  micContainer: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  pulseRing: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#ffffff',
  },
  micButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  feedbackContainer: {
    width: '100%',
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    paddingHorizontal: 8,
  },
  listeningHint: {
    color: '#71717a',
    fontSize: 12,
    textAlign: 'center',
  },
  transcriptText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  intentBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#181820',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  intentText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#d4d4d8',
    textAlign: 'center',
  },
  phrasesSection: {
    width: '100%',
    marginTop: 14,
  },
  phrasesTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 10,
  },
  phrasesTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#71717a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  phrasesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  phraseChip: {
    backgroundColor: '#181820',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  phraseChipText: {
    color: '#e4e4e7',
    fontSize: 12,
    fontWeight: '600',
  },
});
