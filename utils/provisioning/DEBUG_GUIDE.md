# WiFi Registration Debugging Guide

## What to Look For

When WiFi-only registration fails, you need to identify **what type of error** is causing the failure. This guide explains what to look for both **on screen** (UI) and in **logcat** (production logs).

---

## 🖥️ On Screen (UI Debug Messages)

During registration, you'll see debug messages on screen. Look for these key messages:

### ✅ Success Path:
```
[INFO] WiFi-only registration started
[INFO] Waiting 5s for device to come online
[INFO] Starting registration loop
[INFO] Sending RegisterLocation mutation
[INFO] RegisterLocation response received
[INFO] Registration SUCCESS
```

### ❌ Error Path - Look for the ERROR line:

#### 1. **TIMEOUT_ERROR** (Most Common)
```
[ERROR] Registration failed: TIMEOUT_ERROR
[ERROR] Error details: Apollo Client timeout reached (10s default). Device may be slow to respond.
[INFO] Recommendation: Device is taking too long to respond. Ensure device is powered on and connected to WiFi network.
```

**What it means:** The device is taking longer than 10 seconds to respond.  
**What to check:** Device is powered on, connected to WiFi, and has internet access.

---

#### 2. **NETWORK_ERROR**
```
[ERROR] Registration failed: NETWORK_ERROR
[ERROR] Error details: Network connectivity issue. Device may not have internet access.
[INFO] Recommendation: Check internet connectivity. Ensure device has access to the internet.
```

**What it means:** The phone or device cannot reach the backend server.  
**What to check:** WiFi is connected, internet is working, no firewall blocking.

---

#### 3. **AUTH_ERROR**
```
[ERROR] Registration failed: AUTH_ERROR
[ERROR] Error details: Authentication failed. Token may be expired or invalid.
[INFO] Recommendation: Authentication failed. User may need to re-login.
```

**What it means:** The authentication token is expired or invalid.  
**What to do:** Log out and log back in.

---

#### 4. **GRAPHQL_ERROR**
```
[ERROR] Registration failed: GRAPHQL_ERROR
[ERROR] Error details: GraphQL error(s): [ERROR_CODE] Error message
[INFO] Recommendation: Server rejected the request. Check if DSN and setupToken are valid.
```

**What it means:** The backend server rejected the registration request.  
**What to check:** DSN and setupToken are correct, backend is accepting requests.

---

#### 5. **BACKEND_ERROR**
```
[ERROR] Registration failed: BACKEND_ERROR
[ERROR] Error details: Backend server error. Server may be down or experiencing issues.
[INFO] Recommendation: Server is experiencing issues. Try again later.
```

**What it means:** The backend server is having problems (500 error, etc).  
**What to do:** Wait and try again later, or contact backend team.

---

## 📱 In Logcat (Android) / Console (iOS)

For production debugging or when you can't see the screen, use system logs.

### Android - Using logcat:

#### View all provisioning logs:
```bash
adb logcat | grep PROVISION
```

#### View only errors:
```bash
adb logcat | grep "PROVISION.*ERROR"
```

#### Save logs to file:
```bash
adb logcat | grep PROVISION > registration_debug.txt
```

### iOS - Using Console:

#### Option 1: Console.app
1. Connect iPhone/iPad to Mac
2. Open **Console.app**
3. Select your device
4. Search/Filter for: `PROVISION`

#### Option 2: Terminal
```bash
xcrun simctl spawn booted log stream --predicate 'eventMessage contains "PROVISION"'
```

---

## 🔍 What to Look For in Logs

### Example Log Entry:
```
[2025-10-07T10:31:00.567Z] [PROVISION] [ERROR] Registration failed: TIMEOUT_ERROR | Context: {"dsn":"AC233F123456","setupToken":"a1b2c3d4","errorName":"ApolloError","errorMessage":"Aborted","errorType":"TIMEOUT_ERROR","isRecoverable":true}
```

### Key Information to Extract:

1. **errorType**: `TIMEOUT_ERROR`, `NETWORK_ERROR`, `AUTH_ERROR`, etc.
2. **dsn**: The device serial number (e.g., `AC233F123456`)
3. **setupToken**: The token being used for registration
4. **isRecoverable**: Whether the error can be retried

---

## 📋 Quick Decision Tree

```
Registration Failed
    ↓
Look at error type:
    
    TIMEOUT_ERROR?
        → Device is slow to respond
        → Solution: Increase Apollo timeout from 10s to 30s
        → File: graph/client/links/timeoutLink.ts
    
    NETWORK_ERROR?
        → No internet connectivity
        → Solution: Check device WiFi has internet access
    
    AUTH_ERROR?
        → Token expired
        → Solution: User needs to logout/login
    
    GRAPHQL_ERROR?
        → Backend rejected request
        → Solution: Check DSN/setupToken validity with backend team
    
    BACKEND_ERROR?
        → Server is down
        → Solution: Wait and retry, or contact backend team
```

---

## 🎯 Most Common Issue: TIMEOUT_ERROR

If you consistently see `TIMEOUT_ERROR`, it means the Apollo Client timeout (10 seconds) is too short for device registration.

### Solution:
Edit `graph/client/links/timeoutLink.ts`:
```typescript
// Change from:
const timeoutLink = new ApolloLinkTimeout(10000);

// To:
const timeoutLink = new ApolloLinkTimeout(30000);  // 30 seconds
```

---

## 📊 Collecting Evidence

### What to Capture:

1. **On Screen**: Take a screenshot of the debug messages
2. **Logcat**: Save the full log output:
   ```bash
   adb logcat | grep PROVISION > bug_report.txt
   ```
3. **Context**: Note the DSN and setupToken from the logs
4. **Timing**: How long does it take before the error appears?

### Share This Information:

When reporting the issue, include:
- ✅ Error type (TIMEOUT, NETWORK, AUTH, etc.)
- ✅ DSN of the device
- ✅ Full error message from logs
- ✅ Screenshot of UI debug messages
- ✅ How long registration took before failing

---

## 🚨 Emergency Debugging

If logs aren't showing up:

### Check Android:
```bash
# Is device connected?
adb devices

# Is logcat working?
adb logcat -c && adb logcat

# Try filtering differently:
adb logcat *:W | grep PROVISION
```

### Check iOS:
- Open Xcode → Window → Devices and Simulators
- Select device → View Device Logs
- Filter by "PROVISION"

---

## ✅ Summary

| Location | Command/Action | What You'll See |
|----------|---------------|-----------------|
| **On Screen** | Look at UI debug area | `[ERROR] Registration failed: [TYPE]` |
| **Android** | `adb logcat \| grep PROVISION` | Full log with timestamp and context |
| **iOS** | Console.app → Filter "PROVISION" | Full log with timestamp and context |

The **error type** tells you **exactly what's wrong**:
- `TIMEOUT_ERROR` = Device too slow (increase timeout)
- `NETWORK_ERROR` = No internet (check WiFi)
- `AUTH_ERROR` = Need to re-login
- `GRAPHQL_ERROR` = Backend issue (check DSN/setupToken)
- `BACKEND_ERROR` = Server down (retry later)

