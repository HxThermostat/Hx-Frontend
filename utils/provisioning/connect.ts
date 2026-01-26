// This file provides a platform-specific export for connect functionality
// The correct implementation will be used at runtime based on the platform

import * as Location from "expo-location";
import { Alert, PermissionsAndroid, Platform } from "react-native";
import WifiManager from "react-native-wifi-reborn";

import i18n from "~/i18n";

import { connected } from "./ap";
import { getConnectedThroughBluetooth } from "./bluetooth";
import { isRNWifiError, sleep, timeoutSignal } from "./utils";

const scope = "Utils.provisioning.connect";

// Unified connect interface
export const connect = async (
  ssid?: string,
  signal?: AbortSignal
): Promise<string | null> => {
  if (Platform.OS === "ios") {
    return connectIOS(ssid, signal);
  } else {
    return connectAndroid(ssid, signal);
  }
};

// Helper to ensure iOS location permission using expo-location
async function ensureLocationPermissionIOS() {
  if (Platform.OS !== 'ios') return true;
  const { status } = await Location.getForegroundPermissionsAsync();
  console.log('[connect.ts] [iOS] Location permission status:', status);
  if (status === 'granted') return true;
  const { status: requestStatus } = await Location.requestForegroundPermissionsAsync();
  console.log('[connect.ts] [iOS] Location permission request result:', requestStatus);
  return requestStatus === 'granted';
}

// iOS-specific implementation
const connectIOS = async (
  ssid?: string,
  signal?: AbortSignal
): Promise<string | null> => {
  if (ssid && !ssid.startsWith("RIPL-"))
    throw new Error("SSID must start with RIPL-");
  if (ssid === "RIPL-") throw new Error("SSID must not be a prefix");
  const ssidOrPrefix = ssid ?? "RIPL-";
  // Request location permission before attempting WiFi connection
  const granted = await ensureLocationPermissionIOS();
  if (!granted) {
    console.log('[connect.ts] [iOS] Location permission not granted. Aborting WiFi connection.');
    throw new Error('Location permission not granted');
  }
  try {
    if (ssidOrPrefix === "RIPL-") {
      console.log(`[connect.ts] [iOS] Attempting to connect to best match for prefix: ${ssidOrPrefix}`);
      await WifiManager.connectToSSIDPrefix(ssidOrPrefix);
    } else {
      console.log(`[connect.ts] [iOS] Attempting to connect to exact SSID: ${ssidOrPrefix}`);
      await WifiManager.connectToSSID(ssidOrPrefix);
    }
    console.log("[connect.ts] [iOS] WiFi connection attempt successful (system dialog may still be open).");
  } catch (e) {
    console.log('[connect.ts] [iOS] WiFi connection error caught:', e);
    console.log('[connect.ts] [iOS] getConnectedThroughBluetooth():', getConnectedThroughBluetooth());
    if (await connected(getConnectedThroughBluetooth(), undefined)) {
      console.log('[connect.ts] [iOS] Already connected via BLE, skipping WiFi retry.');
      return null;
    }
    if (isRNWifiError(e)) {
      switch (e.code) {
        case "couldNotDetectSSID":
        case "unableToConnect":
        case "invalid":
          if (signal) {
            console.log(`[connect.ts] [iOS] WiFi error ${e.code}, retrying in 1s (with timeout/retry logic)...`);
            await sleep(1000, signal);
            if (!signal.aborted) {
              return connectIOS(ssid, timeoutSignal(30000, signal));
            }
          }
      }
    }
    console.log('[connect.ts] [iOS] WiFi connection error not recoverable or retries exhausted.');
    throw e;
  }
  return null;
};

// Android-specific implementation
const connectAndroid = async (
  ssid?: string,
  signal?: AbortSignal
): Promise<string | null> => {
  if (ssid && !ssid.startsWith("RIPL-"))
    throw new Error("SSID must start with RIPL-");
  console.log('[connect.ts] [Android] Requesting location permission for WiFi scan/connect...');
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: i18n.t("locationPermission.title", { scope }),
      message: i18n.t("locationPermission.message", { scope }),
      buttonNegative: i18n.t("locationPermission.deny", { scope }),
      buttonPositive: i18n.t("locationPermission.allow", { scope }),
    }
  );
  if (granted !== PermissionsAndroid.RESULTS.GRANTED)
    throw new Error("Location permission not granted");
  let currentSsid: string | null = null;
  let riplSsid = ssid;
  try {
    if (riplSsid == null) {
      console.log('[connect.ts] [Android] Loading WiFi list to find RIPL- network...');
      let networks = await WifiManager.loadWifiList();
      if (!networks.map(n => n.SSID).find(ssid => ssid.startsWith("RIPL-"))) {
        console.log('[connect.ts] [Android] RIPL- network not found, rescanning...');
        networks = await WifiManager.reScanAndLoadWifiList();
      }
      riplSsid = networks
        .sort((a, b) => b.level - a.level)
        .find(network => network.SSID.startsWith("RIPL-"))?.SSID;
      if (riplSsid == null) throw new Error("Could not find a RIPL network");
      console.log(`[connect.ts] [Android] Found RIPL- network: ${riplSsid}`);
    }
    const onWifi = await WifiManager.connectionStatus();
    if (onWifi) {
      currentSsid = await WifiManager.getCurrentWifiSSID();
      if (currentSsid === riplSsid) {
        console.log('[connect.ts] [Android] Already connected to RIPL- network.');
        return null;
      }
    }
    console.log(`[connect.ts] [Android] Attempting to connect to WiFi SSID: ${riplSsid}`);
    await WifiManager.connectToProtectedSSID(riplSsid, "", false, false);
    console.log('[connect.ts] [Android] WiFi connection attempt successful (system dialog may still be open).');
  } catch (e) {
    console.log('[connect.ts] [Android] WiFi connection error caught:', e);
    console.log('[connect.ts] [Android] getConnectedThroughBluetooth():', getConnectedThroughBluetooth());
    if (await connected(getConnectedThroughBluetooth(), undefined)) {
      console.log('[connect.ts] [Android] Already connected via BLE, skipping WiFi retry.');
      return null;
    }
    if (isRNWifiError(e)) {
      console.debug(e.code);
      switch (e.code) {
        case "locationServicesOff":
          console.log('[connect.ts] [Android] Location services are off. Prompting user.');
          Alert.alert(
            i18n.t("locationServicesOffAlert.title", { scope }),
            i18n.t("locationServicesOffAlert.message", { scope }),
            [
              {
                text: i18n.t("locationServicesOffAlert.openSettings", {
                  scope,
                }),
                style: "default",
                onPress: () => {
                  console.warn("[connect.ts] [Android] User should manually enable location services.");
                },
              },
            ]
          );
          break;
        case "couldNotEnableWifi":
          console.log('[connect.ts] [Android] Could not enable WiFi. Prompting user.');
          Alert.alert(
            i18n.t("couldNotEnableWifiAlert.title", { scope }),
            i18n.t("couldNotEnableWifiAlert.message", { scope }),
            [
              {
                text: i18n.t("couldNotEnableWifiAlert.openSettings", {
                  scope,
                }),
                style: "default",
                onPress: () => {
                  console.warn("[connect.ts] [Android] User should manually enable WiFi.");
                },
              },
            ]
          );
          break;
        case "couldNotScan":
          if (signal) {
            console.log('[connect.ts] [Android] WiFi scan failed, retrying in 1s...');
            await sleep(1000, signal);
            if (!signal.aborted) {
              return connectAndroid(riplSsid, signal);
            }
          }
          console.log('[connect.ts] [Android] WiFi scan failed and no more retries. Alerting user.');
          Alert.alert(
            i18n.t("couldNotScanAlert.title", { scope }),
            i18n.t("couldNotScanAlert.message", { scope })
          );
          break;
        case "didNotFindNetwork":
        case "unableToConnect":
        case "timeoutOccurred":
          if (signal) {
            console.log(`[connect.ts] [Android] WiFi error ${e.code}, retrying in 1s (with timeout/retry logic)...`);
            await sleep(1000, signal);
            if (!signal.aborted) {
              return connectAndroid(riplSsid, timeoutSignal(30000, signal));
            }
          }
      }
    }
    console.log('[connect.ts] [Android] WiFi connection error not recoverable or retries exhausted.');
    throw e;
  }
  console.log('[connect.ts] [Android] WiFi connection established. Enforcing WiFi usage.');
  await WifiManager.forceWifiUsageWithOptions(true, { noInternet: true });
  return currentSsid;
};

// Unified disconnect interface
export const disconnect = async (ssid: string): Promise<void> => {
  if (Platform.OS === "ios") {
    return disconnectIOS(ssid);
  } else {
    return disconnectAndroid(ssid);
  }
};

// iOS-specific disconnect implementation
const disconnectIOS = async (ssid: string): Promise<void> => {
  console.debug(`Disconnecting from ${ssid}...`);
  await WifiManager.disconnectFromSSID(ssid);
  console.debug("Disconnected");
};

// Android-specific disconnect implementation
const disconnectAndroid = async (ssid: string): Promise<void> => {
  console.debug(`Disconnecting from ${ssid}...`);

  await WifiManager.forceWifiUsageWithOptions(false, { noInternet: false });
  console.debug("Unenforcing WiFi usage");

  await WifiManager.isRemoveWifiNetwork(ssid);

  console.debug("Disconnected");
};

