# Maven AGI Chat - React Native WebView Example

Example React Native application demonstrating how to integrate [Maven AGI Chat](https://www.mavenagi.com) into iOS and Android mobile apps using react-native-webview and how to pass configuration data such as signedUserData, unsignedUserData, and customData.

## Overview

This implementation uses the official Maven chat widget (`widget.js`) loaded within a WebView, following Maven's documented authentication flow for signed user data via JWT tokens.


## Running Locally
It's possible to run this sample app standalone locally in an iOS or android emulator if you would like to play around with it in a lightweight environment prior to integrating any code into your production mobile application(s).

### 1. Install Dependencies

```bash
npm install
# or
yarn install
```

### 2. Generate Keys & Configure

There is a command line utility tool included which generates the public/private key pair, along with the encryption secret necessary to setup secure user authentication and data persistence across Maven. You can reRun the automated setup script to generate all required cryptographic keys:

```bash
node setup-maven-keys.js
```

This will:
- ✅ Generate ES256 (P-256) public/private key pair using OpenSSL
- ✅ Create a secure 32-byte encryption secret
- ✅ Create/update your `.env` file with configuration
- ✅ Generate a JWT token for testing
- ✅ Display your **public key** and **encryption secret** for Maven Agent Designer

### 3. Configure Maven Agent Designer

**CRITICAL**: Both values must be configured for authentication to work!

1. Go to [Maven Agent Designer](https://agent.mavenagi.com)
2. Navigate to: **Apps → Chat → Settings → Advanced Settings**
3. Paste the **JWT Public Key** (from script output) into the "JWT Public Key" field
4. Paste the **Encryption secret** (from script output) into the "Encryption secret" field  
5. Save the configuration

⚠️ **Without both values configured, all users will appear as anonymous!**

### 4. Update Environment Variables

Edit `.env` and set your Maven organization and agent IDs:

```bash
MAVEN_ORG_ID=your-org-id
MAVEN_AGENT_ID=your-agent-id
TEST_USER_ID=test-user-123
TEST_USER_FIRST_NAME=John
TEST_USER_LAST_NAME=Doe
TEST_USER_EMAIL=john@example.com
```

Then regenerate the JWT token:

```bash
node setup-maven-keys.js
```

### 5. Run the App

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
BarryTestMobileApp/
├── App.tsx                          # Main app with chat modal
├── MavenChatWebView.tsx             # WebView with widget.js integration
├── CustomSupportScreen.tsx          # Custom support UI
├── setup-maven-keys.js              # Key generation & JWT utility
├── maven-config.js                  # Auto-generated config (gitignored)
├── .env                             # Environment variables (gitignored)
├── package.json                     # Dependencies
└── README.md                        # This file
```

## Authentication Flow

### How It Works

Maven chat uses a two-step authentication process:

1. **Sign**: User data is signed with ES256 (P-256 elliptic curve) using your private key
2. **Encrypt**: Signed JWT is encrypted with A128CBC-HS256 using your encryption secret

This ensures:
- User data integrity (signing prevents tampering)
- User data confidentiality (encryption prevents reading)
- Server-side verification (Maven verifies with your public key)

### Token Generation

The `setup-maven-keys.js` script handles token generation automatically:

```javascript
// 1. Sign user data with ES256
const signedJWT = await new SignJWT(userData)
  .setProtectedHeader({ alg: 'ES256' })
  .setIssuedAt()
  .setExpirationTime('7d')
  .sign(privateKeyObj);

// 2. Encrypt signed JWT with A128CBC-HS256
const encryptedJWT = await new EncryptJWT({ jwt: signedJWT })
  .setProtectedHeader({ alg: 'dir', enc: 'A128CBC-HS256' })
  .encrypt(encryptionKey);

return encryptedJWT; // This is your signedUserData token
```

### User Data Requirements

The token payload must include:

```javascript
{
  id: 'user-unique-id',        // Required: Unique user identifier
  firstName: 'John',            // Required: User's first name
  lastName: 'Doe',              // Required: User's last name
  email: 'john@example.com',    // Required: User's email
  // Optional: Add any custom fields your apps need
  phone: '+1234567890',
  company: 'Acme Corp',
  role: 'developer',
  plan: 'premium'
}
```

## Using `setup-maven-keys.js`

### Available Commands

```bash
# Generate keys and token (keeps existing keys)
node setup-maven-keys.js

# Force regenerate all keys (invalidates existing tokens)
node setup-maven-keys.js --force
```

### What It Does

The script performs these operations:

1. **Checks for existing keys** in `.env` file
2. **Generates new keys if needed**:
   - ES256 public/private key pair via OpenSSL
   - 32-byte encryption secret (base64 encoded)
3. **Generates JWT token** using current test user data
4. **Updates `.env` file** with all configuration
5. **Generates `maven-config.js`** for React Native import (safe values only)
6. **Displays instructions** for Maven Agent Designer configuration

### Output

After running, you'll see:

```bash
══════════════════════════════════════════════════════════
📋 MAVEN AGENT DESIGNER CONFIGURATION
══════════════════════════════════════════════════════════

🔑 PUBLIC KEY:
Copy this to the "JWT Public Key" field

-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...
-----END PUBLIC KEY-----

🔐 ENCRYPTION SECRET:
Copy this to the "Encryption secret" field

9rRMUURcnrFt479LKdcT2khEhjo11qYHnJfqu+5Y2co=

══════════════════════════════════════════════════════════

📌 CRITICAL: Configure BOTH values in Maven Agent Designer:
1. Go to: https://agent.mavenagi.com
2. Navigate to: Apps → Chat → Settings → Advanced Settings
3. Paste PUBLIC KEY (above) into "JWT Public Key" field
4. Paste ENCRYPTION SECRET (above) into "Encryption secret" field
5. Save the configuration

⚠️  Without both values, users will appear as anonymous!
```

### Configuration Files

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

## Production Implementation

⚠️ **CRITICAL**: Never generate JWT tokens in your mobile app in production!

### Recommended Architecture

```
Mobile App → Your Backend API → Maven Chat
            ↓
         JWT Token
```

### Backend Implementation

Your secure backend should generate tokens:

```javascript
// Example: Node.js/Express endpoint
app.get('/api/maven/token', authenticate, async (req, res) => {
  const { SignJWT, EncryptJWT } = require('jose');
  
  // 1. Sign user data
  const signedJWT = await new SignJWT({
    id: req.user.id,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    email: req.user.email,
  })
    .setProtectedHeader({ alg: 'ES256' })
    .setIssuedAt()
    .setExpirationTime('1h')  // Short TTL in production!
    .sign(privateKey);

  // 2. Encrypt signed JWT
  const encryptedJWT = await new EncryptJWT({ jwt: signedJWT })
    .setProtectedHeader({ alg: 'dir', enc: 'A128CBC-HS256' })
    .encrypt(encryptionSecret);

  res.json({ mavenToken: encryptedJWT });
});
```

### Mobile App Implementation

```typescript
// App.tsx
import { useState, useEffect } from 'react';

function App() {
  const [jwt, setJwt] = useState<string | null>(null);

  useEffect(() => {
    // Fetch JWT from your backend
    fetch('https://your-api.com/maven/token', {
      headers: {
        'Authorization': `Bearer ${userAccessToken}`,
      },
    })
      .then(res => res.json())
      .then(data => setJwt(data.mavenToken))
      .catch(err => console.error('Failed to fetch Maven token:', err));
  }, []);

  if (!jwt) {
    return <LoadingScreen />;
  }

  return (
    <CustomSupportScreen
      organizationId={MAVEN_CONFIG.organizationId}
      agentId={MAVEN_CONFIG.agentId}
      signedUserData={jwt}  // Token from backend
      onClose={() => setIsChatOpen(false)}
    />
  );
}
```

## Troubleshooting

### Users Appear as Anonymous

**Cause**: Missing public key or encryption secret in Maven Agent Designer

**Solution**: 
1. Run `node setup-maven-keys.js`
2. Copy BOTH the public key AND encryption secret from output
3. Configure both in Maven Agent Designer (Apps → Chat → Settings → Advanced Settings)
4. Save and test again

### "Invalid key format" Error

**Cause**: Private key is corrupted or incorrectly formatted

**Solution**: 
```bash
# Regenerate keys
node setup-maven-keys.js --force
```

### Token Expired

**Cause**: JWT tokens expire after 7 days (configurable)

**Solution**:
```bash
# Regenerate token with existing keys
node setup-maven-keys.js
```

### iOS Build Issues

**Cause**: CocoaPods not installed or out of date

**Solution**:
```bash
cd ios
pod install
cd ..
npx react-native run-ios
```

### Android Build Issues

**Cause**: Gradle cache or build artifacts

**Solution**:
```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

### WebView Shows Blank Screen

**Cause**: JavaScript or storage disabled

**Solution**: Check WebView props in `MavenChatWebView.tsx`:
```typescript
<WebView
  javaScriptEnabled={true}        // Required
  domStorageEnabled={true}         // Required
  thirdPartyCookiesEnabled={true}  // Required
  {...other props}
/>
```

## Security Best Practices

### Development

- ✅ Use `.env` for all secrets
- ✅ Never commit `.env` or `maven-config.js`
- ✅ Rotate keys periodically
- ✅ Use test users for development

### Production

- ✅ Generate tokens server-side only
- ✅ Use short token TTLs (15-60 minutes recommended)
- ✅ Implement token refresh mechanism
- ✅ Store private key in secure vault (AWS Secrets Manager, etc.)
- ✅ Use environment-specific keys (dev/staging/prod)
- ✅ Monitor token generation failures
- ✅ Implement rate limiting on token endpoint

### Never Do This

- ❌ Hardcode secrets in source code
- ❌ Commit `.env` to version control
- ❌ Generate tokens in mobile app
- ❌ Use same keys for dev and production
- ❌ Share private keys or encryption secrets
- ❌ Use long-lived tokens in production

## Web vs Mobile Integration

This React Native implementation mirrors the web widget architecture:

| Aspect | Web | Mobile (This Example) |
|--------|-----|----------------------|
| **Loader** | `<script src="widget.js">` | HTML in WebView with widget.js |
| **Trigger** | Widget-generated button | Custom button/modal |
| **Container** | iframe (auto-created) | WebView component |
| **URL** | `chat.onmaven.app/{org}/{agent}` | Same URL |
| **Auth** | `signedUserData` param | Same `signedUserData` param |
| **Protocol** | postMessage API | Same postMessage via bridge |

**Key Insight**: The mobile integration loads the same Maven chat - it's just a different delivery mechanism!

## API Reference

### `MavenChatWebView` Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `organizationId` | string | Yes | Your Maven organization ID |
| `agentId` | string | Yes | Your Maven agent ID |
| `signedUserData` | string \| null | No | Encrypted JWT token for authentication |
| `unsignedUserData` | Record<string, any> \| null | No | Additional unverified user context |
| `tags` | string[] | No | Tags to categorize the conversation |

### Example Usage

```typescript
import MavenChatWebView from './MavenChatWebView';

<MavenChatWebView
  organizationId="org_abc123"
  agentId="agent_xyz789"
  signedUserData="eyJhbGciOiJkaXIi..."
  unsignedUserData={{
    appVersion: '1.0.0',
    platform: 'iOS',
    device: 'iPhone 17 Pro',
  }}
  tags={['mobile-app', 'ios', 'support']}
/>
```

## Documentation

- [Maven AGI Documentation](https://docs.mavenagi.com)
- [Chat Widget Guide](https://docs.mavenagi.com/apps/chat)
- [Maven Developer Portal](https://developers.mavenagi.com)
- [React Native WebView](https://github.com/react-native-webview/react-native-webview)

## Support

- [Maven AGI Discord](https://discord.mavenagi.com)
- [Developer Documentation](https://developers.mavenagi.com)
- [GitHub Issues](https://github.com/mavenagi-apps/react-native-webview-example/issues)

## License

MIT

---

## Example App Features

This example includes a complete custom support screen (`CustomSupportScreen.tsx`) that demonstrates:

- ✅ Branded support UI with company colors
- ✅ Multiple support options (chat, knowledge base, email, FAQs)
- ✅ Smooth animations and modal transitions
- ✅ iOS-specific safe area handling
- ✅ Responsive design for different screen sizes
- ✅ Clean back/close navigation

Feel free to customize the UI to match your brand!