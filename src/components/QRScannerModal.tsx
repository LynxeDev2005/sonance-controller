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
import { X, Flashlight, FlashlightOff, Camera, ShieldCheck, AlertCircle } from 'lucide-react-native';
import { DeviceConfig } from '../types';
import { sanitizeMacAddress, isValidMacAddress, isValidIpv4, calculateSubnetBroadcast } from '../utils/networkUtils';

interface QRScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScanSuccess: (deviceConfig: DeviceConfig) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
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
      if (data.trim().startsWith('{') && data.trim().endsWith('}')) {
        parsed = JSON.parse(data);
      } else if (data.includes('sonance://') || data.includes('http')) {
        // 2. Try parsing URL query parameters
        const urlStr = data.replace(/^sonance:\/\//, 'http://localhost/');
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
        setScanError('Unrecognized QR code format. Please scan the QR code from the Sonance PC Companion app.');
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } catch {}
        return;
      }

      const ip = (parsed.ipAddress || parsed.ip || parsed.host || '').trim();
      const rawMac = (parsed.macAddress || parsed.mac || '').trim();
      const sanitizedMac = sanitizeMacAddress(rawMac);
      const name = (parsed.name || parsed.hostname || `PC-${ip.split('.').pop() || '1'}`).trim();
      const port = parseInt(parsed.port || '5005', 10) || 5005;
      const pin = (parsed.pin !== undefined ? String(parsed.pin) : '1234').trim();

      if (!isValidIpv4(ip)) {
        setScanError(`Invalid IPv4 address in QR code: "${ip}"`);
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } catch {}
        return;
      }

      if (!isValidMacAddress(sanitizedMac)) {
        setScanError(`Invalid MAC address in QR code: "${rawMac}"`);
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
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />

        {/* Permission Request Screen */}
        {!permission?.granted ? (
          <View style={styles.permissionContainer}>
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
        ) : (
          <View style={styles.cameraWrapper}>
            {/* Live Camera Feed */}
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              enableTorch={torch}
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
              onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            />

            {/* Dark Mask Vignette */}
            <View style={styles.maskContainer}>
              {/* Top Header Controls */}
              <View style={styles.topControlBar}>
                <TouchableOpacity
                  style={styles.controlCircleBtn}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <X size={18} color="#ffffff" />
                </TouchableOpacity>

                <View style={styles.headerTitlePill}>
                  <Text style={styles.headerTitleText}>PAIR PC WITH QR</Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.controlCircleBtn,
                    torch && styles.controlCircleBtnActive,
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

              {/* Instructions Banner */}
              <View style={styles.instructionPill}>
                <Text style={styles.instructionText}>
                  Align the QR code on your PC screen within the frame
                </Text>
              </View>

              {/* Central Target Scanner Box */}
              <View style={styles.centerTargetArea}>
                <View style={styles.scanTargetBox}>
                  {/* Neumorphic Corner Brackets */}
                  <View style={[styles.bracket, styles.bracketTL]} />
                  <View style={[styles.bracket, styles.bracketTR]} />
                  <View style={[styles.bracket, styles.bracketBL]} />
                  <View style={[styles.bracket, styles.bracketBR]} />

                  {/* Animated Laser Line */}
                  <Animated.View
                    style={[
                      styles.laserLine,
                      {
                        transform: [{ translateY: scanLineAnim }],
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Error or Status Toast */}
              {scanError && (
                <View style={styles.errorToast}>
                  <AlertCircle size={14} color="#ffffff" />
                  <Text style={styles.errorToastText}>{scanError}</Text>
                </View>
              )}

              {/* Bottom Tip Card */}
              <View style={styles.bottomTipCard}>
                <Text style={styles.bottomTipTitle}>SONANCE PC COMPANION</Text>
                <Text style={styles.bottomTipDesc}>
                  Open Sonance on Windows &rarr; QR code is displayed on the main dashboard.
                </Text>
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0d',
  },
  cameraWrapper: {
    flex: 1,
    position: 'relative',
  },
  maskContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: 'rgba(10, 10, 13, 0.45)',
  },
  topControlBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  controlCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
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
  controlCircleBtnActive: {
    backgroundColor: '#ffffff',
  },
  headerTitlePill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(12, 12, 15, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  headerTitleText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  instructionPill: {
    backgroundColor: 'rgba(21, 21, 26, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginTop: 10,
    maxWidth: '85%',
  },
  instructionText: {
    color: '#d4d4d8',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  centerTargetArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanTargetBox: {
    width: SCAN_BOX_SIZE,
    height: SCAN_BOX_SIZE,
    borderRadius: 24,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    position: 'relative',
    overflow: 'hidden',
  },
  bracket: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#ffffff',
  },
  bracketTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 18,
  },
  bracketTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 18,
  },
  bracketBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 18,
  },
  bracketBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 18,
  },
  laserLine: {
    width: '100%',
    height: 3,
    backgroundColor: '#ffffff',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 5,
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
    maxWidth: '90%',
  },
  errorToastText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  bottomTipCard: {
    backgroundColor: 'rgba(21, 21, 26, 0.92)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 14,
    paddingHorizontal: 20,
    maxWidth: '88%',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  bottomTipTitle: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  bottomTipDesc: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 16,
  },
  permIconWell: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#15151a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  permTitle: {
    fontSize: 16,
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
    marginTop: 12,
  },
  grantBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
  cancelBtn: {
    paddingVertical: 10,
  },
  cancelBtnText: {
    color: '#71717a',
    fontSize: 13,
    fontWeight: '600',
  },
});
