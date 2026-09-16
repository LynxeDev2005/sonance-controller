import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { ArrowLeft, Mic, Settings, Wifi, ShieldCheck, Check } from 'lucide-react-native';

interface SiriGuideScreenProps {
  onBack: () => void;
}

export const SiriGuideScreen: React.FC<SiriGuideScreenProps> = ({ onBack }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <ArrowLeft size={16} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SIRI & BIOS SETUP</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Step 1: Siri Voice Commands */}
        <View style={styles.guideCard}>
          <View style={styles.cardHeader}>
            <View style={styles.stepBadge}>
              <Mic size={14} color="#000000" />
            </View>
            <Text style={styles.cardTitle}>1. Siri Voice Shortcuts</Text>
          </View>

          <Text style={styles.bodyText}>
            Say hands-free commands from your iPhone or Apple Watch:
          </Text>

          <View style={styles.commandList}>
            <View style={styles.commandItem}>
              <Text style={styles.commandPhrase}>"Hey Siri, Turn on my PC"</Text>
              <Text style={styles.commandDesc}>Sends Wake-on-LAN Magic Packet</Text>
            </View>
            <View style={styles.commandItem}>
              <Text style={styles.commandPhrase}>"Hey Siri, Shutdown PC"</Text>
              <Text style={styles.commandDesc}>Triggers Windows shutdown</Text>
            </View>
            <View style={styles.commandItem}>
              <Text style={styles.commandPhrase}>"Hey Siri, Restart PC"</Text>
              <Text style={styles.commandDesc}>Reboots target machine</Text>
            </View>
            <View style={styles.commandItem}>
              <Text style={styles.commandPhrase}>"Hey Siri, Sleep PC"</Text>
              <Text style={styles.commandDesc}>Suspends Windows session</Text>
            </View>
          </View>
        </View>

        {/* Step 2: Wake-on-LAN BIOS Setup */}
        <View style={styles.guideCard}>
          <View style={styles.cardHeader}>
            <View style={styles.stepBadge}>
              <Settings size={14} color="#000000" />
            </View>
            <Text style={styles.cardTitle}>2. PC BIOS / UEFI Setup</Text>
          </View>

          <View style={styles.stepList}>
            <View style={styles.stepItem}>
              <Check size={12} color="#ffffff" />
              <Text style={styles.stepItemText}>
                Restart PC and enter BIOS (<Text style={styles.codeText}>DEL / F2</Text>).
              </Text>
            </View>
            <View style={styles.stepItem}>
              <Check size={12} color="#ffffff" />
              <Text style={styles.stepItemText}>
                Go to <Text style={styles.codeText}>Power Management / APM</Text>.
              </Text>
            </View>
            <View style={styles.stepItem}>
              <Check size={12} color="#ffffff" />
              <Text style={styles.stepItemText}>
                Enable <Text style={styles.codeText}>Power On By PCI-E / LAN</Text>.
              </Text>
            </View>
          </View>
        </View>

        {/* Step 3: Windows Network Adapter Settings */}
        <View style={styles.guideCard}>
          <View style={styles.cardHeader}>
            <View style={styles.stepBadge}>
              <Wifi size={14} color="#000000" />
            </View>
            <Text style={styles.cardTitle}>3. Windows Network Adapter</Text>
          </View>

          <View style={styles.stepList}>
            <View style={styles.stepItem}>
              <Check size={12} color="#ffffff" />
              <Text style={styles.stepItemText}>
                Open <Text style={styles.codeText}>Device Manager</Text> → <Text style={styles.codeText}>Network Adapters</Text> → Properties.
              </Text>
            </View>
            <View style={styles.stepItem}>
              <Check size={12} color="#ffffff" />
              <Text style={styles.stepItemText}>
                In <Text style={styles.codeText}>Power Management</Text>: Check <Text style={styles.codeText}>Allow this device to wake the computer</Text>.
              </Text>
            </View>
            <View style={styles.stepItem}>
              <Check size={12} color="#ffffff" />
              <Text style={styles.stepItemText}>
                In <Text style={styles.codeText}>Advanced</Text>: Enable <Text style={styles.codeText}>Wake on Magic Packet</Text>.
              </Text>
            </View>
          </View>
        </View>

        {/* Step 4: Windows Companion Agent */}
        <View style={styles.guideCard}>
          <View style={styles.cardHeader}>
            <View style={styles.stepBadge}>
              <ShieldCheck size={14} color="#000000" />
            </View>
            <Text style={styles.cardTitle}>4. Windows Background Agent</Text>
          </View>

          <View style={styles.stepList}>
            <View style={styles.stepItem}>
              <Check size={12} color="#ffffff" />
              <Text style={styles.stepItemText}>
                Install and launch <Text style={styles.codeText}>Sonance PC Companion</Text> (or run <Text style={styles.codeText}>server/install-startup.bat</Text>) on your PC.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a0a0d',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  backBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#15151a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
    gap: 12,
  },
  guideCard: {
    backgroundColor: '#15151a',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    padding: 16,
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  bodyText: {
    fontSize: 12,
    color: '#a1a1aa',
    lineHeight: 18,
  },
  commandList: {
    backgroundColor: '#0c0c0f',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  commandItem: {
    gap: 2,
  },
  commandPhrase: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'monospace',
  },
  commandDesc: {
    fontSize: 10,
    color: '#71717a',
  },
  stepList: {
    gap: 8,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  stepItemText: {
    flex: 1,
    fontSize: 12,
    color: '#d4d4d8',
    lineHeight: 18,
  },
  codeText: {
    color: '#ffffff',
    fontFamily: 'monospace',
    fontWeight: '700',
  },
});
