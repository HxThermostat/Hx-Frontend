import React, {
    useCallback,
    useContext,
    useRef,
    useState
} from "react";
import { View } from "react-native";

import { RouteProp, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "react-native-screens/native-stack";
import { ConnectThermostatNavigatorRouteList } from "~/navigators/ConnectThermostatNavigator";

import images from "~/assets/images";
import i18n from "~/i18n";

import { ProvisioningContext } from "~/contexts";

import { bluetooth, stopScanWithReason } from "~/utils/provisioning/bluetooth";
import { isRNWifiError, sleep, timeoutSignal } from "~/utils/provisioning/utils";

import { NativeEventEmitter, NativeModules } from "react-native";
import Layout from "./Layout";

import { useBackHandler } from "@react-native-community/hooks";
import BleManager from "react-native-ble-manager";
const BleManagerModule = NativeModules.BleManager;
const BleManagerEmitter = new NativeEventEmitter(BleManagerModule);
const scope = "Screens.Authenticated.ConnectThermostatNavigator.Setup";

type SetupScreenNavigationProp = NativeStackNavigationProp<
  ConnectThermostatNavigatorRouteList,
  "Setup"
>;

export type SetupProps = {
  navigation: SetupScreenNavigationProp;
  router: RouteProp<ConnectThermostatNavigatorRouteList, "Setup">;
};

var navigation: SetupProps;

export default function Setup(props: SetupProps): JSX.Element {
  var toggleThisVarToReinitialize = false;

  navigation = props;

  const [connecting, setConnecting] = useState(false);
  const [debugMessage, setDebugMessage] = useState("");
  const [debugMessages, setDebugMessages] = useState<string[]>([]);
  const [persistentState, setPersistentState] = useState<any>(null);
  const continueTapped = useRef(false);

  // Debug messages commented out - using system logs instead
  // const addDebugMessage = (message: string) => {
  //   const timestamp = new Date().toLocaleTimeString();
  //   const debugMsg = `[${timestamp}] ${message}`;
  //   console.log(debugMsg);
  //   setDebugMessages(prev => [...prev, debugMsg]);
  //   setDebugMessage(debugMsg);
  // };


  useFocusEffect(
    useCallback(() => {
      setConnecting(false);

      BleManager.start({ showAlert: true })
      .then(() => {
        setDebugMessage("Bluetooth start success");      
      })
      .catch((error) =>
        setDebugMessage("Bluetooth start failed")
      );
      return () => {
        stopScanWithReason("Cleanup");
      };
    }, [toggleThisVarToReinitialize])
  );

  useBackHandler(() => {
    // addDebugMessage("🟡 Back button pressed - stopping scan");
    bluetooth.stopScanWithReason("onBackPress");
    return false;
  });

  const provision = useContext(ProvisioningContext);

  const onPressContinue: () => Promise<void> = () => {
    // addDebugMessage("🔵 Continue button pressed - starting BLE scan");
    setConnecting(true);
    
    return bluetooth.scanForBleDevice(
      // onDeviceFound
      device => {
        // addDebugMessage(`🟢 BLE device found: ${device.name || device.id}`);
        // addDebugMessage(`🔵 Device details: ID=${device.id}, Name=${device.name}, RSSI=${device.rssi}`);
        if (device.advertising) {
          // addDebugMessage(`🔵 Advertising data: ${JSON.stringify(device.advertising)}`);
        }
        try {
          bluetooth.connectToBluetoothDevice(
            device,
            () => {
              // addDebugMessage(`🟢 Successfully connected to BLE device: ${device.name || device.id}`);
              // addDebugMessage(`🔵 connectedThroughBluetooth set to: ${bluetooth.connectedThroughBluetooth}`);
              bluetooth.listenToWifiScanNotifications(
                navigation,
                BleManagerEmitter,
                networkList => {
                  // addDebugMessage(`🟢 Received WiFi network list: ${networkList.length} networks`);
                  // addDebugMessage(`🟢 Navigating to SelectWifi screen`);
                  navigation.navigation.navigate("SelectWifi", {
                    networks: networkList,
                    peripheral: device,
                  });
                }
              );
              bluetooth.scanWifiNetworks(device.id);
            },
            () => {
              // addDebugMessage("🔴 Failed to connect to BLE device - fallback to WiFi");
              // addDebugMessage(`🔵 connectedThroughBluetooth after failed connect: ${bluetooth.connectedThroughBluetooth}`);
            }
          );
        } catch (e) {
          // addDebugMessage(`🔴 Exception during BLE connection: ${e} - fallback to WiFi`);
        }
      },
      // onDeviceNotFound
      async () => {
        // addDebugMessage("🟡 No BLE device found - attempting WiFi fallback");
        // addDebugMessage(`🔵 connectedThroughBluetooth state: ${bluetooth.connectedThroughBluetooth}`);
        setConnecting(true);
        if (!continueTapped.current) {
          // addDebugMessage("🟡 First WiFi attempt - waiting 5 seconds");
          await sleep(5000);
        } else {
          continueTapped.current = true;
        }
        try {
          // addDebugMessage("🔵 Attempting WiFi connection to device");
          await provision.connectToDevice(undefined, timeoutSignal(10000));
          // addDebugMessage("🟢 WiFi connection successful - navigating to JoinNetwork");
          navigation.navigation.navigate("JoinNetwork");
        } catch (e) {
          // addDebugMessage(`🔴 WiFi connection failed: ${e}`);
          if (isRNWifiError(e)) {
            switch (e.code) {
              case "unavailableForOSVersion":
              case "userDenied":
              case "locationPermissionDenied":
              case "locationPermissionRestricted":
              case "locationPermissionMissing":
              case "locationServicesOff":
              case "couldNotEnableWifi":
                // addDebugMessage(`🔴 Unrecoverable WiFi error: ${e.code} - staying on screen`);
                return;
            }
          }
          // Instead of going to ScanQRCode, try to go to JoinNetwork to attempt network discovery
          // addDebugMessage("🟡 WiFi failed but attempting JoinNetwork for network discovery");
          navigation.navigation.navigate("JoinNetwork");
        } finally {
          setConnecting(false);
        }
      }
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <Layout
        image={images.setup}
        title={i18n.t("title", { scope })}
        instructions={i18n.t("instructions", { scope })}
        buttonLabel={i18n.t("Common.continue")}
        buttonLoading={connecting}
        onPress={onPressContinue}
        activeIndex={1}
      />
      {/* Debug Messages */}
      {/* <View style={{ 
        position: 'absolute', 
        top: 100, 
        left: 10, 
        right: 10, 
        backgroundColor: 'rgba(0,0,0,0.8)', 
        padding: 10,
        borderRadius: 5,
        maxHeight: 200
      }}>
        {debugMessages.slice(-3).map((msg, index) => (
          <Text key={index} style={{ color: 'white', fontSize: 9, marginBottom: 2 }}>
            {msg}
          </Text>
        ))}
      </View> */}
    </View>
  );
}