# JCI HX App

A React Native/Expo application for JCI thermostat management and configuration.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Expo CLI**: `npm install -g @expo/cli`
- **Android Studio** (for Android development)
- **Xcode** (for iOS development, macOS only)
- **Java Development Kit (JDK)** 11 or higher
- **Gradle** (usually bundled with Android Studio)

## Local Development Setup 

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd jci-hx-app-two

# Install dependencies
npm install
# or
yarn install
```

### 2. Environment Configuration

Create environment files if needed:

```bash
# Copy example environment files (if they exist)
cp .env.example .env
```

### 3. Metro Configuration

The project uses Metro bundler. If Metro disconnects frequently, you can:

```bash
# Clear Metro cache
npx expo start --clear

# Or reset the entire cache
npx expo start --reset-cache
```

## Running the App Locally

### Development Mode

```bash
# Start the development server
npx expo start

# This will open the Expo DevTools in your browser
# You can then:
# - Press 'a' to open Android emulator
# - Press 'i' to open iOS simulator
# - Scan QR code with Expo Go app on your device
```

### Platform-Specific Development

#### Android

```bash
# Run on Android emulator or connected device
npx expo run:android

# If you encounter issues, try:
npx expo run:android --clear
```

#### iOS (macOS only)

```bash
# Run on iOS simulator or connected device
npx expo run:ios

# If you encounter issues, try:
npx expo run:ios --clear
```

### Troubleshooting Metro Disconnections

If Metro frequently disconnects:

1. **Clear cache and restart**:
   ```bash
   npx expo start --clear --reset-cache
   ```

2. **Check your network connection** and ensure you're on a stable network

3. **Increase Metro timeout** (if needed):
   ```bash
   npx expo start --max-workers=2
   ```

4. **Use tunnel mode** for better connectivity:
   ```bash
   npx expo start --tunnel
   ```

## Building for Different Environments

### Android Builds

#### Local Development Build

```bash
# Generate a local development APK
cd android
./gradlew assembleDebug

# The APK will be located at:
# android/app/build/outputs/apk/debug/app-debug.apk
```

#### Release Builds

```bash
# Navigate to Android directory
cd android

# Clean previous builds
./gradlew clean

# Build for different environments:

# Local/Development
./gradlew assembleRelease -PbuildType=local

# Test/Staging
./gradlew assembleRelease -PbuildType=test

# Production
./gradlew assembleRelease -PbuildType=prod

# The APK will be located at:
# android/app/build/outputs/apk/release/app-release.apk
```

#### Signing Release Builds

For release builds, you'll need to configure signing:

1. **Create a keystore** (if you don't have one):
   ```bash
   keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Configure signing** in `android/app/build.gradle`

3. **Build signed APK**:
   ```bash
   ./gradlew assembleRelease
   ```

### iOS Builds (macOS only)

#### Prerequisites

- **Xcode** installed and updated
- **iOS Developer Account** (for distribution)
- **CocoaPods** installed: `sudo gem install cocoapods`

#### Build Commands

```bash
# Navigate to iOS directory
cd ios

# Install CocoaPods dependencies
pod install

# Clean previous builds
xcodebuild clean -workspace Hx.xcworkspace -scheme Hx -configuration Release

# Build for different environments:

# Local/Development
xcodebuild build -workspace Hx.xcworkspace -scheme Hx -configuration Debug

# Test/Staging
xcodebuild build -workspace Hx.xcworkspace -scheme Hx -configuration Release

# Production (Archive)
xcodebuild archive -workspace Hx.xcworkspace -scheme Hx -configuration Release -archivePath build/Hx.xcarchive

# Export IPA (after archiving)
xcodebuild -exportArchive -archivePath build/Hx.xcarchive -exportPath build/ -exportOptionsPlist ExportOptions.plist
```

#### Complete iOS Build Process

For a complete iOS build workflow:

```bash
# 1. Clean workspace
xcodebuild clean -workspace Hx.xcworkspace -scheme Hx -configuration Release

# 2. Build the project
xcodebuild build -workspace Hx.xcworkspace -scheme Hx -configuration Release

# 3. Create archive for distribution
xcodebuild archive -workspace Hx.xcworkspace -scheme Hx -configuration Release -archivePath build/Hx.xcarchive

# 4. Export IPA file
xcodebuild -exportArchive -archivePath build/Hx.xcarchive -exportPath build/ -exportOptionsPlist ExportOptions.plist
```

#### Environment-Specific Builds

```bash
# Development build
xcodebuild build -workspace Hx.xcworkspace -scheme Hx -configuration Debug -destination 'platform=iOS Simulator,name=iPhone 14'

# Test/Staging build
xcodebuild build -workspace Hx.xcworkspace -scheme Hx -configuration Release -destination 'platform=iOS Simulator,name=iPhone 14'

# Production archive
xcodebuild archive -workspace Hx.xcworkspace -scheme Hx -configuration Release -archivePath build/Hx.xcarchive -destination 'generic/platform=iOS'
```

#### Using Xcode GUI

1. **Open the workspace**:
   ```bash
   open ios/Hx.xcworkspace
   ```

2. **Select target device/simulator**

3. **Choose build configuration** (Debug/Release)

4. **Build** (⌘+B) or **Archive** (Product → Archive)

### Build Configuration

Configure different build types in:

- **Android**: `android/app/build.gradle`
- **iOS**: Xcode project settings

### Common Issues

1. **Metro disconnections**: Use `--tunnel` mode or clear cache
2. **Build failures**: Clean and rebuild
3. **Permission issues**: Check device permissions
4. **BLE issues**: Ensure Bluetooth is enabled and permissions granted

## Deployment

### Android

1. **Generate signed APK**:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

2. **Upload to Google Play Console** or distribute via other channels

### iOS

1. **Archive the app** in Xcode
2. **Upload to App Store Connect** via Xcode or Application Loader

## Project Structure

```
jci-hx-app-two/
├── app/                    # Main app directory (Expo Router)
├── components/             # Reusable React components
├── screens/               # Screen components
├── utils/                 # Utility functions
├── contexts/              # React contexts
├── graph/                 # GraphQL queries and mutations
├── android/               # Android-specific code
├── ios/                   # iOS-specific code
└── assets/                # Static assets
```

## Version Management

### Automatic Version Bumping

The project includes an automated script to increment and synchronize versions across all platforms (Android, iOS, package.json, app.json).

#### Usage

```bash
# Increment minor version (default): 4.0.2 → 4.1.0
npm run version:bump

# Increment patch version: 4.0.2 → 4.0.3
npm run version:bump -- --patch

# Increment minor version: 4.0.2 → 4.1.0
npm run version:bump -- --minor

# Increment major version: 4.0.2 → 5.0.0
npm run version:bump -- --major

# Sync versions without incrementing (useful for fixing inconsistencies)
npm run version:bump -- --sync
```

#### What it does

The script automatically:
- **Detects inconsistencies** between version numbers in different files
- **Synchronizes** all versions to the highest found version
- **Increments** the semantic version according to the specified type (patch/minor/major)
- **Updates build numbers**:
  - Android `versionCode`: increments by +1
  - iOS `CURRENT_PROJECT_VERSION`: increments by +1 (Release only)
- **Updates all files** (Release configurations only):
  - `package.json` → `version`
  - `app.json` → `expo.version`
  - `android/app/build.gradle` → `versionCode` and `versionName` (defaultConfig for Release builds)
  - `ios/Hx.xcodeproj/project.pbxproj` → `MARKETING_VERSION` and `CURRENT_PROJECT_VERSION` (Release block only)
  - `ios/Hx/Info.plist` → `CFBundleShortVersionString` and `CFBundleVersion` (used by Release builds)

**Note:** The script only modifies Release configurations. Debug configurations remain unchanged.

#### Example Workflow

```bash
# Before release, bump version
npm run version:bump

# Build Android release
cd android && ./gradlew assembleRelease

# Build iOS release
cd ios && xcodebuild archive ...
```

## Branches

- **`main`**: Branch principal para desarrollo y release.
- **`upgrade/expo-sdk-53`**: Rama de trabajo con upgrade a Expo SDK 53. Se mantiene limpia.
- **`development_02-24-2026`**: Rama de traspaso/handover (limpieza Android, documentación de ramas). Merge a `main` o a `upgrade/expo-sdk-53` según acuerdo.

## Contributing

1. **Create a feature branch**
2. **Make your changes**
3. **Test thoroughly** on both platforms
4. **Submit a pull request**

## Support

For issues and questions:

1. **Check the debug messages** in the app
2. **Review the logs** in Metro bundler
3. **Check platform-specific logs** (Android Studio/Xcode)
4. **Create an issue** with detailed information
