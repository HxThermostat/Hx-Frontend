import React, { useCallback, useContext, useState } from "react";
import {
    Alert,
    Linking,
    StyleSheet,
    Text,
    TextStyle,
    View,
    ViewStyle
} from "react-native";

import { RouteProp, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "react-native-screens/native-stack";
import { ConnectThermostatNavigatorRouteList } from "~/navigators/ConnectThermostatNavigator";

import { BarcodeScanningResult, Camera, CameraView, PermissionStatus } from "expo-camera";

// import { captureException } from "@sentry/react-native";

import { ProvisioningContext } from "~/contexts";

import i18n from "~/i18n";

import { timeoutSignal } from "~/utils/provisioning/utils";

import images from "~/assets/images";
import colors from "~/styles/color";

import Layout from "./Layout";

const scope = "Screens.Authenticated.ConnectThermostatNavigator.ScanQRCode";

type ScanQRCodeScreenNavigationProp = NativeStackNavigationProp<
  ConnectThermostatNavigatorRouteList,
  "ScanQRCode"
>;

export type ScanQRCodeProps = {
  navigation: ScanQRCodeScreenNavigationProp;
  router: RouteProp<ConnectThermostatNavigatorRouteList, "ScanQRCode">;
};

const styles = StyleSheet.create({
  scannerContainer: {
    alignSelf: "center",
  },
  barcodeScanner: {
    width: "80%",
    aspectRatio: 1,
  },
  qrOverlay: {
    position: "absolute",
    borderWidth: 5,
    borderColor: colors.white,
    width: "70%",
    aspectRatio: 1,
    top: "5%",
    left: "5%",
  },
  qrOverlayItem: {
    position: "absolute",
    borderWidth: 5,
    borderColor: colors.white,
    width: "12%",
    aspectRatio: 1,
    marginHorizontal: "4%",
    marginVertical: "4%",
  },
  qrOverlayItemTopLeft: {},
  qrOverlayItemTopRight: {
    right: 0,
  },
  qrOverlayItemBottomLeft: {
    bottom: 0,
  },
});

const hidden: ViewStyle & TextStyle = {
  display: "none",
};

export default function ScanQRCode(props: ScanQRCodeProps) {
  const { navigation } = props;

  const provision = useContext(ProvisioningContext);

  const [scanning, setScanning] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [debugMessage, setDebugMessage] = useState("");
  const [debugMessages, setDebugMessages] = useState<string[]>([]);
  // Estado para mostrar qué cámara está activa
  const [cameraFacing] = useState<'back' | 'front'>('back');

  // Debug messages commented out - using system logs instead
  // const addDebugMessage = (message: string) => {
  //   const timestamp = new Date().toLocaleTimeString();
  //   const debugMsg = `[${timestamp}] ${message}`;
  //   console.log(debugMsg);
  //   setDebugMessages(prev => [...prev, debugMsg]);
  //   setDebugMessage(debugMsg);
  // };

  useFocusEffect(useCallback(() => () => setScanning(false), []));

  useFocusEffect(
    useCallback(() => {
      // addDebugMessage("🔵 ScanQRCode screen focused");
      if (provision.connected) {
        // addDebugMessage("🟡 Aborting previous session - disconnecting");
        provision.disconnectFromDevice(undefined, false);
      }
    }, [provision])
  );

  const onPressContinue = useCallback(() => {
    // addDebugMessage("🔵 ScanQRCode: Continue button pressed");
    // addDebugMessage("🔵 Attempting WiFi connection to device");
    setConnecting(true);
    provision.connectToDevice(undefined, timeoutSignal(10000))
      .then(() => {
        // addDebugMessage("🟢 WiFi connection successful - navigating to JoinNetwork");
        navigation.navigate("JoinNetwork");
      })
      .catch((e) => {
        // addDebugMessage(`🔴 WiFi connection failed: ${e}`);
        // addDebugMessage("🟡 Staying on ScanQRCode screen");
        setConnecting(false);
      });
  }, [navigation, provision]);

  async function handleStartScanning(): Promise<void> {
    // addDebugMessage("🔵 Starting QR code scanning");
    const { status } = await Camera.requestCameraPermissionsAsync();

    if (status === PermissionStatus.GRANTED) {
      // addDebugMessage("🟢 Camera permission granted - starting scan");
      setScanning(true);
    } else if (status === PermissionStatus.DENIED) {
      // addDebugMessage("🔴 Camera permission denied - showing alert");
      // If permissions are denied, force user to go to their settings
      // to enable them
      Alert.alert(
        i18n.t("alertTitle", { scope }),
        i18n.t("alertDescription", { scope }),
        [
          {
            text: i18n.t("openSettings", { scope }),
            onPress: () => Linking.openSettings(),
          },
        ],
        { cancelable: false }
      );
    }
  }

  const handleScanComplete = useCallback(async (scanningResult: BarcodeScanningResult) => {
    // addDebugMessage(`🔵 QR code scanned: ${scanningResult.data}`);
    if (scanningResult.data.startsWith("RIPL-")) {
      // addDebugMessage("🟢 Valid RIPL QR code - connecting to device");
      provision
        .connectToDevice(
          scanningResult.data,
          timeoutSignal((2 * 60 + 15) * 1000)
        )
        // .catch(captureException);
      // addDebugMessage("🟢 Navigating to JoinNetwork with SSID");
      navigation.navigate("JoinNetwork", { ssid: scanningResult.data });
    } else {
      // addDebugMessage("🔴 Invalid QR code - not starting with RIPL-");
    }
  },
    [navigation, provision]
  );
 
  return (
    <View style={{ flex: 1 }}>
      <Layout
        content={
          <Text style={{ marginBottom: 20, color: "pink", display: "none" }}>{/* debugMessage */}</Text>
        }
        image={scanning ? undefined : images.qr}
        imageView={
          scanning ? (
            <View style={styles.scannerContainer}>
              <CameraView
                style={styles.barcodeScanner}
                onBarcodeScanned={handleScanComplete}
                barcodeScannerSettings={{
                  barcodeTypes: ["qr"],
                }}
                autofocus="on"
                facing={cameraFacing}
              />
              <View style={styles.qrOverlay}>
                <View
                  style={[styles.qrOverlayItem, styles.qrOverlayItemTopLeft]}
                />
                <View
                  style={[styles.qrOverlayItem, styles.qrOverlayItemTopRight]}
                />
                <View
                  style={[styles.qrOverlayItem, styles.qrOverlayItemBottomLeft]}
                />
              </View>
              {/* Mostrar qué cámara está activa */}
              <View style={{ position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(0,0,0,0.5)', padding: 6, borderRadius: 6 }}>
                <Text style={{ color: 'white', fontSize: 12 }}>
                  {cameraFacing === 'back' ? 'Cámara trasera' : 'Cámara frontal'}
                </Text>
              </View>
            </View>
          ) : (
            undefined
          )
        }
        title={i18n.t("title", { scope })}
        instructions={i18n.t("instructions", { scope })}
        buttonLabel={i18n.t("button", { scope })}
        onPress={scanning ? undefined : handleStartScanning}
        buttonLoading={scanning}
        instructionStyle={scanning ? hidden : undefined}
        secondaryButtonLabel={i18n.t("enterManually", { scope })}
        secondaryOnPress={() => {
          // addDebugMessage("🔵 Manual SSID entry selected");
          navigation.navigate("SSID");
        }}
        activeIndex={2}
      />
      {/* Debug Messages */}
      {/* <View style={{ 
        position: 'absolute', 
        bottom: 20, 
        left: 10, 
        right: 10, 
        backgroundColor: 'rgba(0,0,0,0.8)', 
        padding: 10,
        borderRadius: 5,
        maxHeight: 150
      }}>
        <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold', marginBottom: 5 }}>
          QR DEBUG MESSAGES:
        </Text>
        {debugMessages.slice(-3).map((msg, index) => (
          <Text key={index} style={{ color: 'white', fontSize: 9, marginBottom: 2 }}>
            {msg}
          </Text>
        ))}
      </View> */}
    </View>
  );
}