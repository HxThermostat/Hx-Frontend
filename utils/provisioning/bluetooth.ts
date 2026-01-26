// This file provides a platform-specific export for Bluetooth functionality
// The correct implementation will be used at runtime based on the platform

import { Buffer } from "buffer";
import { bytesToString } from "convert-string";
import {
    NativeEventEmitter,
    NativeModules,
    PermissionsAndroid,
    Platform
} from "react-native";
import BleManager, {
    Peripheral
} from "react-native-ble-manager";
import i18n from "~/i18n";

// Debug message function with colors
const debugMessage = (message: string, color: string = 'blue') => {
  const timestamp = new Date().toLocaleTimeString();
  const debugMsg = `[${timestamp}] ${message}`;
  console.log(debugMsg);
  // This will be used by the UI components to display colored debug messages
  return debugMsg;
};

// Android-specific debug function for UI display
let androidDebugCallback: ((msg: string) => void) | null = null;

export const setAndroidDebugCallback = (callback: (msg: string) => void) => {
  androidDebugCallback = callback;
};

const androidDebugMessage = (message: string) => {
  const timestamp = new Date().toLocaleTimeString();
  const debugMsg = `[${timestamp}] [BLE] ${message}`;
  console.log(debugMsg);
  if (Platform.OS === 'android' && androidDebugCallback) {
    androidDebugCallback(debugMsg);
  }
  return debugMsg;
};

// Request BLE permissions for Android
const requestBlePermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    androidDebugMessage('🔵 Requesting BLE permissions...');
    
    const permissions = [
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ];

    const granted = await PermissionsAndroid.requestMultiple(permissions);
    
    const allGranted = permissions.every(
      permission => granted[permission] === PermissionsAndroid.RESULTS.GRANTED
    );

    if (allGranted) {
      androidDebugMessage('🟢 All BLE permissions granted');
      return true;
    } else {
      androidDebugMessage('🔴 BLE permissions denied');
      return false;
    }
  } catch (error) {
    androidDebugMessage(`🔴 Error requesting BLE permissions: ${error}`);
    return false;
  }
};

debugMessage(`[bluetooth.ts] File is being loaded, Platform: ${Platform.OS}`, 'blue');

// Define SetupProps locally to avoid import issues
interface SetupProps {
  navigation: any;
  router: any;
}

const scope = "Utils.provisioning.bluetooth";
const BleManagerModule = NativeModules.BleManager;
const BleManagerEmitter = new NativeEventEmitter(BleManagerModule);

debugMessage(`[bluetooth.ts] BleManagerModule: ${JSON.stringify(BleManagerModule)}`, 'blue');
debugMessage(`[bluetooth.ts] BleManagerEmitter: ${JSON.stringify(BleManagerEmitter)}`, 'blue');

// Constants
export const SECONDS_TO_SCAN_FOR = 3;
export const WIFI_SERVICE_UUID = "1CF0FE66-3ECF-4D6E-A9FC-E287AB124B96";
export const WIFI_CONNECT_CHARACTERISTIC_UUID = "1F80AF6A-2B71-4E35-94E5-00F854D8F16F";
export const BLE_STATUS_CHARACTERISTIC_UUID = "1F80AF6C-2B71-4E35-94E5-00F854D8F16F";
export const WIFI_SCAN_CHARACTERISTIC_UUID = "1F80AF6D-2B71-4E35-94E5-00F854D8F16F";
export const WIFI_SCAN_RESULTS_CHARACTERISTIC_UUID = "1F80AF6E-2B71-4E35-94E5-00F854D8F16F";
export const READ_DUID_CHARACTERISTIC_UUID = "00000001-FE28-435B-991A-F1B21BB9BCD0";
const THERMOSTAT_SERVICE_UUID = ["FE28"];
export const AYLA_CONNECTIVITY_GATT_SERVICE_UUID = "FCE3EC41-59B6-4873-AE36-FAB25BD59ADC";
export const SETUP_TOKEN_CHARACTERISTIC_UUID = "7E9869ED-4DB3-4520-88EA-1C21EF1BA834";

export interface Network {
  index: number;
  ssid: string;
  ssidLength: number;
  bssid: string;
  rssi: number;
  security: number;
}

// Shared state
export const x = 1;
var connectedThroughBluetooth = false;
var bluetoothInitialized = false;
var doneScanningForWifi = false;

// Function to get the current connection state
export const getConnectedThroughBluetooth = () => bluetooth.connectedThroughBluetooth;

// Helper para estado de Bluetooth
const isBluetoothOn = (state: string) => state === 'PoweredOn' || state === 'on';
const enableBluetooth = (onSuccess: () => void, onFail: () => void) => {
  console.log("[enableBluetooth]");
  BleManager.enableBluetooth()
    .then(() => {
      onSuccess();
    })
    .catch(err => {
      console.log('errNAH 01',err);
      onFail();
    });
};
// Unified Bluetooth interface
export const bluetooth = {
  get connectedThroughBluetooth() {
    debugMessage(`[bluetooth.ts] get connectedThroughBluetooth: ${connectedThroughBluetooth}`, 'blue');
    return connectedThroughBluetooth;
  },
  
  set connectedThroughBluetooth(value: boolean) {
    debugMessage(`[bluetooth.ts] set connectedThroughBluetooth: ${value}`, 'blue');
    connectedThroughBluetooth = value;
  },
  
  getDSN: async (peripheralId: string): Promise<number[]> => {
    debugMessage(`[bluetooth.ts] getDSN called with peripheralId: ${peripheralId}`, 'blue');
    const promise: Promise<number[]> = BleManager.read(
      peripheralId,
      THERMOSTAT_SERVICE_UUID[0],
      READ_DUID_CHARACTERISTIC_UUID
    ) as Promise<number[]>;
    debugMessage('[bluetooth.ts] getDSN returning promise', 'blue');
    return promise;
  },

  // initializeBluetooth: async (
  //   onSuccess: () => void,
  //   onFail: () => void
  // ) => {
  //   debugMessage('🔵 initializeBluetooth called', 'blue');
  //   debugMessage(`🔵 Starting initialization for platform: ${Platform.OS}`, 'blue');
    
  //   if (Platform.OS === "android") {
  //     debugMessage('🔵 Android path', 'blue');
  //     try {
  //       // First check if Bluetooth is available
  //       debugMessage('🔵 [bluetooth.ts:103] Antes de llamar a BleManager.checkState', 'blue');
  //       let isAvailable;
  //       if (Platform.OS === 'android') {
  //         isAvailable = await BleManager.checkState({});
  //       } else {
  //         isAvailable = await BleManager.checkState();
  //       }
  //       debugMessage('🟣 [bluetooth.ts:103] Después de llamar a BleManager.checkState', 'purple');
  //       debugMessage(`🔵 Bluetooth state: ${isAvailable}`, 'blue');

  //       // Request permissions in the correct order
  //       const permissions = [
  //         PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  //         PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
  //         PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
  //       ];

  //       debugMessage(`🔵 Requesting permissions: ${permissions}`, 'blue');
  //       const results = await PermissionsAndroid.requestMultiple(permissions);
  //       debugMessage(`🔵 Permission results: ${JSON.stringify(results)}`, 'blue');
        
  //       // Check if all permissions were granted
  //       const allGranted = Object.values(results).every(
  //         result => result === PermissionsAndroid.RESULTS.GRANTED
  //       );

  //       if (!allGranted) {
  //         debugMessage(`🔴 Some permissions were not granted: ${JSON.stringify(results)}`, 'red');
  //         return onFail();
  //       }

  //       // Initialize BleManager
  //       if (!bluetoothInitialized) {
  //         debugMessage('🔵 Initializing BleManager...', 'blue');
  //         bluetoothInitialized = true;
  //         try {
  //           await BleManager.start({ showAlert: false });
  //           debugMessage('🟢 BleManager started successfully', 'green');
            
  //           // Enable Bluetooth if not already enabled
  //                   debugMessage('🔵 [bluetooth.ts:136] Antes de llamar a BleManager.checkState', 'blue');
  //       let state;
  //       if (Platform.OS === 'android') {
  //         state = await BleManager.checkState({});
  //       } else {
  //         state = await BleManager.checkState();
  //       }
  //       debugMessage('🔵 [bluetooth.ts:136] Después de llamar a BleManager.checkState', 'blue');
  //           debugMessage(`🔵 Current Bluetooth state: ${state}`, 'blue');
            
  //           if (!isBluetoothOn(state as string)) {
  //             debugMessage('🔵 Enabling Bluetooth...', 'blue');
  //             await BleManager.enableBluetooth();
  //             debugMessage('🟢 Bluetooth enabled', 'green');
  //           }
            
  //           debugMessage('🟢 Initialization complete', 'green');
  //           onSuccess();
  //         } catch (error) {
  //           debugMessage(`🔴 Failed to initialize Bluetooth: ${error}`, 'red');
  //           onFail();
  //         }
  //       } else {
  //         debugMessage('🔵 BleManager already initialized', 'blue');
  //         onSuccess();
  //       }
  //     } catch (e) {
  //       debugMessage(`🔴 Permissions error: ${e}`, 'red');
  //       return onFail();
  //     }
  //   } else {
  //     // iOS implementation
  //     debugMessage('🔵 iOS path', 'blue');
  //     if (!bluetoothInitialized) {
  //       bluetoothInitialized = true;
  //       try {
  //         await BleManager.start({ showAlert: false });
  //         debugMessage('🟢 iOS: BleManager started successfully', 'green');
  //         onSuccess();
  //       } catch (error) {
  //         debugMessage(`🔴 iOS: Failed to start BleManager: ${error}`, 'red');
  //         onFail();
  //       }
  //     } else {
  //       debugMessage('🔵 iOS: BleManager already initialized', 'blue');
  //       onSuccess();
  //     }
  //   }
  // },
  initializeBluetooth: async (
    onSuccess: () => void,
    onFail: () => void
  ) => {
    if (Platform.OS === "android") {
      try {
        const grantedFineLocation = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: i18n.t("locationPermission.title", { scope }),
            message: i18n.t("locationPermission.message", { scope }),
            buttonNegative: i18n.t("locationPermission.deny", { scope }),
            buttonPositive: i18n.t("locationPermission.allow", { scope }),
          }
        );
        console.log("grantedFineLocation", grantedFineLocation);
  
        if (grantedFineLocation !== PermissionsAndroid.RESULTS.GRANTED)
          throw new Error("Location permission not granted");
  
        const grantedBluetoothScan = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          {
            title: i18n.t("bluetoothPermission.title", { scope }),
            message: i18n.t("bluetoothPermission.message", { scope }),
            buttonNegative: i18n.t("bluetoothPermission.deny", { scope }),
            buttonPositive: i18n.t("bluetoothPermission.allow", { scope }),
          }
        );
        console.log("grantedBluetoothScan", grantedBluetoothScan);
  
        if (grantedBluetoothScan !== PermissionsAndroid.RESULTS.GRANTED)
          throw new Error("Bluetooth scan permission not granted");
  
        const grantedBluetoothConnect = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          {
            title: i18n.t("bluetoothPermission.title", { scope }),
            message: i18n.t("bluetoothPermission.message", { scope }),
            buttonNegative: i18n.t("bluetoothPermission.deny", { scope }),
            buttonPositive: i18n.t("bluetoothPermission.allow", { scope }),
          }
        );
        console.log("grantedBluetoothConnect", grantedBluetoothConnect);
  
        if (grantedBluetoothConnect !== PermissionsAndroid.RESULTS.GRANTED)
          throw new Error("Bluetooth connect permission not granted");
      } catch (e) {
        console.log("Permissions error", e);
        return onFail();
      }
    } else {
      console.log("iOS does not require Bluetooth permissions");
    }
  
    if (!bluetoothInitialized) {
      bluetoothInitialized = true;
      enableBluetooth(
        () => {
          console.log("Enable bluetooth success");
          BleManager.start({ showAlert: false })
            .then(onSuccess)
            .catch(onFail);
        },
        () => {
          console.log("Enable bluetooth failed");
          onFail();
        }
      );
    }
  },

  scanWifiNetworks: (peripheralId: string) => {
    debugMessage(`[bluetooth.ts] scanWifiNetworks called with peripheralId: ${peripheralId}`, 'blue');
    debugMessage(`[scanWifiNetworks] Starting for platform: ${Platform.OS}`, 'blue');
    debugMessage(`[scanWifiNetworks] Peripheral ID: ${peripheralId}`, 'blue');
    
    if (Platform.OS === "android") {
      debugMessage("[scanWifiNetworks] Android path - using retrieveServices", 'blue');
      BleManager.retrieveServices(peripheralId)
        .then(() => {
          debugMessage("[scanWifiNetworks] Android: Retrieve services for wifi scan successful", 'green');
          BleManager.write(
            peripheralId,
            WIFI_SERVICE_UUID,
            WIFI_SCAN_CHARACTERISTIC_UUID,
            []
                      )
              .then(() => {
                debugMessage("[scanWifiNetworks] Android: Wifi scan started", 'green');
                // Android: request MTU before starting notifications
                BleManager.requestMTU(peripheralId, 515).then(() => {
                  debugMessage("[scanWifiNetworks] Android: MTU request successful, starting notifications", 'green');
                  BleManager.startNotification(
                    peripheralId,
                    WIFI_SERVICE_UUID,
                    WIFI_SCAN_RESULTS_CHARACTERISTIC_UUID
                  )
                    .then(() => {
                      debugMessage("[scanWifiNetworks] Android: Wifi scan result notifications started", 'green');
                    })
                    .catch(error => {
                      debugMessage("[scanWifiNetworks] Android: Wifi scan result notifications failed", 'red');
                      debugMessage(`Error: ${error}`, 'red');
                    });
                });
              })
              .catch(error => {
                debugMessage("[scanWifiNetworks] Android: Wifi scan failed", 'red');
                debugMessage(`Error: ${error}`, 'red');
              });
          })
          .catch(e => {
            debugMessage("[scanWifiNetworks] Android: Retrieve services for wifi scan failed", 'red');
            debugMessage(`Error: ${e}`, 'red');
          });
    } else {
      // iOS implementation - no need for requestMTU
      debugMessage("[scanWifiNetworks] iOS path - using connect + retrieveServices", 'blue');
      BleManager.connect(peripheralId)
        .then(() => {
          debugMessage("[scanWifiNetworks] iOS: Connect successful", 'green');
          return BleManager.retrieveServices(peripheralId);
        })
        .then(() => {
          debugMessage("[scanWifiNetworks] iOS: Retrieve services for wifi scan successful", 'green');
          debugMessage("[scanWifiNetworks] iOS: Writing to scan characteristic", 'blue');
          BleManager.write(
            peripheralId,
            WIFI_SERVICE_UUID,
            WIFI_SCAN_CHARACTERISTIC_UUID,
            []
                      )
              .then(() => {
                debugMessage("[scanWifiNetworks] iOS: Wifi scan started", 'green');
                // iOS: start notifications directly (no MTU request needed)
                debugMessage("[scanWifiNetworks] iOS: Starting notifications", 'blue');
                BleManager.startNotification(
                  peripheralId,
                  WIFI_SERVICE_UUID,
                  WIFI_SCAN_RESULTS_CHARACTERISTIC_UUID
                )
                  .then(() => {
                    debugMessage("[scanWifiNetworks] iOS: Wifi scan result notifications started", 'green');
                  })
                  .catch(error => {
                    debugMessage("[scanWifiNetworks] iOS: Wifi scan result notifications failed", 'red');
                    debugMessage(`Error: ${error}`, 'red');
                  });
              })
              .catch(error => {
                debugMessage("[scanWifiNetworks] iOS: Wifi scan failed", 'red');
                debugMessage(`Error: ${error}`, 'red');
              });
          })
          .catch(e => {
            debugMessage("[scanWifiNetworks] iOS: Retrieve services for wifi scan failed", 'red');
            debugMessage(`Error: ${e}`, 'red');
          });
    }
  },

  scanForBleDevice: async (
    onDeviceFound: (device: Peripheral) => void,
    onNoDeviceFound: () => void,
    signal?: AbortSignal
  ) => {
    debugMessage('🔵 scanForBleDevice called. Starting BLE scan...', 'blue');
    androidDebugMessage('🔵 scanForBleDevice called. Starting BLE scan...');
    if (Platform.OS === "android") {
      try {
        // Request BLE permissions first
        const hasPermissions = await requestBlePermissions();
        if (!hasPermissions) {
          androidDebugMessage('🔴 BLE permissions not granted, triggering onNoDeviceFound');
          onNoDeviceFound();
          return;
        }

        debugMessage('🔵 [bluetooth.ts:277] Antes de llamar a BleManager.checkState', 'blue');
        androidDebugMessage('🔵 Antes de llamar a BleManager.checkState');
        let state;
        // Android needs empty object parameter, iOS doesn't
        if (Platform.OS === 'android') {
          state = await BleManager.checkState({});
        } else {
          state = await BleManager.checkState();
        }
        debugMessage('🔵 [bluetooth.ts:277] Después de llamar a BleManager.checkState', 'blue');
        androidDebugMessage('🔵 Después de llamar a BleManager.checkState');
        debugMessage(`🔵 BLE state before scan: ${state}`, 'blue');
        androidDebugMessage(`🔵 BLE state before scan: ${state}`);
        if (!isBluetoothOn(state as string)) {
          debugMessage('🔴 BLE is not powered on. Triggering onNoDeviceFound for WiFi fallback.', 'red');
          androidDebugMessage('🔴 BLE is not powered on. Triggering onNoDeviceFound for WiFi fallback.');
          onNoDeviceFound();
          return;
        }
        
        debugMessage(`🔵 Starting BLE scan with service UUID: ${THERMOSTAT_SERVICE_UUID}`, 'blue');
        androidDebugMessage(`🔵 Starting BLE scan with service UUID: ${THERMOSTAT_SERVICE_UUID}`);
        debugMessage(`🔵 Scan duration: ${SECONDS_TO_SCAN_FOR} seconds`, 'blue');
        androidDebugMessage(`🔵 Scan duration: ${SECONDS_TO_SCAN_FOR} seconds`);
        debugMessage('🔵 Allow duplicates: false', 'blue');
        androidDebugMessage('🔵 Allow duplicates: false');
        
        // Android: allowDuplicates parameter is not supported
        await BleManager.scan(THERMOSTAT_SERVICE_UUID, SECONDS_TO_SCAN_FOR);
        debugMessage('🔵 BLE scan started (Android)', 'blue');
        androidDebugMessage('🔵 BLE scan started (Android)');
        
        BleManagerEmitter.addListener(
          "BleManagerDiscoverPeripheral",
          async peripheral => {
            debugMessage('🟢 BLE device discovered!', 'green');
            debugMessage(`🔵 Device ID: ${peripheral.id}`, 'blue');
            debugMessage(`🔵 Device name: ${peripheral.name || 'Unknown'}`, 'blue');
            debugMessage(`🔵 Device RSSI: ${peripheral.rssi}`, 'blue');
            if (peripheral.advertising) {
              debugMessage(`🔵 Device advertising: ${JSON.stringify(peripheral.advertising)}`, 'blue');
            }
            onDeviceFound(peripheral);
            bluetooth.stopScanWithReason("Peripheral found");
          }
        );
        
        BleManagerEmitter.addListener("BleManagerStopScan", async args => {
          debugMessage(`🔵 BLE scan stopped: ${JSON.stringify(args)}`, 'blue');
          debugMessage(`🔵 Stop scan status: ${args.status}`, 'blue');
          if (args.status === 10) {
            debugMessage('🟡 BLE scan timed out. Triggering onNoDeviceFound for WiFi fallback.', 'yellow');
            onNoDeviceFound();
          } else {
            debugMessage('🔵 BLE scan stopped for reason other than timeout', 'blue');
          }
        });
      } catch (error) {
        debugMessage(`🔴 Error during BLE scan: ${error}`, 'red');
        debugMessage(`🔴 Error details: ${JSON.stringify(error)}`, 'red');
        onNoDeviceFound();
      }
    } else {
      // iOS implementation
      debugMessage('🔵 BLE scan started (iOS)', 'blue');
      await BleManager.scan(THERMOSTAT_SERVICE_UUID, SECONDS_TO_SCAN_FOR, false);
      BleManagerEmitter.addListener(
        "BleManagerDiscoverPeripheral",
        async peripheral => {
          debugMessage(`🟢 BLE device discovered (iOS): ${JSON.stringify(peripheral)}`, 'green');
          onDeviceFound(peripheral);
          bluetooth.stopScanWithReason("Peripheral found");
        }
      );
      BleManagerEmitter.addListener("BleManagerStopScan", async args => {
        debugMessage(`🔵 BLE scan stopped (iOS): ${JSON.stringify(args)}`, 'blue');
        if (args.status === 10) {
          debugMessage('🟡 BLE scan timed out. Triggering onNoDeviceFound for WiFi fallback.', 'yellow');
          onNoDeviceFound();
        } else {
          debugMessage('🔵 BLE scan stopped for another reason.', 'blue');
        }
      });
    }
  },

  sendSetupTokenCharacteristic: async (
    peripheralId: string,
    setupToken: string
  ) => {
    debugMessage(`[bluetooth.ts] sendSetupTokenCharacteristic called with peripheralId: ${peripheralId}, setupToken: ${setupToken}`, 'blue');
    var byteArray: number[] = [];

    for (var i = 0; i < setupToken.length; i++) {
      byteArray = byteArray.concat(setupToken.charCodeAt(i));
    }

    BleManager.write(
      peripheralId,
      AYLA_CONNECTIVITY_GATT_SERVICE_UUID,
      SETUP_TOKEN_CHARACTERISTIC_UUID,
      byteArray
    )
      .then(() => {
        debugMessage("Write token successful", 'green');
      })
      .catch(err => {
        debugMessage("Write token failed", 'red');
        debugMessage(`Error: ${err}`, 'red');
      });
  },

  sendWifiConnectCharacteristic: (
    peripheral: Peripheral,
    network: Network,
    password: string,
    onSuccess: () => void,
    onFail: () => void
  ) => {
    debugMessage(`[bluetooth.ts] sendWifiConnectCharacteristic called with peripheral: ${peripheral.id}, network: ${network.ssid}, password: ${password ? '***' : 'empty'}`, 'blue');
    if (Platform.OS === "android") {
      BleManager.retrieveServices(peripheral.id)
        .then(() => {
          debugMessage("Retrieved services", 'green');

          // Android: request MTU first
          BleManager.requestMTU(peripheral.id, 515)
            .then(size => {
              debugMessage(`MTU request success, size: ${size}`, 'green');

              let bssid = [0, 0, 0, 0, 0, 0];
              let buf1 = Buffer.from(network.ssid.padEnd(32, "\0"));
              let buf2 = Buffer.from([network.ssidLength]);
              let buf3 = Buffer.from(bssid);
              let buf4 = Buffer.from(password.padEnd(64, "\0"));
              let buf5 = Buffer.from([password.length]);
              let buf6 = Buffer.from([0x03]);
              let buffers = [buf1, buf2, buf3, buf4, buf5, buf6];
              let data = Buffer.concat(buffers).toJSON().data;
              debugMessage(
                `${network.ssid} ${network.ssidLength} ${password.length} ${data.length}`, 'blue'
              );

              // Android: use writeWithoutResponse
              BleManager.writeWithoutResponse(
                peripheral.id,
                WIFI_SERVICE_UUID,
                WIFI_CONNECT_CHARACTERISTIC_UUID,
                data,
                105
              )
                .then(() => {
                  debugMessage(`Sent ${data}`, 'green');
                  onSuccess();
                })
                .catch(error => {
                  debugMessage(`Data: ${data}\nError: ${error}`, 'red');
                  BleManager.read(
                    peripheral.id,
                    WIFI_SERVICE_UUID,
                    BLE_STATUS_CHARACTERISTIC_UUID
                  ).then(value => {
                    debugMessage(`BLE status: ${value}`, 'blue');
                  });
                  onFail();
                });
            })
            .catch(e => {
              debugMessage(`ERROR: ${e}`, 'red');
              onFail();
            });
        })
        .catch(error => {
          debugMessage(`Failed to get services: ${error}`, 'red');
          onFail();
        });
    } else {
      // iOS implementation - use regular write instead of writeWithoutResponse
      BleManager.connect(peripheral.id)
        .then(() => BleManager.retrieveServices(peripheral.id))
        .then(() => {
          let bssid = [0, 0, 0, 0, 0, 0];
          let buf1 = Buffer.from(network.ssid.padEnd(32, "\0"));
          let buf2 = Buffer.from([network.ssidLength]);
          let buf3 = Buffer.from(bssid);
          let buf4 = Buffer.from(password.padEnd(64, "\0"));
          let buf5 = Buffer.from([password.length]);
          let buf6 = Buffer.from([0x03]);
          let buffers = [buf1, buf2, buf3, buf4, buf5, buf6];
          let data = Buffer.concat(buffers).toJSON().data;
          debugMessage(
            `${network.ssid} ${network.ssidLength} ${password.length} ${data.length}`, 'blue'
          );

          // iOS: use regular write (more reliable than writeWithoutResponse)
          BleManager.write(
            peripheral.id,
            WIFI_SERVICE_UUID,
            WIFI_CONNECT_CHARACTERISTIC_UUID,
            data,
            105
          )
            .then(() => {
              debugMessage(`Sent ${data}`, 'green');
              onSuccess();
            })
            .catch(error => {
              debugMessage(`Data: ${data}\nError: ${error}`, 'red');
              BleManager.read(
                peripheral.id,
                WIFI_SERVICE_UUID,
                BLE_STATUS_CHARACTERISTIC_UUID
              ).then(value => {
                debugMessage(`BLE status: ${value}`, 'blue');
              });
              onFail();
            });
        })
        .catch(e => {
          debugMessage(`ERROR: ${e}`, 'red');
          onFail();
        });
    }
  },

  connectToBluetoothDevice: async (
    device: Peripheral,
    onSuccess: () => void,
    onFail: () => void
  ) => {
    debugMessage('🔵 connectToBluetoothDevice called', 'blue');
    androidDebugMessage('🔵 connectToBluetoothDevice called');
    debugMessage(`🔵 Device ID: ${device.id}`, 'blue');
    androidDebugMessage(`🔵 Device ID: ${device.id}`);
    debugMessage(`🔵 Device name: ${device.name || 'Unknown'}`, 'blue');
    androidDebugMessage(`🔵 Device name: ${device.name || 'Unknown'}`);
    debugMessage(`🔵 Platform: ${Platform.OS}`, 'blue');
    androidDebugMessage(`🔵 Platform: ${Platform.OS}`);
    
    if (Platform.OS === "android") {
      debugMessage(`🔵 Android: Starting createBond for device: ${device.id}`, 'blue');
      androidDebugMessage(`🔵 Android: Starting createBond for device: ${device.id}`);
      BleManager.createBond(device.id).then(() => {
        debugMessage('🟢 BLE device paired successfully (Android)', 'green');
        androidDebugMessage('🟢 BLE device paired successfully (Android)');
        debugMessage('🔵 Setting connectedThroughBluetooth to true', 'blue');
        androidDebugMessage('🔵 Setting connectedThroughBluetooth to true');
        bluetooth.connectedThroughBluetooth = true;
        debugMessage('🔵 connectedThroughBluetooth set to true (Android)', 'blue');
        androidDebugMessage('🔵 connectedThroughBluetooth set to true (Android)');
        
        debugMessage(`🔵 Android: Starting BleManager.connect for device: ${device.id}`, 'blue');
        BleManager.connect(device.id)
          .then(() => {
            debugMessage('🟢 BLE connect success (Android)', 'green');
            androidDebugMessage('🟢 BLE connect success (Android)');
            debugMessage(`🔵 Final connectedThroughBluetooth state: ${bluetooth.connectedThroughBluetooth}`, 'blue');
            androidDebugMessage(`🔵 Final connectedThroughBluetooth state: ${bluetooth.connectedThroughBluetooth}`);
            onSuccess();
          })
          .catch((error) => {
            debugMessage('🔴 BLE connect failed (Android)', 'red');
            androidDebugMessage('🔴 BLE connect failed (Android)');
            debugMessage(`🔴 Connect error: ${error}`, 'red');
            androidDebugMessage(`🔴 Connect error: ${error}`);
            bluetooth.connectedThroughBluetooth = false;
            debugMessage('🔵 Reset connectedThroughBluetooth to false', 'blue');
            androidDebugMessage('🔵 Reset connectedThroughBluetooth to false');
            onFail();
          });
      }).catch((error) => {
        debugMessage('🔴 BLE createBond failed (Android)', 'red');
        debugMessage(`🔴 CreateBond error: ${error}`, 'red');
        onFail();
      });
    } else {
      // iOS: connect directly (no bonding needed)
      debugMessage(`🔵 iOS: Starting BleManager.connect for device: ${device.id}`, 'blue');
      BleManager.connect(device.id)
        .then(() => {
          bluetooth.connectedThroughBluetooth = true;
          debugMessage('🟢 BLE connect success (iOS). connectedThroughBluetooth set to true.', 'green');
          onSuccess();
        })
        .catch((error) => {
          bluetooth.connectedThroughBluetooth = false;
          debugMessage('🔴 BLE connect failed (iOS). connectedThroughBluetooth set to false.', 'red');
          debugMessage(`🔴 Connect error: ${error}`, 'red');
          onFail();
        });
    }
  },

  stopScanWithReason: (reason: string) => {
    debugMessage(`[bluetooth.ts] stopScanWithReason called with reason: ${reason}`, 'blue');
    BleManager.stopScan()
      .then(() => {
        debugMessage(`Scan stopped with reason: "${reason}"`, 'green');
      })
      .catch(err => {
        debugMessage(`Attempt to stop scan with reason: "${reason}" failed`, 'red');
        debugMessage(`Error: ${err}`, 'red');
      });
  },

  disconnectFromBluetoothDevice: async (peripheralId: string) => {
    debugMessage(`[bluetooth.ts] disconnectFromBluetoothDevice called with peripheralId: ${peripheralId}`, 'blue');
    try {
      await BleManager.disconnect(peripheralId);
      debugMessage('[bluetooth.ts] Bluetooth device disconnected successfully', 'green');
    } catch (error) {
      debugMessage(`[bluetooth.ts] Error disconnecting Bluetooth device: ${error}`, 'red');
    } finally {
      bluetooth.connectedThroughBluetooth = false;
      debugMessage('[bluetooth.ts] connectedThroughBluetooth reset to false', 'blue');
    }
  },

  listenToWifiScanNotifications: (
    navigation: SetupProps,
    bleManagerEmitter: NativeEventEmitter,
    onFullList: (networkList: Network[]) => void
  ) => {
    debugMessage('[bluetooth.ts] listenToWifiScanNotifications called', 'blue');
    debugMessage("[listenToWifiScanNotifications] Starting WiFi scan notifications", 'blue');
    debugMessage("[listenToWifiScanNotifications] Initial networks array: []", 'blue');
    var networks: Network[] = [];
    debugMessage(`[listenToWifiScanNotifications] Networks array created, length: ${networks.length}`, 'blue');
    
    const notificationListener = bleManagerEmitter.addListener(
      "BleManagerDidUpdateValueForCharacteristic",
      ({ value, peripheral, characteristic, service }) => {
        try {
          debugMessage("[listenToWifiScanNotifications] Received BLE notification", 'blue');
          debugMessage(`[listenToWifiScanNotifications] Value received: ${JSON.stringify(value)}`, 'blue');
          debugMessage(`[listenToWifiScanNotifications] Characteristic: ${characteristic}`, 'blue');
          debugMessage(`[listenToWifiScanNotifications] Service: ${service}`, 'blue');
          
          var byteArray = value as number[];
          debugMessage(`[listenToWifiScanNotifications] Byte array length: ${byteArray.length}`, 'blue');
          debugMessage(`[listenToWifiScanNotifications] Byte array: ${JSON.stringify(byteArray)}`, 'blue');
          
          var ssidBytes: number[] = [];
          var bssidBytes: number[] = [];

          for (let i = 1; i <= 32; i++) {
            ssidBytes = ssidBytes.concat(byteArray[i]);
          }
          debugMessage(`[listenToWifiScanNotifications] SSID bytes: ${JSON.stringify(ssidBytes)}`, 'blue');

          for (let i = 34; i <= 39; i++) {
            bssidBytes = bssidBytes.concat(byteArray[i]);
          }
          debugMessage(`[listenToWifiScanNotifications] BSSID bytes: ${JSON.stringify(bssidBytes)}`, 'blue');

          let rssi = bssidBytes[40] << (8 + bssidBytes[41]);
          let ssid = bytesToString(ssidBytes);
          let bssid = bytesToString(bssidBytes);
          let security = byteArray[42];
          
          debugMessage("[listenToWifiScanNotifications] Parsed values:", 'blue');
          debugMessage(`[listenToWifiScanNotifications] - SSID: ${ssid}`, 'blue');
          debugMessage(`[listenToWifiScanNotifications] - BSSID: ${bssid}`, 'blue');
          debugMessage(`[listenToWifiScanNotifications] - RSSI: ${rssi}`, 'blue');
          debugMessage(`[listenToWifiScanNotifications] - Security: ${security}`, 'blue');
          debugMessage(`[listenToWifiScanNotifications] - SSID Length: ${byteArray[33]}`, 'blue');
          debugMessage(`[listenToWifiScanNotifications] - Index: ${ssidBytes[0]}`, 'blue');

          let network: Network = {
            index: ssidBytes[0],
            ssid: ssid,
            ssidLength: byteArray[33],
            bssid: bssid,
            rssi: rssi,
            security: security,
          };
          
          debugMessage(`[listenToWifiScanNotifications] Created network object: ${JSON.stringify(network)}`, 'blue');

          if (
            network === null ||
            network.ssidLength === null ||
            network.ssidLength === 0
          ) {
            debugMessage("[listenToWifiScanNotifications] Network is null or empty, finishing scan", 'yellow');
            debugMessage(`[listenToWifiScanNotifications] Final networks array: ${JSON.stringify(networks)}`, 'blue');
            debugMessage(`[listenToWifiScanNotifications] Final networks count: ${networks.length}`, 'blue');
            doneScanningForWifi = true;
            notificationListener.remove();
            bleManagerEmitter.removeAllListeners(
              "BleManagerDidUpdateValueForCharacteristic"
            );
            debugMessage("[listenToWifiScanNotifications] WiFi scan complete, calling onFullList", 'green');
            onFullList(networks);
          } else {
            debugMessage("[listenToWifiScanNotifications] Network is valid, checking if already exists", 'blue');
            debugMessage(`[listenToWifiScanNotifications] Current networks: ${JSON.stringify(networks)}`, 'blue');
            debugMessage(`[listenToWifiScanNotifications] Network already exists: ${networks.includes(network)}`, 'blue');
            debugMessage(`[listenToWifiScanNotifications] Done scanning: ${doneScanningForWifi}`, 'blue');
            
            if (!networks.includes(network) && !doneScanningForWifi) {
              networks = networks.concat(network);
              debugMessage(`[listenToWifiScanNotifications] Network added: ${network.ssid}`, 'green');
              debugMessage(`[listenToWifiScanNotifications] Updated networks array: ${JSON.stringify(networks)}`, 'blue');
              debugMessage(`[listenToWifiScanNotifications] Updated networks count: ${networks.length}`, 'blue');
            } else {
              debugMessage("[listenToWifiScanNotifications] Network not added (already exists or scanning done)", 'yellow');
            }
          }
        } catch (error) {
          debugMessage(`[listenToWifiScanNotifications] Error in WiFi notification: ${error}`, 'red');
          debugMessage(`[listenToWifiScanNotifications] Error details: ${error}`, 'red');
        }
      }
    );
    
    debugMessage("[listenToWifiScanNotifications] Listener added successfully", 'green');
  }
};

debugMessage("[bluetooth.ts] bluetooth object created", 'blue');
debugMessage("[bluetooth.ts] initializeBluetooth function available", 'blue');
debugMessage("[bluetooth.ts] getDSN function available", 'blue');

// Export individual functions for backward compatibility
export const {
  getDSN,
  initializeBluetooth,
  scanWifiNetworks,
  scanForBleDevice,
  sendSetupTokenCharacteristic,
  sendWifiConnectCharacteristic,
  connectToBluetoothDevice,
  disconnectFromBluetoothDevice,
  stopScanWithReason,
  listenToWifiScanNotifications
} = bluetooth;

// Helper to fully reset BLE session between provisioning attempts
export const resetBleSession = (): void => {
  try {
    debugMessage('[bluetooth.ts] resetBleSession: removing BLE listeners and resetting flags', 'blue');
    try { BleManager.stopScan(); } catch (_) {}
    BleManagerEmitter.removeAllListeners('BleManagerDidUpdateValueForCharacteristic');
    BleManagerEmitter.removeAllListeners('BleManagerDiscoverPeripheral');
    BleManagerEmitter.removeAllListeners('BleManagerStopScan');
  } catch (e) {
    debugMessage(`[bluetooth.ts] resetBleSession: error removing listeners: ${e}`, 'red');
  }
  connectedThroughBluetooth = false;
  doneScanningForWifi = false;
  debugMessage('[bluetooth.ts] resetBleSession: connectedThroughBluetooth=false, doneScanningForWifi=false', 'blue');
};

debugMessage("[bluetooth.ts] Individual exports created", 'blue');
debugMessage("[bluetooth.ts] File export complete", 'green');

