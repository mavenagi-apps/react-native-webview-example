# Maven Chat Integration Guide

This React Native app integrates Maven AGI chat using a WebView approach that mirrors the web widget architecture.

## Architecture Overview

Based on the Maven chat widget flow, this mobile integration:

1. **Loads the Maven chat iframe** directly in a WebView: `https://chat.onmaven.app/{orgId}/{agentId}`
2. **Uses postMessage API** for bidirectional communication between React Native and the chat
3. **Sends authentication** via JWT tokens (signedUserData)
4. **Handles the same message protocol** as the web widget

### Communication Flow

```
React Native App
    ↓
WebView loads: chat.onmaven.app/{orgId}/{agentId}
    ↓
Chat sends: { type: 'MAVEN_LOADED' }
    ↓
App responds: { type: 'SIGNED_USER_DATA', data: jwt }
    ↓
Chat authenticates user and starts conversation
```

## Setup Instructions

### 1. Get Your Maven Credentials

From your Maven Agent Designer:
1. Go to **Apps** → **Browse & Install** → Install **Chat** app
2. Note your **Organization ID** and **Agent ID**
3. Configure your **JWT Public Key** and **Encryption Secret** in app settings

### 2. Generate JWT Token

The JWT token should be generated on your backend server (NOT in the mobile app).

#### Backend Example (Node.js):

```typescript
import { SignJWT, EncryptJWT } from 'jose';
import crypto from 'node:crypto';

const privateKey = `-----BEGIN EC PRIVATE KEY-----
...your-private-key...
-----END EC PRIVATE KEY-----`;

const encryptionSecret = "your-encryption-secret";

async function generateMavenToken(userData: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}) {
  // 1. Sign the user data with ES256
  const signedJWT = await new SignJWT(userData)
    .setProtectedHeader({ alg: 'ES256' })
    .setIssuedAt()
    .setExpirationTime('1d')
    .sign(crypto.createPrivateKey({ key: privateKey, format: 'pem' }));

  // 2. Encrypt the signed JWT
  const encryptedJWT = await new EncryptJWT({ jwt: signedJWT })
    .setProtectedHeader({ alg: 'dir', enc: 'A128CBC-HS256' })
    .encrypt(base64url.decode(encryptionSecret));

  return encryptedJWT;
}
```

### 3. Configure the App

Edit `App.tsx`:

```typescript
const MAVEN_CONFIG = {
  organizationId: 'your-actual-org-id',
  agentId: 'your-actual-agent-id',
  signedUserData: 'jwt-from-your-backend',
};
```

### 4. Fetch JWT Dynamically (Recommended)

Replace the hardcoded JWT with a backend call:

```typescript
import { useEffect, useState } from 'react';

function App() {
  const [jwt, setJwt] = useState<string | null>(null);

  useEffect(() => {
    // Fetch JWT from your backend
    fetch('https://your-backend.com/api/maven/token', {
      headers: {
        Authorization: `Bearer ${yourUserToken}`,
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
    // ... render with jwt
    <MavenChatWebView
      organizationId={MAVEN_CONFIG.organizationId}
      agentId={MAVEN_CONFIG.agentId}
      signedUserData={jwt}
    />
  );
}
```

## Component API Reference

### MavenChatWebView Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `organizationId` | string | Yes | Your Maven organization ID |
| `agentId` | string | Yes | Your Maven agent ID |
| `signedUserData` | string | No | Encrypted JWT token for user auth |
| `unsignedUserData` | object | No | Additional unverified user context |
| `customData` | object | No | Custom metadata for the conversation |
| `tags` | string[] | No | Tags to categorize the conversation |

### Example Usage

```typescript
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

## Message Protocol

The component implements the same message protocol as the Maven web widget:

### Messages from Chat to App:
- `MAVEN_LOADED` - Chat iframe is ready to receive data

### Messages from App to Chat:
- `SIGNED_USER_DATA` - Encrypted JWT for authentication
- `UNSIGNED_USER_DATA` - Additional context (unverified)
- `CUSTOM_DATA` - Custom metadata
- `CONVERSATION_TAGS` - Tags for categorization

## Security Considerations

### ⚠️ IMPORTANT: Never hardcode JWT tokens in production!

1. **Always fetch JWT from your backend** - The mobile app should request a token from your server
2. **Use short-lived tokens** - Set expiration to 1 hour or less
3. **Validate user identity** - Your backend should verify the user before issuing tokens
4. **Use HTTPS** - All communication should be encrypted
5. **Rotate encryption secrets** - Regularly update your Maven encryption secret

## Troubleshooting

### Chat doesn't load
- Verify `organizationId` and `agentId` are correct
- Check that the Chat app is installed in your Maven agent
- Ensure your domain is allowed in Maven app settings

### Authentication fails
- Verify JWT is correctly signed with ES256
- Verify JWT is encrypted with the correct secret
- Check that your public key is configured in Maven app settings
- Ensure user data includes required fields: `id`, `firstName`, `lastName`, `email`

### WebView blank screen
- Check browser console in WebView (use React Native Debugger)
- Verify JavaScript is enabled: `javaScriptEnabled={true}`
- Ensure DOM storage is enabled: `domStorageEnabled={true}`

## Testing

### Test with Mock Data (Development Only)

For local testing, you can temporarily use mock values:

```typescript
const MAVEN_CONFIG = {
  organizationId: 'test-org',
  agentId: 'test-agent',
  signedUserData: null, // Will fall back to anonymous user
};
```

### Test Message Flow

Add logging to see the message exchange:

```typescript
const handleMessage = (event: any) => {
  console.log('Message from chat:', event.nativeEvent.data);
  // ... rest of handler
};
```

## Additional Resources

- [Maven Chat Documentation](https://docs.mavenagi.com/apps/chat)
- [React Native WebView Docs](https://github.com/react-native-webview/react-native-webview/blob/master/docs/Reference.md)
- [Maven API Authentication](https://docs.mavenagi.com/api-reference/authentication)
