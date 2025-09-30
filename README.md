# Maven AGI Chat - React Native WebView Example

This example demonstrates how to integrate [Maven AGI Chat](https://www.mavenagi.com) into a React Native mobile application using WebView.

## Overview

This implementation uses the official Maven chat widget (`widget.js`) loaded within a WebView, following the documented authentication flow for signed user data (JWT tokens).

## Features

- ✅ Authenticated user chat via JWT tokens
- ✅ Custom support screen UI
- ✅ Auto-opening chat interface
- ✅ Proper ES256 signing + A128CBC-HS256 encryption
- ✅ Automated key generation and token management

## Architecture

The integration follows Maven's documented widget pattern:

1. **HTML Page**: Loads `widget.js` from Maven's CDN
2. **Widget Configuration**: Calls `Maven.ChatWidget.load()` with `signedUserData`
3. **Authentication**: JWT token signed with ES256 and encrypted with A128CBC-HS256
4. **WebView Bridge**: React Native WebView renders the configured widget

### Key Components

- **`MavenChatWebView.tsx`**: WebView component that loads widget.js
- **`CustomSupportScreen.tsx`**: Branded support UI with chat integration
- **`setup-maven-keys.js`**: Automated key generation and JWT token creation
- **`App.tsx`**: Main app with modal-based chat launcher

## Setup

### 1. Install Dependencies

```bash
npm install
# or
yarn install
```

### 2. Generate Keys and Configure

Run the setup script to generate ES256 key pairs and encryption secret:

```bash
node setup-maven-keys.js
```

This will:
- Generate ES256 (P-256) public/private key pair
- Generate a secure 32-byte encryption secret
- Create a `.env` file with your configuration
- Generate a JWT token for testing
- Display your **public key** and **encryption secret** for Maven Agent Designer

### 3. Configure Maven Agent Designer

1. Go to [Maven Agent Designer](https://agent.mavenagi.com)
2. Navigate to: **Apps → Chat → Settings → Advanced Settings**
3. Paste the **JWT Public Key** into the "JWT Public Key" field
4. Paste the **Encryption secret** into the "Encryption secret" field
5. Save the configuration

⚠️ **Important**: Both values must be configured in Maven for authenticated users to work!

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

## Project Structure

```
BarryTestMobileApp/
├── App.tsx                      # Main app with chat modal
├── MavenChatWebView.tsx         # WebView component with widget.js
├── CustomSupportScreen.tsx      # Custom support UI
├── setup-maven-keys.js          # Key generation & JWT token utility
├── maven-config.js              # Auto-generated config (gitignored)
├── .env                         # Environment variables (gitignored)
└── .env.example                 # Environment template
```

## Authentication Flow

### Token Generation (Server-side)

```javascript
import { SignJWT, EncryptJWT } from 'jose';

// 1. Sign user data with ES256
const signedJWT = await new SignJWT(userData)
  .setProtectedHeader({ alg: 'ES256' })
  .setIssuedAt()
  .setExpirationTime('7d')
  .sign(privateKeyObj);

// 2. Encrypt signed JWT
const encryptedJWT = await new EncryptJWT({ jwt: signedJWT })
  .setProtectedHeader({ alg: 'dir', enc: 'A128CBC-HS256' })
  .encrypt(encryptionKey);
```

### WebView Integration

```typescript
// HTML page loads widget.js and passes signedUserData
Maven.ChatWidget.load({
  organizationId: 'your-org-id',
  agentId: 'your-agent-id',
  signedUserData: 'encrypted-jwt-token',
  hideButton: true,
});
```

## Troubleshooting

### Users Appear as Anonymous

**Solution**: Ensure both the **JWT public key** AND **encryption secret** are configured in Maven Agent Designer (Apps → Chat → Settings → Advanced Settings).

### Token Expired

JWT tokens expire after 7 days. Regenerate with:

```bash
node setup-maven-keys.js
```

### iOS Build Issues

If you encounter CocoaPods errors:

```bash
cd ios
pod install
cd ..
```

## Documentation

- [Maven AGI Documentation](https://docs.mavenagi.com)
- [Chat Widget Integration Guide](https://docs.mavenagi.com/apps/chat)
- [Maven Developer Portal](https://developers.mavenagi.com)

## Security Notes

- Never commit `.env` or `maven-config.js` to version control
- Generate JWT tokens server-side in production
- Keep token TTLs short (minutes to hours in production)
- Rotate keys periodically
- Use HTTPS for all communication

## Support

- [Maven AGI Discord](https://discord.mavenagi.com)
- [Developer Documentation](https://developers.mavenagi.com)
- [GitHub Issues](https://github.com/mavenagi-apps/react-native-webview-example/issues)

## License

MIT