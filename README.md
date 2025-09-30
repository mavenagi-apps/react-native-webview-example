# Maven AGI Chat - React Native WebView Example

This is an example React Native application which demonstrates how to integrate [Maven AGI Chat](https://www.mavenagi.com) into iOS and Android mobile apps using react-native-webview and how to pass configuration data such as signedUserData, unsignedUserData, and tags from the end user's mobile app interaction into the Maven AGI Platform.

![Maven Chat in React Native](img/iphone-emulator.png)

## Overview

This implementation the official Maven chat widget (`widget.js`) loaded via inline html into a WebView component, so is actually very similar to the documented installation steps for configuring Chat on your website.

## Running Locally
It's possible to run this sample app standalone locally in an iOS or android emulator if you would like to play around with it in a lightweight environment prior to integrating any code into your production mobile application(s).

### 1. Prerequisites (macOS)

**Install Xcode**
- Download Xcode from the App Store
- Open it once to finish installing components

**Install Command Line Tools**
```bash
xcode-select --install
```

**Install CocoaPods** (for iOS dependencies)
```bash
sudo gem install cocoapods -n /usr/local/bin
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Install iOS Pods

```bash
cd ios && pod install && cd ..
```

### 4. Copy .env.example as new file .env and fill out any values for settings you have

### 5. Use `setup-maven-keys.js` to generate keys and tokens

### Available Commands

```bash
# Generate keys and token (keeps existing keys)
node setup-maven-keys.js

# Force regenerate public/private key pair, encryption secret, and jwt token)
node setup-maven-keys.js --force
```

### What It Does

The script will:
- Create `.env` from `.env.example` if it doesn't exist already
- Generate ES256 key pair and encryption secret (--force only)
- Display public key and encryption secret to be placed in Chat security settings in Agent Designer
- Report any missing configuration
- Generate JWT token (only if all other required values are present)
- Update `.env` file with any generated values
- Generates `maven-config.js` for React Native import (safe values only)

### Generated Configuration Files

The script manages two files:

1. **`.env`** (gitignored) - Contains all secrets:
   ```bash
   MAVEN_ORG_ID=your-org-id
   MAVEN_AGENT_ID=your-agent-id
   MAVEN_PRIVATE_KEY=-----BEGIN EC PRIVATE KEY-----\n...
   MAVEN_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\n...
   MAVEN_ENCRYPTION_SECRET=base64-secret-here
   TEST_USER_ID=test-user-123
   TEST_USER_FIRST_NAME=John
   TEST_USER_LAST_NAME=Doe
   TEST_USER_EMAIL=john@example.com
   MAVEN_JWT_TOKEN=eyJhbGci...
   ```

2. **`maven-config.js`** (gitignored) - Safe values for React Native:
   ```javascript
   export const MAVEN_CONFIG = {
     organizationId: 'your-org-id',
     agentId: 'your-agent-id',
     signedUserData: 'eyJhbGci...',  // JWT token
   };
   ```

### 6. Configure Chat Security Settings in Maven Agent Designer if not already set up

Both values must be configured for authentication to work!

1. Go to Agent Designer.
2. Navigate to: **Apps → Chat → Settings → Security**
3. Paste the **JWT Public Key** (from script output) into the "JWT Public Key" field
4. Paste the **Encryption secret** (from script output) into the "Encryption secret" field  
5. Save the configuration


**Production Note**: In production, keep your private key and encryption secret in your backend. The mobile app should fetch a signed JWT token by calling your backend API. Never embed these credentials in the client app.

### 7. Run the App

```bash
# iOS
npm run ios
# or
npx react-native run-ios

# Android  
npm run android
# or
npx react-native run-android
```

## Architecture

### Communication Flow

```
React Native App
    ↓
HTML page with widget.js loaded in WebView
    ↓
Maven.ChatWidget.load() called with signedUserData
    ↓
Widget creates iframe: chat.onmaven.app/{orgId}/{agentId}
    ↓
Chat authenticates user and starts conversation
```

### Key Components

- **`MavenChatWebView.tsx`**: WebView component that loads an HTML page with widget.js
- **`CustomSupportScreen.tsx`**: Branded support UI with integrated Maven chat
- **`setup-maven-keys.js`**: Automated key generation and JWT token creation utility
- **`App.tsx`**: Main app with modal-based chat launcher
- **`maven-config.js`**: Auto-generated config file (gitignored)

## Project Structure

```
react-native-webview-example/
├── App.tsx                          # Main app with chat modal
├── MavenChatWebView.tsx             # WebView with widget.js integration
├── CustomSupportScreen.tsx          # Custom support UI
├── setup-maven-keys.js              # Key generation & JWT utility
├── maven-config.js                  # Auto-generated config (gitignored)
├── .env                             # Copy from .env.example and fill out, use setup-maven-keys.js to generate signed JWT and public/private key pair and encryption secret if you don't have already them or want to create an additional environment (gitignored)
├── package.json                     # Dependencies
└── README.md                        # you're reading it
```