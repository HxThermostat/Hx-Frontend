import { bytesToString } from "convert-string";
import BleManager, { Peripheral } from "react-native-ble-manager";
import { getDSN } from "./bluetooth";
import { timeoutSignal } from "./utils";

const GATEWAY_IP = "192.168.0.1";

export interface Status {
  dsn: string;
  mac: string;
}

export interface Network {
  ssid: string;
  type: string;
  security: string;
  bars: number;
}

interface WifiScan {
  wifi_scan: {
    results: Network[];
  };
}

interface WifiStatus {
  wifi_status: {
    connect_history: {
      error: number;
      message: string;
    }[];
  };
}

export const status = async (
  connectedByBluetooth: boolean,
  peripheral?: Peripheral,
  onDebug?: (msg: string) => void
): Promise<Status> => {
  if (connectedByBluetooth && peripheral != undefined) {
    const duid = bytesToString(await getDSN(peripheral.id));
    await BleManager;
    const status: Status = {
      mac: "",
      dsn: duid,
    };
    return status;
  } else {
    onDebug?.(`[ap.ts] Fetching http://${GATEWAY_IP}/status.json`);
    const response = await fetch(`http://${GATEWAY_IP}/status.json`, {
      signal: timeoutSignal(1000),
    });
    const text = await response.text();
    try {
      const json = JSON.parse(text);
      onDebug?.(`[ap.ts] /status.json response (parsed): ${JSON.stringify(json)}`);
      return json;
    } catch (e) {
      onDebug?.(`[ap.ts] /status.json response (raw): ${text}`);
      throw new Error("La respuesta de /status.json no es JSON válido. ¿Estás conectado a la red del termostato?");
    }
  }
};

export const dsn = async (
  connectedByBluetooth: boolean,
  peripheral?: Peripheral,
): Promise<string> => (await status(connectedByBluetooth, peripheral)).dsn;

export const connected = async (
  connectedByBluetooth: boolean,
  peripheral?: Peripheral
): Promise<boolean> => {
  console.log('[ap.ts] connected called with connectedByBluetooth:', connectedByBluetooth, 'peripheral:', peripheral);
  try {
    const result = typeof (await status(connectedByBluetooth, peripheral)).dsn === "string";
    console.log('[ap.ts] connected result:', result);
    return result;
  } catch (e) {
    console.log('[ap.ts] connected error:', e);
    return false;
  }
};

export const setTime = async (): Promise<void> => {
  const response = await fetch(`http://${GATEWAY_IP}/time.json`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ time: Math.floor(Date.now() / 1000) }),
    signal: timeoutSignal(1000),
  });
  const text = await response.text();
  try {
    const json = JSON.parse(text);
    console.log("[ap.ts] /time.json response (parsed):", json);
  } catch (e) {
    console.log("[ap.ts] /time.json response (raw):", text);
    // No lanzamos error porque puede no devolver JSON
  }
};

export const startScan = async (): Promise<void> => {
  const response = await fetch(`http://${GATEWAY_IP}/wifi_scan.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const text = await response.text();
  try {
    const json = JSON.parse(text);
    console.log("[ap.ts] /wifi_scan.json response (parsed):", json);
  } catch (e) {
    console.log("[ap.ts] /wifi_scan.json response (raw):", text);
    // No lanzamos error porque puede no devolver JSON
  }
};

export const scanResults = async (): Promise<WifiScan> => {
  const res = await fetch(`http://${GATEWAY_IP}/wifi_scan_results.json`, {
    signal: timeoutSignal(1000),
  });
  const text = await res.text();
  try {
    const json = JSON.parse(text);
    console.log("[ap.ts] /wifi_scan_results.json response (parsed):", json);
    return json;
  } catch (e) {
    console.log("[ap.ts] /wifi_scan_results.json response (raw):", text);
    throw new Error("La respuesta de /wifi_scan_results.json no es JSON válido. ¿Estás conectado a la red del termostato?");
  }
};

export const wifiConnect = async (
  ssid: string,
  key: string,
  token: string
): Promise<void> => {
  const response = await fetch(
    `http://${GATEWAY_IP}/wifi_connect.json?ssid=${encodeURIComponent(
      ssid
    )}&key=${encodeURIComponent(key)}&setup_token=${encodeURIComponent(token)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: timeoutSignal(1000),
    }
  );
  const text = await response.text();
  try {
    const json = JSON.parse(text);
    console.log("[ap.ts] /wifi_connect.json response (parsed):", json);
  } catch (e) {
    console.log("[ap.ts] /wifi_connect.json response (raw):", text);
    // No lanzamos error porque puede no devolver JSON
  }
};

export const regtoken = async (): Promise<string | undefined> => {
  try {
    const response = await fetch(`http://${GATEWAY_IP}/regtoken.json`, {
      signal: timeoutSignal(1000),
    });
    const text = await response.text();
    try {
      const json = JSON.parse(text);
      console.log("[ap.ts] /regtoken.json response (parsed):", json);
      const { regtoken } = json;
      return typeof regtoken === "string" && regtoken != ""
        ? regtoken
        : undefined;
    } catch (e) {
      console.log("[ap.ts] /regtoken.json response (raw):", text);
      return undefined;
    }
  } catch {
    return undefined;
  }
};

export const wifiStopAp = async (): Promise<void> => {
  const response = await fetch(`http://${GATEWAY_IP}/wifi_stop_ap.json`, {
    method: "PUT",
    signal: timeoutSignal(1000),
  });
  const text = await response.text();
  try {
    const json = JSON.parse(text);
    console.log("[ap.ts] /wifi_stop_ap.json response (parsed):", json);
  } catch (e) {
    console.log("[ap.ts] /wifi_stop_ap.json response (raw):", text);
    // No lanzamos error porque puede no devolver JSON
  }
};
