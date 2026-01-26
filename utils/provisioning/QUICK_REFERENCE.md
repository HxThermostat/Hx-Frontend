# WiFi Registration Debug - Quick Reference

## 🎯 What to Look For

### On Screen (UI):
Look for this line in the debug messages:
```
[ERROR] Registration failed: [ERROR_TYPE]
```

### In Logcat (Android):
```bash
adb logcat | grep "PROVISION.*ERROR"
```

### In Console (iOS):
Open **Console.app** → Filter by `PROVISION` → Look for `[ERROR]`

---

## 🔴 Error Types & Solutions

| Error Type | What It Means | What To Do |
|------------|---------------|------------|
| **TIMEOUT_ERROR** | Device too slow (>10s) | Increase Apollo timeout to 30s |
| **NETWORK_ERROR** | No internet connection | Check device WiFi has internet |
| **AUTH_ERROR** | Token expired/invalid | Logout and login again |
| **GRAPHQL_ERROR** | Backend rejected request | Check DSN/setupToken validity |
| **BACKEND_ERROR** | Server is down | Wait and retry later |

---

## ⚡ Quick Fix for TIMEOUT_ERROR

**File:** `graph/client/links/timeoutLink.ts`

**Change:**
```typescript
const timeoutLink = new ApolloLinkTimeout(10000);  // 10s - TOO SHORT
```

**To:**
```typescript
const timeoutLink = new ApolloLinkTimeout(30000);  // 30s - BETTER
```

---

## 📱 Commands Cheat Sheet

### Android:
```bash
# View all logs
adb logcat | grep PROVISION

# View only errors
adb logcat | grep "PROVISION.*ERROR"

# Save to file
adb logcat | grep PROVISION > logs.txt
```

### iOS:
- Console.app → Select device → Filter: `PROVISION`
- Or Xcode → Devices → View Device Logs

---

## ✅ What to Report

When filing a bug, include:
1. ✅ **Error type** (TIMEOUT, NETWORK, etc.)
2. ✅ **Device DSN** (from logs)
3. ✅ **Screenshot** of UI debug messages
4. ✅ **Time** it took before failing
5. ✅ **Full log output** from logcat/Console

