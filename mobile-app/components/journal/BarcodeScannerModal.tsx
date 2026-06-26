import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Modal, Pressable, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useSQLiteContext } from 'expo-sqlite';
import { useThemeColors } from '../../types/theme';
import { lookupBarcode, BarcodeProduct } from '../../db/barcodeService';

interface BarcodeScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScanSuccess: (product: BarcodeProduct) => void;
}

const { width } = Dimensions.get('window');
const SCAN_BOX_SIZE = width * 0.7;

export default function BarcodeScannerModal({ visible, onClose, onScanSuccess }: BarcodeScannerModalProps) {
  const db = useSQLiteContext();
  const theme = useThemeColors();
  const [permission, requestPermission] = useCameraPermissions();
  
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);

  // Reset state on open
  useEffect(() => {
    if (visible) {
      setScanned(false);
      setLoading(false);
      setTorchEnabled(false);
    }
  }, [visible]);

  // Request permissions if visible and not granted yet
  useEffect(() => {
    if (visible && permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [visible, permission]);

  if (!visible) return null;

  const handleBarcodeScanned = async (type: string, data: string) => {
    if (scanned || loading) return;
    
    // Trigger medium haptic for scan registration
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setScanned(true);
    setLoading(true);

    try {
      console.log(`[BarcodeScannerModal] Barcode scanned! Type: ${type}, Data: ${data}`);
      const product = await lookupBarcode(db, data);

      if (product) {
        // Success haptic
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onScanSuccess(product);
        onClose();
      } else {
        // Failure haptic
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
          'Product Not Found',
          `The barcode "${data}" could not be found in the Open Food Facts database. Would you like to enter the food manually?`,
          [
            { 
              text: 'Try Again', 
              onPress: () => {
                setScanned(false);
                setLoading(false);
              } 
            },
            { 
              text: 'Enter Manually', 
              onPress: () => {
                onClose();
              } 
            }
          ]
        );
      }
    } catch (error) {
      console.error('[BarcodeScannerModal] Error during barcode lookup:', error);
      Alert.alert(
        'Scanning Error',
        'An error occurred while fetching the food nutrition details. Please check your network and try again.',
        [{ text: 'OK', onPress: () => { setScanned(false); setLoading(false); } }]
      );
    }
  };

  const handleRequestPermission = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await requestPermission();
    if (!result.granted) {
      Alert.alert('Permission Denied', 'Camera permission is required to scan barcodes.');
    }
  };

  // Render permission states
  const renderPermissionState = () => {
    if (!permission) {
      return (
        <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
          <ActivityIndicator size="large" color="#c77ffb" />
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <View style={[styles.centerContainer, { backgroundColor: theme.background, paddingHorizontal: 30 }]}>
          <View style={[styles.iconWrapper, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
            <Ionicons name="camera-outline" size={48} color="#8b5cf6" />
          </View>
          <Text style={[styles.permissionTitle, { color: theme.textPrimary }]}>Camera Access Required</Text>
          <Text style={[styles.permissionDesc, { color: theme.textSecondary }]}>
            To scan food barcodes, we need permission to use your device's camera.
          </Text>
          
          <Pressable 
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && styles.btnPressed
            ]}
            onPress={handleRequestPermission}
          >
            <Text style={styles.primaryBtnText}>Enable Camera</Text>
          </Pressable>

          <Pressable 
            style={({ pressed }) => [
              styles.secondaryBtn,
              pressed && { opacity: 0.7 }
            ]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onClose(); }}
          >
            <Text style={[styles.secondaryBtnText, { color: theme.textDim }]}>Cancel</Text>
          </Pressable>
        </View>
      );
    }

    return null;
  };

  const isPermissionGranted = permission?.granted;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {!isPermissionGranted ? (
        renderPermissionState()
      ) : (
        <View style={styles.container}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            onBarcodeScanned={scanned ? undefined : ({ type, data }) => handleBarcodeScanned(type, data)}
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
            }}
            enableTorch={torchEnabled}
          >
            {/* Dark Overlay around Scanner Window */}
            <View style={styles.overlayContainer}>
              <View style={styles.overlayTop}>
                {/* Header controls */}
                <View style={styles.header}>
                  <Pressable 
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onClose(); }} 
                    style={styles.closeBtn}
                  >
                    <Ionicons name="close" size={26} color="#ffffff" />
                  </Pressable>
                  <Text style={styles.headerTitle}>Scan Barcode</Text>
                  <Pressable 
                    onPress={() => { 
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); 
                      setTorchEnabled(!torchEnabled); 
                    }} 
                    style={styles.closeBtn}
                  >
                    <Ionicons name={torchEnabled ? "flash" : "flash-off"} size={22} color="#ffffff" />
                  </Pressable>
                </View>
              </View>

              <View style={styles.overlayMiddle}>
                <View style={styles.overlaySide} />
                
                {/* Target Scan Box */}
                <View style={styles.scanBox}>
                  {/* Custom corner indicators */}
                  <View style={[styles.corner, styles.topLeft]} />
                  <View style={[styles.corner, styles.topRight]} />
                  <View style={[styles.corner, styles.bottomLeft]} />
                  <View style={[styles.corner, styles.bottomRight]} />

                  {/* Red scanning animation / guideline */}
                  {!loading && <View style={styles.scanLine} />}
                  
                  {loading && (
                    <View style={styles.loadingOverlay}>
                      <ActivityIndicator size="large" color="#c77ffb" />
                      <Text style={styles.loadingText}>Fetching nutrition data...</Text>
                    </View>
                  )}
                </View>

                <View style={styles.overlaySide} />
              </View>

              <View style={styles.overlayBottom}>
                <Text style={styles.instructionText}>
                  Center the product barcode inside the frame to scan.
                </Text>
                <Text style={styles.subInstructionText}>
                  Supports EAN, UPC, and Code 128 barcodes.
                </Text>
              </View>
            </View>
          </CameraView>
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  permissionDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  primaryBtn: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 28,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryBtn: {
    marginTop: 16,
    paddingVertical: 12,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Overlay Layout
  overlayContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 40,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  overlayMiddle: {
    flexDirection: 'row',
    height: SCAN_BOX_SIZE,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scanBox: {
    width: SCAN_BOX_SIZE,
    height: SCAN_BOX_SIZE,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    paddingTop: 30,
    paddingHorizontal: 40,
  },
  instructionText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  subInstructionText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    textAlign: 'center',
  },

  // Corners styling for scanning viewfinder
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#c77ffb',
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 12,
  },
  
  // Laser Scan Line
  scanLine: {
    position: 'absolute',
    left: 10,
    right: 10,
    top: SCAN_BOX_SIZE / 2 - 1,
    height: 2,
    backgroundColor: '#8b5cf6',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
