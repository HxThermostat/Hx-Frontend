#!/usr/bin/env node

/**
 * Script to increment and synchronize versions in Android and iOS
 * 
 * Usage:
 *   npm run version:bump              # Increment minor (default): 4.0.2 → 4.1.0
 *   npm run version:bump -- --patch   # Increment patch: 4.0.2 → 4.0.3
 *   npm run version:bump -- --minor   # Increment minor: 4.0.2 → 4.1.0
 *   npm run version:bump -- --major   # Increment major: 4.0.2 → 5.0.0
 *   npm run version:bump -- --sync    # Only sync without incrementing
 */

const fs = require("fs");
const path = require("path");

const root = process.cwd();

// Colors for output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Parse command line arguments
const args = process.argv.slice(2);
const bumpType = args.find(arg => ["--patch", "--minor", "--major", "--sync"].includes(arg)) || "--minor";

// File paths
const files = {
  packageJson: path.join(root, "package.json"),
  appJson: path.join(root, "app.json"),
  androidBuildGradle: path.join(root, "android/app/build.gradle"),
  iosProjectPbxproj: path.join(root, "ios/Hx.xcodeproj/project.pbxproj"),
  iosInfoPlist: path.join(root, "ios/Hx/Info.plist"),
};

// Function to parse semantic version
function parseVersion(version) {
  const parts = version.split(".").map(Number);
  return {
    major: parts[0] || 0,
    minor: parts[1] || 0,
    patch: parts[2] || 0,
    toString() {
      return `${this.major}.${this.minor}.${this.patch}`;
    },
  };
}

// Function to increment version
function incrementVersion(version, type) {
  const v = parseVersion(version);
  
  switch (type) {
    case "patch":
      v.patch++;
      break;
    case "minor":
      v.minor++;
      v.patch = 0;
      break;
    case "major":
      v.major++;
      v.minor = 0;
      v.patch = 0;
      break;
  }
  
  return v.toString();
}

// Read current versions
function readCurrentVersions() {
  const versions = {};
  
  // package.json
  try {
    const packageJson = JSON.parse(fs.readFileSync(files.packageJson, "utf8"));
    versions.packageJson = packageJson.version;
  } catch (e) {
    log(`Error reading package.json: ${e.message}`, "red");
    process.exit(1);
  }
  
  // app.json
  try {
    const appJson = JSON.parse(fs.readFileSync(files.appJson, "utf8"));
    versions.appJson = appJson.expo.version;
  } catch (e) {
    log(`Error reading app.json: ${e.message}`, "red");
    process.exit(1);
  }
  
  // android/app/build.gradle
  try {
    const gradleContent = fs.readFileSync(files.androidBuildGradle, "utf8");
    const versionNameMatch = gradleContent.match(/versionName\s+"([^"]+)"/);
    const versionCodeMatch = gradleContent.match(/versionCode\s+(\d+)/);
    if (versionNameMatch) versions.androidVersionName = versionNameMatch[1];
    if (versionCodeMatch) versions.androidVersionCode = parseInt(versionCodeMatch[1], 10);
  } catch (e) {
    log(`Error reading android/app/build.gradle: ${e.message}`, "red");
    process.exit(1);
  }
  
  // ios/Hx.xcodeproj/project.pbxproj (Release only)
  try {
    const pbxprojContent = fs.readFileSync(files.iosProjectPbxproj, "utf8");
    // Search only within the Release block (13B07F951A680F5B00A75B9A /* Release */)
    const releaseBlockStart = "13B07F951A680F5B00A75B9A /* Release */";
    const releaseBlockEnd = "name = Release;";
    
    const releaseStartIndex = pbxprojContent.indexOf(releaseBlockStart);
    const releaseEndIndex = pbxprojContent.indexOf(releaseBlockEnd, releaseStartIndex);
    
    if (releaseStartIndex !== -1 && releaseEndIndex !== -1) {
      const releaseBlock = pbxprojContent.substring(releaseStartIndex, releaseEndIndex + releaseBlockEnd.length);
      const marketingVersionMatch = releaseBlock.match(/MARKETING_VERSION\s*=\s*([^;]+);/);
      const currentVersionMatch = releaseBlock.match(/CURRENT_PROJECT_VERSION\s*=\s*(\d+);/);
      if (marketingVersionMatch) versions.iosMarketingVersion = marketingVersionMatch[1].trim();
      if (currentVersionMatch) versions.iosBuildNumber = parseInt(currentVersionMatch[1], 10);
    }
  } catch (e) {
    log(`Error reading ios/Hx.xcodeproj/project.pbxproj: ${e.message}`, "red");
    process.exit(1);
  }
  
  // ios/Hx/Info.plist
  try {
    const plistContent = fs.readFileSync(files.iosInfoPlist, "utf8");
    const shortVersionMatch = plistContent.match(/<key>CFBundleShortVersionString<\/key>\s*<string>([^<]+)<\/string>/);
    const bundleVersionMatch = plistContent.match(/<key>CFBundleVersion<\/key>\s*<string>([^<]+)<\/string>/);
    if (shortVersionMatch) versions.iosShortVersion = shortVersionMatch[1].trim();
    if (bundleVersionMatch) versions.iosBundleVersion = bundleVersionMatch[1].trim();
  } catch (e) {
    log(`Error reading ios/Hx/Info.plist: ${e.message}`, "red");
    process.exit(1);
  }
  
  return versions;
}

// Detect highest version for synchronization
function getHighestVersion(versions) {
  const versionStrings = [
    versions.packageJson,
    versions.appJson,
    versions.androidVersionName,
    versions.iosMarketingVersion,
    versions.iosShortVersion,
  ].filter(Boolean);
  
  if (versionStrings.length === 0) {
    return null;
  }
  
  // Compare semantic versions
  return versionStrings.reduce((highest, current) => {
    const h = parseVersion(highest);
    const c = parseVersion(current);
    
    if (c.major > h.major) return current;
    if (c.major < h.major) return highest;
    if (c.minor > h.minor) return current;
    if (c.minor < h.minor) return highest;
    if (c.patch > h.patch) return current;
    return highest;
  });
}

// Update files
function updateFiles(newVersion, androidVersionCode, iosBuildNumber) {
  log(`\nUpdating files...`, "blue");
  
  // 1. package.json
  try {
    const packageJson = JSON.parse(fs.readFileSync(files.packageJson, "utf8"));
    packageJson.version = newVersion;
    fs.writeFileSync(files.packageJson, JSON.stringify(packageJson, null, 2) + "\n", "utf8");
    log(`  ✓ package.json → ${newVersion}`, "green");
  } catch (e) {
    log(`  ✗ Error updating package.json: ${e.message}`, "red");
    throw e;
  }
  
  // 2. app.json
  try {
    const appJson = JSON.parse(fs.readFileSync(files.appJson, "utf8"));
    appJson.expo.version = newVersion;
    fs.writeFileSync(files.appJson, JSON.stringify(appJson, null, 2) + "\n", "utf8");
    log(`  ✓ app.json → ${newVersion}`, "green");
  } catch (e) {
    log(`  ✗ Error updating app.json: ${e.message}`, "red");
    throw e;
  }
  
  // 3. android/app/build.gradle (defaultConfig - used for Release builds)
  try {
    let gradleContent = fs.readFileSync(files.androidBuildGradle, "utf8");
    gradleContent = gradleContent.replace(/versionCode\s+\d+/, `versionCode ${androidVersionCode}`);
    gradleContent = gradleContent.replace(/versionName\s+"[^"]+"/, `versionName "${newVersion}"`);
    fs.writeFileSync(files.androidBuildGradle, gradleContent, "utf8");
    log(`  ✓ android/app/build.gradle (defaultConfig for Release) → versionName: ${newVersion}, versionCode: ${androidVersionCode}`, "green");
  } catch (e) {
    log(`  ✗ Error updating android/app/build.gradle: ${e.message}`, "red");
    throw e;
  }
  
  // 4. ios/Hx.xcodeproj/project.pbxproj (Release only)
  try {
    let pbxprojContent = fs.readFileSync(files.iosProjectPbxproj, "utf8");
    // Update only within the Release block (13B07F951A680F5B00A75B9A /* Release */)
    // Use a more precise approach: search for specific lines within the Release block
    // Replace MARKETING_VERSION only if it's after "13B07F951A680F5B00A75B9A /* Release */" and before "name = Release;"
    const releaseBlockStart = "13B07F951A680F5B00A75B9A /* Release */";
    const releaseBlockEnd = "name = Release;";
    
    // Find the Release block
    const releaseStartIndex = pbxprojContent.indexOf(releaseBlockStart);
    const releaseEndIndex = pbxprojContent.indexOf(releaseBlockEnd, releaseStartIndex);
    
    if (releaseStartIndex !== -1 && releaseEndIndex !== -1) {
      const beforeRelease = pbxprojContent.substring(0, releaseStartIndex);
      const releaseBlock = pbxprojContent.substring(releaseStartIndex, releaseEndIndex + releaseBlockEnd.length);
      const afterRelease = pbxprojContent.substring(releaseEndIndex + releaseBlockEnd.length);
      
      // Update only within the Release block
      let updatedReleaseBlock = releaseBlock;
      updatedReleaseBlock = updatedReleaseBlock.replace(
        /(MARKETING_VERSION\s*=\s*)[^;]+(;)/,
        `$1${newVersion}$2`
      );
      updatedReleaseBlock = updatedReleaseBlock.replace(
        /(CURRENT_PROJECT_VERSION\s*=\s*)\d+(;)/,
        `$1${iosBuildNumber}$2`
      );
      
      pbxprojContent = beforeRelease + updatedReleaseBlock + afterRelease;
    } else {
      throw new Error("Could not find Release block in project.pbxproj");
    }
    
    fs.writeFileSync(files.iosProjectPbxproj, pbxprojContent, "utf8");
    log(`  ✓ ios/Hx.xcodeproj/project.pbxproj (Release) → MARKETING_VERSION: ${newVersion}, CURRENT_PROJECT_VERSION: ${iosBuildNumber}`, "green");
  } catch (e) {
    log(`  ✗ Error updating ios/Hx.xcodeproj/project.pbxproj: ${e.message}`, "red");
    throw e;
  }
  
  // 5. ios/Hx/Info.plist (used by Release builds)
  try {
    let plistContent = fs.readFileSync(files.iosInfoPlist, "utf8");
    plistContent = plistContent.replace(
      /(<key>CFBundleShortVersionString<\/key>\s*<string>)[^<]+(<\/string>)/,
      `$1${newVersion}$2`
    );
    plistContent = plistContent.replace(
      /(<key>CFBundleVersion<\/key>\s*<string>)[^<]+(<\/string>)/,
      `$1${iosBuildNumber}$2`
    );
    fs.writeFileSync(files.iosInfoPlist, plistContent, "utf8");
    log(`  ✓ ios/Hx/Info.plist (used by Release) → CFBundleShortVersionString: ${newVersion}, CFBundleVersion: ${iosBuildNumber}`, "green");
  } catch (e) {
    log(`  ✗ Error updating ios/Hx/Info.plist: ${e.message}`, "red");
    throw e;
  }
}

// Main function
function main() {
  log("\n🔄 Version Bump Script\n", "blue");
  
  // Read current versions
  log("Reading current versions...", "blue");
  const currentVersions = readCurrentVersions();
  
  // Show current state
  log("\n📋 Current versions:", "yellow");
  log(`  package.json:              ${currentVersions.packageJson || "N/A"}`, "reset");
  log(`  app.json:                  ${currentVersions.appJson || "N/A"}`, "reset");
  log(`  Android versionName:       ${currentVersions.androidVersionName || "N/A"}`, "reset");
  log(`  Android versionCode:       ${currentVersions.androidVersionCode || "N/A"}`, "reset");
  log(`  iOS MARKETING_VERSION:     ${currentVersions.iosMarketingVersion || "N/A"}`, "reset");
  log(`  iOS CURRENT_PROJECT_VERSION: ${currentVersions.iosBuildNumber || "N/A"}`, "reset");
  log(`  iOS CFBundleShortVersionString: ${currentVersions.iosShortVersion || "N/A"}`, "reset");
  log(`  iOS CFBundleVersion:       ${currentVersions.iosBundleVersion || "N/A"}`, "reset");
  
  // Detect inconsistencies
  const highestVersion = getHighestVersion(currentVersions);
  const allVersions = [
    currentVersions.packageJson,
    currentVersions.appJson,
    currentVersions.androidVersionName,
    currentVersions.iosMarketingVersion,
    currentVersions.iosShortVersion,
  ].filter(Boolean);
  
  const hasInconsistencies = new Set(allVersions).size > 1;
  
  if (hasInconsistencies) {
    log(`\n⚠️  Inconsistencies detected. Highest version: ${highestVersion}`, "yellow");
  }
  
  // Determine base version (sync if there are inconsistencies)
  let baseVersion = highestVersion || currentVersions.packageJson;
  
  // Calculate new version
  let newVersion;
  if (bumpType === "--sync") {
    newVersion = baseVersion;
    log(`\n🔄 Sync mode: keeping version ${newVersion}`, "blue");
  } else {
    const incrementType = bumpType.replace("--", "");
    newVersion = incrementVersion(baseVersion, incrementType);
    log(`\n⬆️  ${incrementType} increment: ${baseVersion} → ${newVersion}`, "green");
  }
  
  // Calculate new build numbers
  const newAndroidVersionCode = (currentVersions.androidVersionCode || 0) + 1;
  const newIosBuildNumber = (currentVersions.iosBuildNumber || 0) + 1;
  
  log(`\n📦 Build numbers:`, "yellow");
  log(`  Android versionCode: ${currentVersions.androidVersionCode || 0} → ${newAndroidVersionCode}`, "reset");
  log(`  iOS CURRENT_PROJECT_VERSION: ${currentVersions.iosBuildNumber || 0} → ${newIosBuildNumber}`, "reset");
  
  // Confirm changes
  log(`\n✨ Change summary:`, "blue");
  log(`  Semantic version: ${baseVersion} → ${newVersion}`, "reset");
  log(`  Android versionCode: ${currentVersions.androidVersionCode || 0} → ${newAndroidVersionCode}`, "reset");
  log(`  iOS build number: ${currentVersions.iosBuildNumber || 0} → ${newIosBuildNumber}`, "reset");
  
  // Update files
  try {
    updateFiles(newVersion, newAndroidVersionCode, newIosBuildNumber);
    log(`\n✅ Versions updated successfully!`, "green");
    log(`\n📝 Modified files:`, "blue");
    log(`  - package.json`, "reset");
    log(`  - app.json`, "reset");
    log(`  - android/app/build.gradle`, "reset");
    log(`  - ios/Hx.xcodeproj/project.pbxproj`, "reset");
    log(`  - ios/Hx/Info.plist`, "reset");
  } catch (e) {
    log(`\n❌ Error updating files: ${e.message}`, "red");
    process.exit(1);
  }
}

// Execute
main();

