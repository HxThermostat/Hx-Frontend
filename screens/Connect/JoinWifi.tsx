import React, { useCallback, useContext, useRef, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

import { RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "react-native-screens/native-stack";
import { ConnectThermostatNavigatorRouteList } from "~/navigators/ConnectThermostatNavigator";

// import { captureMessage, Severity } from "@sentry/react-native";

import { ProvisioningContext } from "~/contexts";

import i18n from "~/i18n";

import TextInputPassword from "~/components/Inputs/TextInputPassword";
import TextInputWithLabel from "~/components/Inputs/TextInputWithLabel";

import spacing from "~/styles/spacing";

import Layout from "./Layout";
// import { KohortFunnelEventStep, useKohortTracking } from "~/utils/kohort";
import {
    getConnectedThroughBluetooth,
    sendWifiConnectCharacteristic,
} from "~/utils/provisioning/bluetooth";

import { Peripheral } from "react-native-ble-manager";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-around",
  },
  inputs: {
    ...spacing.mttwentyeight,
    maxWidth: 320,
    width: "100%",
    marginLeft: "auto",
    marginRight: "auto",
  },
});

const scope = "Screens.Authenticated.ConnectThermostatNavigator.JoinWifi";

type JoinWifiScreenNavigationProp = NativeStackNavigationProp<
  ConnectThermostatNavigatorRouteList,
  "JoinWifi"
>;

export type JoinWifiProps = {
  navigation: JoinWifiScreenNavigationProp;
  route: RouteProp<ConnectThermostatNavigatorRouteList, "JoinWifi">;
};

export default function JoinWifi(props: JoinWifiProps): JSX.Element {
  const { navigation, route } = props;
  const { network, peripheral } = route.params;

  const provision = useContext(ProvisioningContext);

  const [password, setPassword] = useState<string>("");
  const [connecting, setConnecting] = useState<boolean>(false);
  const [debugMessages, setDebugMessages] = useState<string[]>([]);

  // Debug messages commented out - using system logs instead
  // const appendDebugMessage = (msg: string) => {
  //   setDebugMessages(prev => [...prev, msg]);
  // };

  // const { trackFunnel } = useKohortTracking();

  const didNavigateRef = useRef(false);

  const registerDevice = useCallback(
    async (peripheral?: Peripheral): Promise<void> => {
      // Debug messages commented out - using system logs instead
      // appendDebugMessage("Entering registerDevice");
      // appendDebugMessage("Inside registerDevice");
      // appendDebugMessage(`Peripheral: ${peripheral ? peripheral.id : 'undefined'}`);
      // appendDebugMessage(`BLE connected: ${getConnectedThroughBluetooth()}`);
      
      // trackFunnel({ step: KohortFunnelEventStep.Action });
      // appendDebugMessage("After track funnel step");
      
      try {
        // appendDebugMessage(`Before register: provision.dsn = ${provision.dsnValue}`);
        // appendDebugMessage(`Before register: provision.setupToken = ${provision.setupTokenValue}`);
        const locationId = await provision.register(peripheral, undefined, undefined); // Removed appendDebugMessage callback
        // appendDebugMessage(`After register step: ${locationId} (type: ${typeof locationId})`);

        if (!locationId || typeof locationId !== 'string') {
          // appendDebugMessage(`Register failed, locationId: ${locationId} (type: ${typeof locationId})`);
          // if (locationId === undefined) {
          //   return Alert.alert(
          //     i18n.t("setupIncompleteAlert.title", { scope }),
          //     i18n.t("setupIncompleteAlert.message", { scope }),
          //     [
          //       {
          //         text: i18n.t("setupIncompleteAlert.restart", { scope }),
          //         style: "default",
          //         onPress: () => navigation.navigate("Setup"),
          //       },
          //       {
          //         text: i18n.t("setupIncompleteAlert.tryAgain", { scope }),
          //         onPress: () => {
          //           registerDevice(peripheral);
          //         },
          //       },
          //     ]
          //   );
          // }

          // return Alert.alert(
          //   i18n.t("setupFailedAlert.title", { scope }),
          //   i18n.t("setupFailedAlert.message", { scope }),
          //   [
          //     {
          //       text: i18n.t("setupFailedAlert.tryAgain", { scope }),
          //       onPress: () => navigation.navigate("Setup"),
          //     },
          //   ]
          // );
        }
        // appendDebugMessage(`locationId : ${String(locationId)}`);
        if (typeof locationId === 'string') {
          navigation.navigate("NameDevice", { locationId });
          // if (!didNavigateRef.current) {
          //   didNavigateRef.current = true;
          //   // Agregar delay para asegurar que el servidor procese el registro (opcional)
          //   appendDebugMessage("Navigating to NameDevice");
          //   navigation.navigate("NameDevice", { locationId });
          // } else {
          //   appendDebugMessage("Navigation already performed, skipping");
          // }
        }
      } catch (error) {
        // appendDebugMessage(`Exception in registerDevice: ${error}`);
      }
    },
    [navigation, provision]
  );

  const connectToWifi = (peripheral?: Peripheral) => {
    setConnecting(true);
    // appendDebugMessage(`Connecting to WiFi ${getConnectedThroughBluetooth()}`);
    // appendDebugMessage(`BLE state before WiFi connection: ${getConnectedThroughBluetooth()}`);
    // appendDebugMessage(`Peripheral: ${peripheral ? peripheral.id : 'undefined'}`);
    
    if (getConnectedThroughBluetooth()) {
      // appendDebugMessage(`Connect to WiFi: ${peripheral}`);
      if (peripheral != undefined) {
        sendWifiConnectCharacteristic(
          peripheral,
          network,
          password,
          () => {
            // appendDebugMessage("Wifi connect characteristic successful, moving to registration");
            // appendDebugMessage(`BLE state after WiFi characteristic sent: ${getConnectedThroughBluetooth()}`);
            registerDevice(peripheral);
          },
          () => {
            // appendDebugMessage("Wifi connect characteristic failed");
            // appendDebugMessage(`BLE state after WiFi characteristic failed: ${getConnectedThroughBluetooth()}`);
          }
        );
      }
    } else {
      handleLogin();
    }
  };

  const handleLogin = useCallback(async (): Promise<void> => {
    setConnecting(true);
    // appendDebugMessage("Attempting to connect to WiFi");
    // appendDebugMessage(`BLE state before WiFi connection: ${getConnectedThroughBluetooth()}`);
    // appendDebugMessage(`Peripheral: ${peripheral ? peripheral.id : 'undefined'}`);
    
    const connected = await provision.connectDeviceToNetwork(
      network.ssid,
      password
    );
    // appendDebugMessage(`connected : ${connected}`);
    // appendDebugMessage(`BLE state after WiFi connection: ${getConnectedThroughBluetooth()}`);

    if (!connected) {
      let onPress: () => Promise<void>;

      if (await provision.isConnected(peripheral)) {
        onPress = () => {
          setConnecting(false);
          setPassword("");
          // appendDebugMessage("Failed to connect; please try again.");
          return Promise.resolve();
        };
      } else {
        onPress = async () => {
          await provision.disconnectFromDevice(peripheral);
          navigation.navigate("Setup");
          // appendDebugMessage("Disconnected, returning to setup.");
        };
      }

      return Alert.alert(
        i18n.t("loginFailedAlert.title", { scope }),
        i18n.t("loginFailedAlert.message", { scope }),
        [
          {
            text: i18n.t("loginFailedAlert.tryAgain", { scope }),
            onPress,
          },
        ]
      );
    }

    // appendDebugMessage("Connected to device, waiting for device info");
    // appendDebugMessage(`BLE state before waitForDevice: ${getConnectedThroughBluetooth()}`);
    try {
      await provision.waitForDevice(network.ssid, 5000, new AbortController().signal, peripheral, undefined); // Removed appendDebugMessage callback
      // appendDebugMessage("Device info obtained successfully");
      // appendDebugMessage("LOG: Right after 'Device info obtained successfully'");
    } catch (error) {
      // appendDebugMessage(`Error getting device info: ${error}`);
      // appendDebugMessage("LOG: Entering return of waitForDevice catch");
      return Alert.alert(
        "Error",
        "Failed to get device information. Please try again.",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("Setup"),
          },
        ]
      );
    }

    // appendDebugMessage("Connected to device, waiting for disconnect");
    // appendDebugMessage(`BLE state before disconnect: ${getConnectedThroughBluetooth()}`);
    // appendDebugMessage("Before disconnectFromDevice");
    //await provision.disconnectFromDevice(peripheral);
    // appendDebugMessage("After disconnectFromDevice");

    // appendDebugMessage("Waiting for register (no disconnect yet)");
    // appendDebugMessage("Before calling registerDevice");
    await registerDevice(peripheral);
    // appendDebugMessage("After calling registerDevice 2");
  }, [navigation, password, provision, registerDevice, network, peripheral]);

  return (
    <Layout
      title={i18n.t("title", { scope })}
      content={
        <View style={styles.container}>
          <View style={styles.inputs}>
            <TextInputWithLabel
              editable={false}
              value={route.params.network.ssid}
              label={i18n.t("ssidLabel", { scope })} />
            <TextInputPassword
              onChangeText={v => setPassword(v)}
              value={password}
              label={i18n.t("passwordLabel", { scope })}
              returnKeyType="done"
              onSubmitEditing={() => {
                connectToWifi(peripheral);
              } } 
              />
            {/* Debug messages commented out - using system logs instead */}
            {/* <ScrollView style={{ marginTop: 20, maxHeight: 200, backgroundColor: '#222', borderRadius: 8 }}>
              {debugMessages.map((msg, idx) => {
                const isCritical = /register|Provision|dsn|setupToken|RegisterLocation|locationId|Exception/i.test(msg);
                return (
                  <Text key={idx} style={{ color: isCritical ? 'yellow' : 'lime', fontSize: 12, marginBottom: 2 }}>{msg}</Text>
                );
              })}
            </ScrollView> */}
          </View>
        </View>
      }
      buttonLabel={i18n.t("button", { scope })}
      buttonLoading={connecting}
      onPress={() => {
        connectToWifi(peripheral);
      }}
      activeIndex={4}
    />
  );
}
// import React, { useState, useContext, useCallback } from "react";
// import { View, StyleSheet, Alert, Text } from "react-native";

// import { RouteProp } from "@react-navigation/native";
// import { NativeStackNavigationProp } from "react-native-screens/native-stack";
// import { ConnectThermostatNavigatorRouteList } from "~/navigators/ConnectThermostatNavigator";

// import { ProvisioningContext } from "~/contexts";

// import i18n from "~/i18n";

// import TextInputWithLabel from "~/components/Inputs/TextInputWithLabel";
// import TextInputPassword from "~/components/Inputs/TextInputPassword";

// import spacing from "~/styles/spacing";

// import Layout from "./Layout";
// import { KohortFunnelEventStep, useKohortTracking } from "~/utils/kohort";
// import {
//   connectedThroughBluetooth,
//   sendWifiConnectCharacteristic,
// } from "~/utils/provisioning/bluetooth.ios";

// import { Network } from "~/utils/provisioning/bluetooth.android";
// import { Peripheral } from "react-native-ble-manager";

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: "space-around",
//   },
//   inputs: {
//     ...spacing.mttwentyeight,
//     maxWidth: 320,
//     width: "100%",
//     marginLeft: "auto",
//     marginRight: "auto",
//   },
//   debugText: {
//     marginTop: 20,
//     textAlign: "center",
//     color: "gray",
//   },
// });

// const scope = "Screens.Authenticated.ConnectThermostatNavigator.JoinWifi";

// type JoinWifiScreenNavigationProp = NativeStackNavigationProp<
//   ConnectThermostatNavigatorRouteList,
//   "JoinWifi"
// >;

// export type JoinWifiProps = {
//   navigation: JoinWifiScreenNavigationProp;
//   route: RouteProp<ConnectThermostatNavigatorRouteList, "JoinWifi">;
// };

// export default function JoinWifi(props: JoinWifiProps): JSX.Element {
//   const { navigation, route } = props;
//   const { network, peripheral } = route.params;

//   const provision = useContext(ProvisioningContext);

//   const [password, setPassword] = useState<string>("");
//   const [connecting, setConnecting] = useState<boolean>(false);
//   const { trackFunnel } = useKohortTracking();
//   const [debugMessage, setDebugMessage] = useState<string>("");

//   const registerDevice = useCallback(
//     async (peripheral?: Peripheral): Promise<void> => {
//       console.log("Inside registerDevice");
//       setDebugMessage("Inside registerDevice");
//       trackFunnel({ step: KohortFunnelEventStep.Action });
//       console.log("After track funnel step");
//       setDebugMessage("After track funnel step");
//       const locationId = await provision.register(peripheral);
//       console.log(`After register step: ${locationId}`);
//       setDebugMessage(`After register step: ${locationId}`);

//       if (!locationId) {
//         if (locationId === undefined) {
//           return Alert.alert(
//             i18n.t("setupIncompleteAlert.title", { scope }),
//             i18n.t("setupIncompleteAlert.message", { scope }),
//             [
//               {
//                 text: i18n.t("setupIncompleteAlert.restart", { scope }),
//                 style: "default",
//                 onPress: () => navigation.navigate("Setup"),
//               },
//               {
//                 text: i18n.t("setupIncompleteAlert.tryAgain", { scope }),
//                 onPress: () => {
//                   registerDevice(peripheral);
//                 },
//               },
//             ]
//           );
//         }

//         return Alert.alert(
//           i18n.t("setupFailedAlert.title", { scope }),
//           i18n.t("setupFailedAlert.message", { scope }),
//           [
//             {
//               text: i18n.t("setupFailedAlert.tryAgain", { scope }),
//               onPress: () => navigation.navigate("Setup"),
//             },
//           ]
//         );
//       }

//       navigation.navigate("NameDevice", { locationId });
//     },
//     [navigation, provision, peripheral]
//   );

//   const connectToWifi = (peripheral?: Peripheral) => {
//     setConnecting(true);
//     console.log(`Connecting to WiFi ${connectedThroughBluetooth}`);
//     setDebugMessage(`Connecting to WiFi ${connectedThroughBluetooth}`);
//     if (connectedThroughBluetooth) {
//       console.log(`Connect to WiFi: ${peripheral}`);
//       setDebugMessage(`Connect to WiFi: ${peripheral}`);
//       if (peripheral != undefined) {
//         sendWifiConnectCharacteristic(
//           peripheral,
//           network,
//           password,
//           () => {
//             console.log(
//               "Wifi connect characteristic successful, moving to registration"
//             );
//             setDebugMessage("Wifi connect characteristic successful, moving to registration");
//             registerDevice(peripheral);
//           },
//           () => {
//             console.log("Wifi connect characteristic failed");
//             setDebugMessage("Wifi connect characteristic failed");
//           }
//         );
//       }
//     } else {
//       handleLogin();
//     }
//   };

//   const handleLogin = useCallback(async (): Promise<void> => {
//     setConnecting(true);
//     setDebugMessage("Attempting to connect to WiFi");
//     const connected = await provision.connectDeviceToNetwork(
//       network.ssid,
//       password
//     );
//     setDebugMessage(`connected const: ${connected }`);

//     if (!connected) {
//       let onPress: () => Promise<void>;
//       setDebugMessage(`peripheral: ${peripheral }`);

//       const isConnected = await provision.isConnected(peripheral);

//       setDebugMessage(`Device connection status: ${isConnected ? "Connected" : "Not connected"}`);
      
//       if (await provision.isConnected(peripheral)) {
//         onPress = () => {
//           setConnecting(false);
//           setPassword("");
//           setDebugMessage("Failed to connect; please try again.");
//           return Promise.resolve();
//         };
//       } else {
//         onPress = async () => {
//           await provision.disconnectFromDevice(peripheral);
//           navigation.navigate("Setup");
//           setDebugMessage("Disconnected, returning to setup.");
//         };
//       }

//       return Alert.alert(
//         i18n.t("loginFailedAlert.title", { scope }),
//         i18n.t("loginFailedAlert.message", { scope }),
//         [
//           {
//             text: i18n.t("loginFailedAlert.tryAgain", { scope }),
//             onPress,
//           },
//         ]
//       );
//     }

//     setDebugMessage("Connected to device, waiting for disconnect");
//     await provision.disconnectFromDevice(peripheral);

//     setDebugMessage("Disconnected, moving to register");
//     await registerDevice(peripheral);
//   }, [navigation, password, provision, registerDevice, network, peripheral]);

//   return (
//     <Layout
//       title={i18n.t("title", { scope })}
//       content={
//         <View style={styles.container}>
//           <View style={styles.inputs}>
//             <TextInputWithLabel
//               editable={false}
//               value={route.params.network.ssid}
//               label={i18n.t("ssidLabel", { scope })}
//             />
//             <TextInputPassword
//               onChangeText={v => setPassword(v)}
//               value={password}
//               label={i18n.t("passwordLabel", { scope })}
//               returnKeyType="done"
//               onSubmitEditing={() => {
//                 connectToWifi(peripheral);
//               }}
//             />
//             <Text style={styles.debugText}>Debug: {debugMessage}</Text>
//           </View>
//         </View>
//       }
//       buttonLabel={i18n.t("button", { scope })}
//       buttonLoading={connecting}
//       onPress={() => {
//         connectToWifi(peripheral);
//       }}
//       activeIndex={4}
//     />
//   );
// }
