import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { X, Flashlight, FlashlightOff, Camera, ShieldCheck, AlertCircle, QrCode } from 'lucide-react-native';
import { DeviceConfig } from '../types';
import { sanitizeMacAddress, isValidMacAddress, isValidIpv4, calculateSubnetBroadcast } from '../utils/networkUtils';

interface QRScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScanSuccess: (deviceConfig: DeviceConfig) => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SCAN_BOX_SIZE = Math.min(SCREEN_WIDTH * 0.72, 270);

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  visible,
  onClose,
  onScanSuccess,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Animated laser line
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setScanned(false);
      setScanError(null);
      setTorch(false);

      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: SCAN_BOX_SIZE - 4,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 1800,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();

      return () => {
        animation.stop();
        scanLineAnim.setValue(0);
      };
    }
  }, [visible, scanLineAnim]);

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;

    try {
      let parsed: any = null;

      // 1. Try parsing JSON format
      const trimmed = (data || '').trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        parsed = JSON.parse(trimmed);
      } else if (trimmed.includes('sonance://') || trimmed.includes('http')) {
        // 2. Try parsing URL query parameters
        const urlStr = trimmed.replace(/^sonance:\/\//, 'http://localhost/');
        const url = new URL(urlStr);
        parsed = {
          name: url.searchParams.get('name') || url.searchParams.get('hostname'),
          ipAddress: url.searchParams.get('ip') || url.searchParams.get('ipAddress'),
          macAddress: url.searchParams.get('mac') || url.searchParams.get('macAddress'),
          port: url.searchParams.get('port'),
          pin: url.searchParams.get('pin'),
        };
      }

      if (!parsed) {
        setScanError('Unrecognized QR format. Please scan the QR code in Sonance PC Companion.');
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } catch {}
        return;
      }

      const ip = (parsed.ipAddress || parsed.ip || parsed.primaryIp || parsed.host || '').trim();
      const rawMac = (parsed.macAddress || parsed.mac || parsed.primaryMac || '').trim();
      const sanitizedMac = sanitizeMacAddress(rawMac);
      const name = (parsed.name || parsed.hostname || `PC-${ip.split('.').pop() || '1'}`).trim();
      const port = parseInt(parsed.port || '5005', 10) || 5005;
      const pin = (parsed.pin !== undefined ? String(parsed.pin) : '1234').trim();

      if (!isValidIpv4(ip)) {
        setScanError(`Invalid IPv4 address in QR: "${ip}"`);
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } catch {}
        return;
      }

      if (!isValidMacAddress(sanitizedMac)) {
        setScanError(`Invalid MAC address in QR: "${rawMac}"`);
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } catch {}
        return;
      }

      // Successful parse
      setScanned(true);
      setScanError(null);

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}

      const newDevice: DeviceConfig = {
        id: `pc-${Date.now()}`,
        name,
        ipAddress: ip,
        macAddress: sanitizedMac,
        broadcastAddress: calculateSubnetBroadcast(ip),
        port,
        pin,
        createdAt: Date.now(),
      };

      onScanSuccess(newDevice);
      onClose();
    } catch (e: any) {
      setScanError('Failed to parse QR code: ' + (e.message || 'Corrupted data'));
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View style={styles.fullScreenRoot}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

        {/* Permission Screen */}
        {!permission?.granted ? (
          <SafeAreaView style={styles.permSafeArea}>
            <View style={styles.permCard}>
              <View style={styles.permIconWell}>
                <Camera size={36} color="#ffffff" />
              </View>
              <Text style={styles.permTitle}>CAMERA ACCESS NEEDED</Text>
              <Text style={styles.permDesc}>
                Sonance requires camera permission to scan the pairing QR code displayed in your Sonance PC Companion desktop application.
              </Text>

              <TouchableOpacity
                style={styles.grantBtn}
                onPress={requestPermission}
                activeOpacity={0.8}
              >
                <ShieldCheck size={16} color="#000000" />
                <Text style={styles.grantBtnText}>Grant Camera Access</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        ) : (
          <View style={styles.cameraContainer}>
            {/* Live Camera Feed - Top level full screen */}
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              enableTorch={torch}
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
              onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            />

            {/* Dark Mask Overlay Framing the Scan Area */}
            <View style={styles.maskOverlay} pointerEvents="box-none">
              {/* Header Navigation Bar */}
              <SafeAreaView style={styles.safeHeaderArea} pointerEvents="box-none">
                <View style={styles.topBar}>
                  <TouchableOpacity
                    style={styles.circleBtn}
                    onPress={onClose}
                    activeOpacity={0.7}
                  >
                    <X size={18} color="#ffffff" />
                  </TouchableOpacity>

                  <View style={styles.titleBadge}>
                    <QrCode size={13} color="#ffffff" />
                    <Text style={styles.titleBadgeText}>PAIR WITH QR</Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.circleBtn,
                      torch && styles.circleBtnActive,
                    ]}
                    onPress={() => {
                      try {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      } catch {}
                      setTorch(!torch);
                    }}
                    activeOpacity={0.7}
                  >
                    {torch ? (
                      <Flashlight size={18} color="#000000" />
                    ) : (
                      <FlashlightOff size={18} color="#ffffff" />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Instruction Pill */}
                <View style={styles.instructionPill}>
                  <Text style={styles.instructionText}>
                    Point your camera at the Sonance desktop companion screen
                  </Text>
                </View>
              </SafeAreaView>

              {/* Central Target Scanner Reticle */}
              <View style={styles.reticleContainer} pointerEvents="none">
                <View style={styles.reticleBox}>
                  {/* Corner Target Brackets */}
                  <View style={[styles.cornerBracket, styles.cornerTL]} />
                  <View style={[styles.cornerBracket, styles.cornerTR]} />
                  <View style={[styles.cornerBracket, styles.cornerBL]} />
                  <View style={[styles.cornerBracket, styles.cornerBR]} />

                  {/* Animated Sweeping Laser */}
                  <Animated.View
                    style={[
                      styles.laserBeam,
                      {
                        transform: [{ translateY: scanLineAnim }],
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Bottom Instructions & Errors */}
              <SafeAreaView style={styles.safeBottomArea} pointerEvents="box-none">
                {scanError && (
                  <View style={styles.errorToast}>
                    <AlertCircle size={14} color="#ffffff" />
                    <Text style={styles.errorToastText}>{scanError}</Text>
                  </View>
                )}

                <View style={styles.bottomInfoCard}>
                  <Text style={styles.bottomCardHeader}>DESKTOP PAIRING</Text>
                  <Text style={styles.bottomCardDesc}>
                    Open Sonance on Windows &rarr; Pairing QR is on the main window.
                  </Text>
                </View>
              </SafeAreaView>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fullScreenRoot: {
    flex: 1,
    backgroundColor: '#000000',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  permSafeArea: {
    flex: 1,
    backgroundColor: '#0a0a0d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 14,
    maxWidth: 360,
  },
  permIconWell: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#15151a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  permTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 1,
  },
  permDesc: {
    fontSize: 13,
    color: '#a1a1aa',
    textAlign: 'center',
    lineHeight: 20,
  },
  grantBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: '100%',
    marginTop: 10,
  },
  grantBtnText: {
    color: '#000000',
    fontSize: 13.5,
    fontWeight: '700',
  },
  cancelBtn: {
    paddingVertical: 8,
  },
  cancelBtnText: {
    color: '#71717a',
    fontSize: 13,
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: '#000000',
  },
  maskOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  safeHeaderArea: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(21, 21, 26, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  circleBtnActive: {
    backgroundColor: '#ffffff',
  },
  titleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(12, 12, 15, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  titleBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  instructionPill: {
    backgroundColor: 'rgba(21, 21, 26, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 12,
    maxWidth: '85%',
  },
  instructionText: {
    color: '#d4d4d8',
    fontSize: 11.5,
    fontWeight: '600',
    textAlign: 'center',
  },
  reticleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  reticleBox: {
    width: SCAN_BOX_SIZE,
    height: SCAN_BOX_SIZE,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    position: 'relative',
    overflow: 'hidden',
  },
  cornerBracket: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderColor: '#ffffff',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 18,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 18,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 18,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 18,
  },
  laserBeam: {
    width: '100%',
    height: 3,
    backgroundColor: '#ffffff',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 5,
  },
  safeBottomArea: {
    width: '100%',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 16,
  },
  errorToast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    maxWidth: '88%',
  },
  errorToastText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  bottomInfoCard: {
    backgroundColor: 'rgba(21, 21, 26, 0.9)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 18,
    maxWidth: '85%',
    alignItems: 'center',
    gap: 3,
  },
  bottomCardHeader: {
    color: '#71717a',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1,
  },
  bottomCardDesc: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '600',
    textAlign: 'center',
  },
});
