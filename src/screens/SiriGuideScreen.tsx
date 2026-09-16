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
                Run <Text style={styles.codeText}>server/install-startup.bat</Text> to start automatically on boot.
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
    backgroundColor: '#000000',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
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
    padding: 14,
    paddingBottom: 30,
    gap: 10,
  },
  guideCard: {
    backgroundColor: '#0d0d10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 14,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 6,
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
    lineHeight: 16,
  },
  commandList: {
    backgroundColor: '#18181b',
    borderRadius: 8,
    padding: 10,
    gap: 6,
  },
  commandItem: {
    gap: 1,
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
    gap: 6,
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
    lineHeight: 16,
  },
  codeText: {
    color: '#ffffff',
    fontFamily: 'monospace',
    fontWeight: '700',
  },
});
