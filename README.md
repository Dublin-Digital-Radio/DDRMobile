This repository has been moved to https://codeberg.org/Dublin-Digital-Radio/DDRMobile.

# The DDR Mobile App

A React Native client for DDR.

## Getting started

### 1. Set up your React Native development environment

See the "React Native CLI Quickstart" tab on the official guide: https://reactnative.dev/docs/environment-setup.

### 3. Prepare a device

#### Android

See "Preparing the Android device" on https://reactnative.dev/docs/environment-setup.

#### iOS

You can skip to the next step.

### 4. Start the app

```
npm start
```

## Running the app on your physical device

### Android

Make sure your physical device is the only connected device.

```
npx react-native run-android --variant=release
```

### iOS

See https://reactnative.dev/docs/running-on-device.

## Releasing

1. Increase the project's version number in `package.json` and `package-lock.json`.
2. Increase the Android app's `versionCode` and `versionName` in `android/app/build.gradle`.
3. Increase the iOS app's `MARKETING_VERSION` (there may be multiple instances) in `ios/DDRMobile.xcodeproj/project.pbxproj`.
4. Commit the changes and tag with the version number. Use the format `v1.2.3` for both the commit message and tag.
5. Push the version bump commit and tag to GitHub.
6. Open Android Studio, from the menu bar, "Build" > "Generate Signed App Bundle".
7. Once the app bundle is built, continue the release process on Google Play Console.
8. Open Xcode, from the menu bar, "Product" > "Archive".
9. Once the archive is built, "Distribute App". Then choose "App Store Connect".
10. Once the archive is uploaded, continue the release process on App Store Connect.
