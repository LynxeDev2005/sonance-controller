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
          <ArrowLeft size={20} color="#94a3b8" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Voice & Siri Setup Guide</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Step 1: Siri Voice Commands */}
        <View style={styles.guideCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.stepBadge, { backgroundColor: '#0284c7' }]}>
              <Mic size={16} color="#ffffff" />
            </View>
            <Text style={styles.cardTitle}>1. Siri Voice Shortcuts (iOS)</Text>
          </View>

          <Text style={styles.bodyText}>
            You can trigger commands completely hands-free from your iPhone or Apple Watch using Siri:
          </Text>

          <View style={styles.commandList}>
            <View style={styles.commandItem}>
              <Text style={styles.commandPhrase}>"Hey Siri, Turn on my PC"</Text>
              <Text style={styles.commandDesc}>Sends Wake-on-LAN Magic Packet</Text>
            </View>
            <View style={styles.commandItem}>
              <Text style={styles.commandPhrase}>"Hey Siri, Shutdown PC"</Text>
              <Text style={styles.commandDesc}>Triggers authenticated Windows shutdown</Text>
            </View>
            <View style={styles.commandItem}>
              <Text style={styles.commandPhrase}>"Hey Siri, Restart PC"</Text>
              <Text style={styles.commandDesc}>Reboots your Windows machine</Text>
            </View>
            <View style={styles.commandItem}>
              <Text style={styles.commandPhrase}>"Hey Siri, Sleep PC"</Text>
              <Text style={styles.commandDesc}>Suspends PC to RAM</Text>
            </View>
          </View>

          <Text style={styles.subText}>
            💡 <Text style={{ fontWeight: '700', color: '#f8fafc' }}>Automatic Donation:</Text> Every time you press a button or use the in-app voice in PC Control, the app automatically registers that action with iOS Siri Suggestions so it appears in your Shortcuts app.
          </Text>
        </View>

        {/* Step 2: Wake-on-LAN BIOS Setup */}
        <View style={styles.guideCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.stepBadge, { backgroundColor: '#059669' }]}>
              <Settings size={16} color="#ffffff" />
            </View>
            <Text style={styles.cardTitle}>2. PC BIOS / UEFI Wake-on-LAN</Text>
          </View>

          <Text style={styles.bodyText}>
            To allow your PC to turn on from a powered-off or sleeping state:
          </Text>

          <View style={styles.stepList}>
            <View style={styles.stepItem}>
              <Check size={14} color="#4ade80" />
              <Text style={styles.stepItemText}>
                Restart PC and enter BIOS (<Text style={styles.codeText}>DEL</Text> or <Text style={styles.codeText}>F2</Text> key).
              </Text>
            </View>
            <View style={styles.stepItem}>
              <Check size={14} color="#4ade80" />
              <Text style={styles.stepItemText}>
                Navigate to <Text style={styles.codeText}>Advanced</Text> → <Text style={styles.codeText}>Power Management / APM</Text>.
              </Text>
            </View>
            <View style={styles.stepItem}>
              <Check size={14} color="#4ade80" />
              <Text style={styles.stepItemText}>
                Enable <Text style={styles.codeText}>Power On By PCI-E/LAN Device</Text> (or <Text style={styles.codeText}>Wake on LAN</Text>).
              </Text>
            </View>
            <View style={styles.stepItem}>
              <Check size={14} color="#4ade80" />
              <Text style={styles.stepItemText}>
                Save settings and boot into Windows.
              </Text>
            </View>
          </View>
        </View>

        {/* Step 3: Windows Network Adapter Settings */}
        <View style={styles.guideCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.stepBadge, { backgroundColor: '#d97706' }]}>
              <Wifi size={16} color="#ffffff" />
            </View>
            <Text style={styles.cardTitle}>3. Windows Network Adapter Setup</Text>
          </View>

          <View style={styles.stepList}>
            <View style={styles.stepItem}>
              <Check size={14} color="#f59e0b" />
              <Text style={styles.stepItemText}>
                Press <Text style={styles.codeText}>Win + X</Text> → Select <Text style={styles.codeText}>Device Manager</Text>.
              </Text>
            </View>
            <View style={styles.stepItem}>
              <Check size={14} color="#f59e0b" />
              <Text style={styles.stepItemText}>
                Expand <Text style={styles.codeText}>Network adapters</Text> → Right-click your Ethernet / Wi-Fi adapter → <Text style={styles.codeText}>Properties</Text>.
              </Text>
            </View>
            <View style={styles.stepItem}>
              <Check size={14} color="#f59e0b" />
              <Text style={styles.stepItemText}>
                In <Text style={styles.codeText}>Power Management</Text> tab: Check <Text style={styles.codeText}>"Allow this device to wake the computer"</Text> & <Text style={styles.codeText}>"Only allow a magic packet to wake the computer"</Text>.
              </Text>
            </View>
            <View style={styles.stepItem}>
              <Check size={14} color="#f59e0b" />
              <Text style={styles.stepItemText}>
                In <Text style={styles.codeText}>Advanced</Text> tab: Ensure <Text style={styles.codeText}>"Wake on Magic Packet"</Text> is set to <Text style={styles.codeText}>Enabled</Text>.
              </Text>
            </View>
          </View>
        </View>

        {/* Step 4: Windows Companion Agent */}
        <View style={styles.guideCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.stepBadge, { backgroundColor: '#7c3aed' }]}>
              <ShieldCheck size={16} color="#ffffff" />
            </View>
            <Text style={styles.cardTitle}>4. Windows Background Companion</Text>
          </View>

          <Text style={styles.bodyText}>
            For Restart, Shutdown, and Sleep to work remotely:
          </Text>

          <View style={styles.stepList}>
            <View style={styles.stepItem}>
              <Check size={14} color="#a855f7" />
              <Text style={styles.stepItemText}>
                Double-click <Text style={styles.codeText}>server/install-startup.bat</Text> in this project.
              </Text>
            </View>
            <View style={styles.stepItem}>
              <Check size={14} color="#a855f7" />
              <Text style={styles.stepItemText}>
                This installs the lightweight Node.js daemon to run silently on port 5005 whenever your PC boots!
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
    backgroundColor: '#0b0f19',
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  guideCard: {
    backgroundColor: '#131927',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 18,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
  },
  bodyText: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 19,
  },
  commandList: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  commandItem: {
    gap: 2,
  },
  commandPhrase: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38bdf8',
    fontFamily: 'monospace',
  },
  commandDesc: {
    fontSize: 11,
    color: '#64748b',
  },
  subText: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
    backgroundColor: 'rgba(56, 189, 248, 0.06)',
    padding: 10,
    borderRadius: 10,
  },
  stepList: {
    gap: 10,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepItemText: {
    flex: 1,
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 18,
  },
  codeText: {
    color: '#38bdf8',
    fontFamily: 'monospace',
    fontWeight: '600',
  },
});
