import { ApolloClient } from "@apollo/client";

import {
    RegisterLocationDocument,
    RegisterLocationMutation,
    RegisterLocationMutationVariables,
} from "~/graph";

// import { addBreadcrumbException } from "~/utils/sentry";

import { bytesToString } from "convert-string";
import { Peripheral } from "react-native-ble-manager";
import {
    dsn,
    Network,
    regtoken,
    scanResults,
    setTime,
    startScan,
    status,
    Status,
    wifiConnect,
    wifiStopAp,
} from "./ap";
import { bluetooth } from "./bluetooth";
import { connect, disconnect } from "./connect";
import { provisionLogger } from "./logger";
import { sleep, timeoutSignal } from "./utils";

export default class Provision {
  public connected: boolean;
  public connecting: boolean;

  protected apolloClient: ApolloClient<object>;
  protected deviceSsid: string | null;
  protected dsn: string | null;
  protected setupToken: string;
  protected scannedNetworks: Map<string, Network> = new Map();

  constructor(apolloClient: ApolloClient<object>) {
    this.apolloClient = apolloClient;
    this.connected = false;
    this.connecting = false;
    this.deviceSsid = null;
    this.dsn = null;
    this.setupToken = Math.random()
      .toString(16)
      .substr(2, 8);
    console.log("Noah" + this.setupToken);
  }

  public async connectToDevice(
    ssid?: string,
    signal?: AbortSignal,
  ): Promise<void> {
    this.connected = false;
    this.connecting = true;

    try {
      // Sanity check to see if we're already on the device's network
      console.debug("Making sure we're not on the RIPL network");
      if ((await dsn(false)) != null) {
        console.debug("We're on the RIPL network!");
        this.connecting = false;
        this.connected = true;
        return;
      }
    } catch {
      // We _really_ don't care about the error here since we generally expect it to fail
    }
    console.debug("We're not on the RIPL network");
    try {
     await connect(ssid, signal);
    } finally {
      this.connecting = false;
    }

    this.connected = true;
  }

  public async waitForConnection(timeout = 10000): Promise<boolean | null> {
    const signal = timeoutSignal(timeout);

    while (!signal.aborted) {
      if (!this.connecting) {
        return this.connected;
      }
      await sleep(100);
    }

    return null;
  }

  public async waitForDevice(
    ssid?: string,
    timeout = 5000,
    manualAbort = new AbortController().signal,
    peripheral?: Peripheral,
    onDebug?: (msg: string) => void
  ): Promise<void> {
    const signal = timeoutSignal(timeout);
    let lastError: Error | null = null;

    let res: Status | null = null;

    // Check if BLE is actually available and connected
    const bleActuallyConnected = bluetooth.connectedThroughBluetooth && peripheral != undefined;
    onDebug?.(`[waitForDevice] BLE actually connected: ${bleActuallyConnected} (BLE state: ${bluetooth.connectedThroughBluetooth}, peripheral: ${peripheral ? peripheral.id : 'undefined'})`);

    while (!(signal.aborted || manualAbort.aborted)) {
      try {
        onDebug?.(`[waitForDevice] Calling status (BLE: ${bleActuallyConnected}, peripheral: ${peripheral ? peripheral.id : 'undefined'})`);
        res = await status(bleActuallyConnected, peripheral, onDebug);
        onDebug?.(`[waitForDevice] status() response: ${JSON.stringify(res)}`);
        break;
      } catch (e) {
        lastError = e as Error;
        onDebug?.(`[waitForDevice] Error in status(): ${e && e.toString ? e.toString() : e}`);
        if (typeof e === 'object' && e !== null && 'stack' in e) onDebug?.(`[waitForDevice] Stack: ${(e as any).stack}`);
        
        // If BLE failed and we have a peripheral, try to reset BLE state and fall back to WiFi
        if (bleActuallyConnected && peripheral) {
          onDebug?.('[waitForDevice] BLE failed, resetting BLE state and falling back to WiFi');
          bluetooth.connectedThroughBluetooth = false;
          // Try again with WiFi only
          try {
            onDebug?.('[waitForDevice] Retrying with WiFi only...');
            res = await status(false, undefined, onDebug);
            onDebug?.(`[waitForDevice] WiFi status() response: ${JSON.stringify(res)}`);
            break;
          } catch (wifiError) {
            onDebug?.(`[waitForDevice] WiFi status() also failed: ${wifiError}`);
            lastError = wifiError as Error;
          }
        }
      }
    }

    if (manualAbort.aborted) {
      onDebug?.('[waitForDevice] Manually aborted');
      return;
    }

    if (!this.connected) {
      onDebug?.("[waitForDevice] this.connected is false, throwing 'Not connected to device'");
      throw new Error("Not connected to device");
    }
    if (!res) {
      onDebug?.(`[waitForDevice] res is null, throwing lastError: ${lastError}`);
      throw lastError;
    }

    // LOG: Mostrar el objeto res y el dsn
    onDebug?.(`[waitForDevice] status() final result: ${JSON.stringify(res)}`);
    onDebug?.(`[waitForDevice] res.dsn: ${res.dsn}`);
    if (!res.dsn) {
      onDebug?.(`[waitForDevice] res.dsn is missing or empty! res: ${JSON.stringify(res)}`);
    }

    this.dsn = res.dsn;

    if (ssid && ssid.startsWith("RIPL-")) {
      this.deviceSsid = ssid;
    } else {
      this.deviceSsid = `RIPL-${res.mac.replace(/:/g, "")}`;
    }

    try {
      onDebug?.('[waitForDevice] Setting time on device...');
      await setTime();
      onDebug?.('[waitForDevice] Time set successfully');
    } catch (e) {
      onDebug?.(`[waitForDevice] Error setting time: ${e}`);
    }

    onDebug?.(`[waitForDevice] DSN: ${this.dsn}`);
    onDebug?.(`[waitForDevice] Device SSID: ${this.deviceSsid}`);

    onDebug?.('[waitForDevice] Starting scan...');
    await startScan();
    onDebug?.('[waitForDevice] Scan started');
  }

  public async isConnected(peripheral?: Peripheral): Promise<boolean> {
    try {
      await status(bluetooth.connectedThroughBluetooth, peripheral);
      return true;
    } catch {
      return false;
    }
  }

  public async networks(
    timeout = 10000,
    manualAbort: AbortSignal
  ): Promise<Network[]> {
    const signal = timeoutSignal(timeout);

    let lastSize = 0;
    while (lastSize === 0 || lastSize != this.scannedNetworks.size) {
      lastSize = this.scannedNetworks.size;

      try {
        console.debug("Scanning for networks...");
        const result = await scanResults();

        result.wifi_scan.results.map(r => this.scannedNetworks.set(r.ssid, r));
      } catch {
        //
      }

      if (this.scannedNetworks.size > 10) break;
      if (signal.aborted || manualAbort.aborted) break;

      await sleep(200);
    }

    return Array.from(this.scannedNetworks.values()).sort(
      (a, b) => b.bars - a.bars
    );
  }

  public async connectDeviceToNetwork(
    ssid: string,
    password: string,
    timeout = 30000
  ): Promise<boolean> {
    try {
      const signal = timeoutSignal(timeout);

      await wifiConnect(ssid, password, this.setupToken);

      while (!signal.aborted) {
        try {
          console.debug("Checking registration status...");
          const token = await regtoken();
          if (token != null) {
            return true;
          }
        } catch (e) {
          // addBreadcrumbException(e as Error);
        }

        await sleep(500);
      }

      return false;
    } catch (e) {
      // addBreadcrumbException(e as Error);
      return false;
    }
  }

  public async disconnectFromDevice(
    peripheral?: Peripheral, // TODO - Nullable might be undefined
    stopAp = true,
    timeout = 30000
  ): Promise<void> {
    if (!this.deviceSsid) return;

    if (stopAp) {
      console.debug("Asking device to stop broadcasting AP...");
      try {
        if (peripheral != undefined) {
          await status(bluetooth.connectedThroughBluetooth, peripheral);
        }
      } catch {
        //
      }

      try {
        await wifiStopAp();
      } catch (e) {
        // addBreadcrumbException(e as Error);
      }
    }

    try {
      if (this.deviceSsid) {
        await disconnect(this.deviceSsid);
      }
    } catch (e) {
      // addBreadcrumbException(e as Error);
    }

    this.connected = false;
    this.deviceSsid = null;
    this.dsn = null;
  }

  public async register(
    peripheral?: Peripheral,
    timeout = 30000,
    onDebug?: (msg: string) => void
  ): Promise<string | undefined | boolean> {
    onDebug?.("=== STARTING REGISTER ===");
    onDebug?.(`bluetooth.connectedThroughBluetooth: ${bluetooth.connectedThroughBluetooth}`);
    onDebug?.(`peripheral: ${peripheral ? peripheral.id : 'undefined'}`);
    onDebug?.(`this.dsn: ${this.dsn}`);
    onDebug?.(`this.setupToken: ${this.setupToken}`);
    
    var returnValue: string | undefined | boolean;

    // Check if BLE is actually available and connected
    const bleActuallyConnected = bluetooth.connectedThroughBluetooth && peripheral != undefined;
    onDebug?.(`[register] BLE actually connected: ${bleActuallyConnected} (BLE state: ${bluetooth.connectedThroughBluetooth}, peripheral: ${peripheral ? peripheral.id : 'undefined'})`);

    if (bleActuallyConnected) {
      onDebug?.("=== USING BLE PATH ===");
      onDebug?.("Right before getDSN");
      try {
        const maybeDSN = await bluetooth.getDSN(peripheral.id);
        onDebug?.("DSN received: " + JSON.stringify(maybeDSN));
        const dsnString = bytesToString(maybeDSN);
        this.dsn = dsnString;
        returnValue = dsnString;
      } catch (e) {
        onDebug?.("DSN error: " + e);
        onDebug?.("[register] BLE getDSN failed, falling back to WiFi-only path");
        bluetooth.connectedThroughBluetooth = false;
        // Fall through to WiFi-only path
      }

      if (returnValue === false) {
        onDebug?.("returnValue is false after getDSN");
        return returnValue;
      }

      // If we successfully got DSN via BLE, try BLE registration
      if (returnValue && typeof returnValue === 'string') {
        try {
          const signal = timeoutSignal(timeout);

          if (bluetooth.connectedThroughBluetooth) {
            onDebug?.("Sending setup token characteristic");
            await bluetooth.sendSetupTokenCharacteristic(peripheral.id, this.setupToken);
          }

          while (!signal.aborted) {
            try {
              onDebug?.("Attempting to register device...");
              onDebug?.(JSON.stringify({ dsn: this.dsn, setupToken: this.setupToken }));
              onDebug?.("[register] About to call mutation with dsn: " + this.dsn + ", setupToken: " + this.setupToken);
              const { data } = await this.apolloClient.mutate<
                RegisterLocationMutation,
                RegisterLocationMutationVariables
              >({
                mutation: RegisterLocationDocument,
                variables: {
                  input: {
                    dsn: this.dsn as string,
                    setupToken: this.setupToken,
                  },
                },
              });

              onDebug?.("RegisterLocation response: " + JSON.stringify(data));

              if (
                data?.registerLocation.__typename === "RegisterLocationSuccess"
              ) {
                returnValue = data.registerLocation.location.id;
                onDebug?.("Registration success, locationId: " + returnValue);
                return returnValue;
              } else if (data?.registerLocation.__typename === "NotFound") {
                onDebug?.("NotFound: " + JSON.stringify(data));
              }
            } catch (e) {
              onDebug?.("Error in BLE registration: " + e);
            }

            await sleep(500);
          }
        } catch (e) {
          onDebug?.("Exception in BLE registration: " + e);
          onDebug?.("[register] BLE registration failed, falling back to WiFi-only path");
          bluetooth.connectedThroughBluetooth = false;
          // Fall through to WiFi-only path
        }
      }
    }

    // WiFi-only path (either BLE failed or wasn't available)
    onDebug?.("=== USING WIFI-ONLY PATH ===");
    onDebug?.("[Provision] --- REGISTRO SIN BLE (solo WiFi) ---");
    onDebug?.("[Provision] this.dsn: " + this.dsn);
    onDebug?.("[Provision] this.setupToken: " + this.setupToken);
    
    // Configurar el logger para enviar mensajes a la UI
    if (onDebug) {
      provisionLogger.setUICallback(onDebug);
    }
    
    provisionLogger.info("WiFi-only registration started", {
      dsn: this.dsn,
      setupToken: this.setupToken,
      hasPeripheral: !!peripheral,
    });
    
    if (!this.dsn) {
      onDebug?.("No DSN, returning false");
      provisionLogger.error("No DSN available for registration", { dsn: this.dsn });
      return false;
    }

    const signal = timeoutSignal(timeout);

    // Add delay before registration to allow device to come online
    onDebug?.('[Provision] Waiting 5 seconds before registration to allow device to come online...');
    provisionLogger.info("Waiting 5s for device to come online");
    await sleep(5000);
    
    onDebug?.(`[Provision] setupToken before mutation: ${this.setupToken}`);
    provisionLogger.info("Starting registration loop", {
      dsn: this.dsn,
      setupToken: this.setupToken,
      timeoutMs: timeout,
    });
    
    while (!signal.aborted) {
      try {
        onDebug?.("[Provision] Attempting to register device (WiFi only)...");
        onDebug?.(JSON.stringify({ dsn: this.dsn, setupToken: this.setupToken }));
        onDebug?.("[register] About to call mutation with dsn: " + this.dsn + ", setupToken: " + this.setupToken);
        
        provisionLogger.info("Sending RegisterLocation mutation", {
          dsn: this.dsn,
          setupToken: this.setupToken,
        });
        
        const { data } = await this.apolloClient.mutate<
          RegisterLocationMutation,
          RegisterLocationMutationVariables
        >({
          mutation: RegisterLocationDocument,
          variables: {
            input: {
              dsn: this.dsn as string,
              setupToken: this.setupToken,
            },
          },
        });

        onDebug?.("[Provision] RegisterLocation response: " + JSON.stringify(data));
        provisionLogger.info("RegisterLocation response received", {
          typename: data?.registerLocation.__typename,
        });

        if (data?.registerLocation.__typename === "RegisterLocationSuccess") {
          returnValue = data.registerLocation.location.id;
          onDebug?.("Registration success, locationId: " + returnValue);
          provisionLogger.info("Registration SUCCESS", {
            locationId: returnValue,
            dsn: this.dsn,
          });
          return returnValue;
        } else if (data?.registerLocation.__typename === "NotFound") {
          onDebug?.("[Provision] NotFound: " + JSON.stringify(data));
          provisionLogger.warn("Device not found on backend", {
            dsn: this.dsn,
            setupToken: this.setupToken,
            response: data,
          });
        }
      } catch (e) {
        onDebug?.("[Provision] Error in WiFi-only registration: " + e);
        
        // Usar el logger para análisis detallado del error
        provisionLogger.logRegistrationError(e, {
          dsn: this.dsn,
          setupToken: this.setupToken,
          peripheral: peripheral?.id,
          signalAborted: signal.aborted,
        });
      }

      await sleep(500);
    }

    onDebug?.("Returning final value: " + returnValue);
    provisionLogger.warn("Registration loop ended without success", {
      returnValue,
      signalAborted: signal.aborted,
    });
    return returnValue;
  }

  public get dsnValue() {
    return this.dsn;
  }
  public get setupTokenValue() {
    return this.setupToken;
  }
}
