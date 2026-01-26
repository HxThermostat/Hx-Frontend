import React, { useCallback, useContext, useState } from "react";
import { StyleProp, StyleSheet, TextStyle, View } from "react-native";

import { RouteProp, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "react-native-screens/native-stack";
import { ConnectThermostatNavigatorRouteList } from "~/navigators/ConnectThermostatNavigator";

// import { captureException } from "@sentry/react-native";

import { ProvisioningContext } from "~/contexts";

import i18n from "~/i18n";

import ActivityIndicator from "~/components/ActivityIndicator";

import Layout from "./Layout";

const scope = "Screens.Authenticated.ConnectThermostatNavigator.JoinNetwork";

export type JoinNetworkProps = {
  navigation: NativeStackNavigationProp<
    ConnectThermostatNavigatorRouteList,
    "JoinNetwork"
  >;
  route: RouteProp<ConnectThermostatNavigatorRouteList, "JoinNetwork">;
};

const styles = StyleSheet.create({
  alertPlaceholder: {
    height: 180,
    justifyContent: "center",
  },
});

const titleStyle: StyleProp<TextStyle> = {
  width: 290,
};

export default function JoinNetwork(props: JoinNetworkProps): JSX.Element {
  const [connecting, setConnecting] = useState(false);
  const [debugMessage, setDebugMessage] = useState("");
  const [debugMessages, setDebugMessages] = useState<string[]>([]);

  const { navigation, route } = props;
  const ssid = route.params?.ssid;

  const provision = useContext(ProvisioningContext);

  // Debug messages commented out - using system logs instead
  // const addDebugMessage = (message: string) => {
  //   const timestamp = new Date().toLocaleTimeString();
  //   const debugMsg = `[${timestamp}] ${message}`;
  //   console.log(debugMsg);
  //   setDebugMessages(prev => [...prev, debugMsg]);
  //   setDebugMessage(debugMsg);
  // };

  const getNetworks = useCallback(
    async (signal: AbortSignal): Promise<void> => {
      try {
        // addDebugMessage("🔵 JoinNetwork: Starting network discovery");
        // addDebugMessage(`🔵 SSID from route: ${ssid || 'undefined'}`);
        
        // We expect the previous screen to have initiated (or completed) the connection process
        if (!provision.connecting && !provision.connected) {
          // addDebugMessage("🔴 Not connected or connecting - navigating to Setup");
          return navigation.navigate("Setup");
        }

        // addDebugMessage("🟡 Waiting for connection to establish");

        if (!(await provision.waitForConnection(60000))) {
          // addDebugMessage("🔴 Connection timeout - navigating to ScanQRCode");
          return navigation.navigate("ScanQRCode");
        }

        if (signal.aborted) {
          // addDebugMessage("🟡 Operation aborted - disconnecting");
          provision.disconnectFromDevice(undefined, false);
          return;
        }

        // addDebugMessage("🟢 Connected successfully - waiting for device and loading networks");

        // Lanza ambas llamadas en paralelo. Si waitForDevice falla, capturamos el error para que no impida la recuperación de networks.
        const [device, networks] = await Promise.all([
          provision.waitForDevice(ssid, 10000, signal).catch((e) => {
            // addDebugMessage(`🔴 Error in waitForDevice: ${e}`);
            return null;
          }),
          provision.networks(20000, signal)
        ]);
        
        if (signal.aborted) {
          // addDebugMessage("🟡 Operation aborted - disconnecting");
          provision.disconnectFromDevice(undefined, false);
          return;
        }
        
        // addDebugMessage(`🟢 Networks loaded: ${networks.length} networks found`);
        
        if (networks.length) {
          // addDebugMessage("🟢 Navigating to SelectWifi with networks");
          navigation.navigate("SelectWifi", {
            networks,
            peripheral: undefined,
          });
        } else {
          // addDebugMessage("🔴 No networks found - navigating to ScanQRCode");
          provision.disconnectFromDevice(undefined, false);
          navigation.navigate("ScanQRCode");
        }
      } catch (e) {
        // addDebugMessage(`🔴 Exception in getNetworks: ${e}`);
        navigation.navigate("ScanQRCode");
      }
    },
    [navigation, provision, ssid]
  );

  useFocusEffect(
    useCallback(() => {
      // addDebugMessage("🔵 JoinNetwork screen focused");
      const controller = new AbortController();
      const { signal } = controller;

      getNetworks(signal);

      return () => {
        // addDebugMessage("🟡 JoinNetwork screen unfocused - aborting operations");
        controller.abort();
      };
    }, [getNetworks, ssid])
  );

  return (
    <View style={{ flex: 1 }}>
      <Layout
        content={
          <View style={styles.alertPlaceholder}>
            <ActivityIndicator size="large" />
          </View>
        }
        title={i18n.t("title", { scope })}
        titleStyle={titleStyle}
        instructions={i18n.t("instructions", { scope })}
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
          JOIN NETWORK DEBUG:
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
