# Maven Chat Mobile Integration - Complete Setup Guide

This guide adapts the web widget installation for React Native mobile apps.

## Key Differences: Web vs Mobile

| Aspect | Web Widget | Mobile (This App) |
|--------|-----------|-------------------|
| **Loading** | Load `widget.js` script | Load chat iframe directly in WebView |
| **URL** | Script dynamically creates iframe | Direct: `https://chat.onmaven.app/{orgId}/{agentId}` |
| **Communication** | Browser postMessage | React Native WebView postMessage |
| **Button** | Widget creates floating button | You create your own button/trigger |
| **Configuration** | `Maven.ChatWidget.load({...})` | Pass props to `<MavenChatWebView />` |

---

## Step 1: Generate Cryptographic Keys

Maven requires ES256 (ECDSA with P-256 curve) keys for JWT signing.

### Generate Private/Public Keypair

```bash
# Generate private key
openssl ecparam -name prime256v1 -genkey -noout -out private.ec.key

# Extract public key
openssl ec -in private.ec.key -pubout -out public.pem

# View the keys
cat private.ec.key
cat public.pem
```

**Save these files securely!** The private key should NEVER be in your mobile app.

### Generate Encryption Secret

```bash
# Generate 32-byte base64url-encoded secret
openssl rand -base64 32 | tr -d '=' | tr '/+' '_-' | cut -c1-44

# Example output: abc123def456ghi789jkl012mno345pqr678stu901
```

**Save this secret!** You'll need it for both encryption (backend) and configuration (Maven).

---

## Step 2: Configure Maven Chat App

1. **Install the Chat App** in your Maven Agent Designer:
   - Go to **Apps** → **Browse & Install** 
   - Search for and install **Chat**

2. **Configure Security Settings**:
   - Open the Chat app settings
   - Under **Security** section:
     - **JWT Public Key**: Paste contents of `public.pem`
     - **Encryption Secret**: Paste the 44-character secret from above
   - Save the configuration

3. **Note Your IDs**:
   - Organization ID (e.g., `mavenagi-apps`)
   - Agent ID (e.g., `barry`)

---

## Step 3: Test with Demo Credentials (No Auth Required)

For initial testing without authentication, use the demo setup:

### Update App.tsx

```typescript
const MAVEN_CONFIG = {
  organizationId: 'mavenagi-apps',
  agentId: 'barry',
  signedUserData: null,  // Anonymous mode for testing
};
```

**Test URL**: You can verify the chat works at:
```
https://chat.onmaven.app/mavenagi-apps/barry
```

This allows you to test the integration without implementing authentication first.

---

## Step 4: Implement Backend JWT Generation

⚠️ **CRITICAL**: JWT tokens MUST be generated on your backend server, NOT in the mobile app!

### Backend Setup (Node.js Example)

```typescript
// backend/maven-auth.ts
import { SignJWT, EncryptJWT } from 'jose';
import crypto from 'node:crypto';
import { base64url } from 'jose';

// Load from environment variables or secure storage
const PRIVATE_KEY = process.env.MAVEN_PRIVATE_KEY;
const ENCRYPTION_SECRET = process.env.MAVEN_ENCRYPTION_SECRET;

interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  // Add any custom fields you want
  [key: string]: any;
}

/**
 * Generate Maven AGI authentication token
 * This implements the exact flow from Maven's documentation
 */
export async function generateMavenToken(userData: UserData): Promise<string> {
  // Validate required fields
  if (!userData.id || !userData.firstName || !userData.lastName) {
    throw new Error('Missing required fields: id, firstName, lastName');
  }
  
  if (!userData.email && !userData.phoneNumber) {
    throw new Error('Either email or phoneNumber is required');
  }

  // Step 1: Sign the user data with ES256 private key
  const privateKey = crypto.createPrivateKey({
    key: PRIVATE_KEY,
    format: 'pem',
  });

  const signedJWT = await new SignJWT(userData)
    .setProtectedHeader({ alg: 'ES256' })
    .setIssuedAt()
    .setExpirationTime('1h') // Short-lived token (1 hour)
    .sign(privateKey);

  // Step 2: Encrypt the signed JWT with the encryption secret
  const secretKey = base64url.decode(ENCRYPTION_SECRET);
  
  const encryptedJWT = await new EncryptJWT({ jwt: signedJWT })
    .setProtectedHeader({ alg: 'dir', enc: 'A128CBC-HS256' })
    .encrypt(secretKey);

  return encryptedJWT;
}

/**
 * API endpoint to issue Maven tokens
 */
export async function handleMavenTokenRequest(req, res) {
  try {
    // 1. Authenticate the user (your existing auth system)
    const authenticatedUser = await verifyUserSession(req);
    
    if (!authenticatedUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 2. Prepare user data for Maven
    const userData: UserData = {
      id: authenticatedUser.id,
      firstName: authenticatedUser.firstName,
      lastName: authenticatedUser.lastName,
      email: authenticatedUser.email,
      // Optional: Add custom fields
      accountType: authenticatedUser.subscriptionTier,
      appVersion: req.headers['x-app-version'],
    };

    // 3. Generate Maven token
    const mavenToken = await generateMavenToken(userData);

    // 4. Return token to mobile app
    res.json({
      mavenToken,
      expiresIn: 3600, // 1 hour in seconds
    });
  } catch (error) {
    console.error('Maven token generation failed:', error);
    res.status(500).json({ error: 'Token generation failed' });
  }
}
```

### Environment Variables

```bash
# .env
MAVEN_PRIVATE_KEY="-----BEGIN EC PRIVATE KEY-----
MHcCAQEEIJ...your-private-key...KoZIzj0DAQcH
-----END EC PRIVATE KEY-----"

MAVEN_ENCRYPTION_SECRET="abc123def456ghi789jkl012mno345pqr678stu901"
```

---

## Step 5: Update Mobile App to Fetch JWT

Modify your `App.tsx` to fetch the JWT dynamically:

```typescript
import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import MavenChatWebView from './MavenChatWebView';

const MAVEN_CONFIG = {
  organizationId: 'mavenagi-apps',  // Your org ID
  agentId: 'barry',                 // Your agent ID
};

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [mavenToken, setMavenToken] = useState<string | null>(null);
  const [isLoadingToken, setIsLoadingToken] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  /**
   * Fetch Maven JWT token from your backend
   * Called when user opens chat
   */
  const fetchMavenToken = async () => {
    setIsLoadingToken(true);
    setTokenError(null);

    try {
      // Replace with your actual backend endpoint
      const response = await fetch('https://your-backend.com/api/maven/token', {
        method: 'GET',
        headers: {
          // Include your app's authentication token
          'Authorization': `Bearer ${yourUserAuthToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Token fetch failed: ${response.status}`);
      }

      const data = await response.json();
      setMavenToken(data.mavenToken);
      setIsChatOpen(true);
    } catch (error) {
      console.error('Failed to fetch Maven token:', error);
      setTokenError(error.message);
      Alert.alert(
        'Connection Error',
        'Unable to start chat. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoadingToken(false);
    }
  };

  const handleOpenChat = () => {
    if (mavenToken) {
      // Token already loaded, just open chat
      setIsChatOpen(true);
    } else {
      // Need to fetch token first
      fetchMavenToken();
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent 
        onOpenChat={handleOpenChat}
        isLoadingToken={isLoadingToken}
      />
      
      {/* Maven Chat Modal */}
      {mavenToken && (
        <Modal
          visible={isChatOpen}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setIsChatOpen(false)}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Support Chat</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsChatOpen(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
          
          <MavenChatWebView
            organizationId={MAVEN_CONFIG.organizationId}
            agentId={MAVEN_CONFIG.agentId}
            signedUserData={mavenToken}
            unsignedUserData={{
              platform: 'iOS',
              appVersion: '1.0.0',
            }}
            tags={['mobile-app', 'support']}
          />
        </Modal>
      )}
    </SafeAreaProvider>
  );
}

function AppContent({ 
  onOpenChat, 
  isLoadingToken 
}: { 
  onOpenChat: () => void;
  isLoadingToken: boolean;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>BarryTestMobileApp</Text>
        <Text style={styles.subtitle}>Maven AGI Chat Demo</Text>
        
        <View style={styles.buttonContainer}>
          {isLoadingToken ? (
            <ActivityIndicator size="large" color="#6C2BD9" />
          ) : (
            <Button
              title="Open Support Chat"
              onPress={onOpenChat}
              color="#6C2BD9"
            />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: '#666',
  },
  buttonContainer: {
    marginVertical: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6C2BD9',
    fontWeight: '600',
  },
});

export default App;
```

---

## Configuration Options (Mobile Equivalent)

### Web Widget Config → Mobile Props Mapping

| Web Widget Property | Mobile Component Prop | Notes |
|--------------------|-----------------------|-------|
| `organizationId` | `organizationId` | Required |
| `agentId` | `agentId` | Required |
| `signedUserData` | `signedUserData` | JWT from backend |
| `unsignedUserData` | `unsignedUserData` | Optional context |
| `bgColor` | N/A | Handled by modal styling |
| `textColor` | N/A | Handled by modal styling |
| `horizontalPosition` | N/A | Use Modal presentation |
| `verticalPosition` | N/A | Use Modal presentation |
| N/A | `customData` | Additional metadata |
| N/A | `tags` | Conversation tags |

### Example Configuration

```typescript
<MavenChatWebView
  // Required
  organizationId="mavenagi-apps"
  agentId="barry"
  
  // Authentication (from backend)
  signedUserData="eyJhbGciOiJkaXIi..."
  
  // Optional: Additional context (unverified)
  unsignedUserData={{
    platform: 'iOS',
    appVersion: '1.0.0',
    deviceModel: 'iPhone 17 Pro',
    osVersion: '26.0',
  }}
  
  // Optional: Custom metadata
  customData={{
    userTier: 'premium',
    lastPurchase: '2025-09-15',
  }}
  
  // Optional: Conversation categorization
  tags={['mobile-app', 'ios', 'support', 'premium-user']}
/>
```

---

## User Data Requirements

Maven requires specific fields in the JWT payload:

### Required Fields

```typescript
{
  id: string,           // Unique user identifier
  firstName: string,    // User's first name
  lastName: string,     // User's last name
  // At least ONE of the following:
  email?: string,       // User's email
  phoneNumber?: string, // User's phone number
}
```

### Optional Custom Fields

You can add any additional fields for context:

```typescript
{
  id: 'user-123',
  firstName: 'Barry',
  lastName: 'Test',
  email: 'barry@example.com',
  // Custom fields
  accountType: 'premium',
  registrationDate: '2024-01-15',
  preferredLanguage: 'en',
  supportTier: 'priority',
}
```

---

## Testing Checklist

### Phase 1: Anonymous Testing (No Auth)
- [ ] Set `signedUserData: null` in config
- [ ] Organization ID and Agent ID are correct
- [ ] Button opens modal with WebView
- [ ] Chat loads successfully
- [ ] Can send and receive messages
- [ ] Close button works

### Phase 2: Backend Integration
- [ ] Generated ES256 keypair
- [ ] Generated encryption secret
- [ ] Configured Maven Chat app with public key and secret
- [ ] Backend endpoint generates valid JWT
- [ ] Backend endpoint is secured (requires authentication)
- [ ] JWT expires after reasonable time (≤ 1 hour)

### Phase 3: Authenticated Testing
- [ ] Mobile app fetches JWT from backend
- [ ] Loading state displays while fetching
- [ ] Error handling for failed token fetch
- [ ] JWT is passed to WebView correctly
- [ ] Chat recognizes authenticated user
- [ ] User data appears correctly in Maven dashboard
- [ ] Custom fields are logged in conversation

### Phase 4: Production Readiness
- [ ] Private key is NOT in mobile app code
- [ ] Encryption secret is NOT in mobile app code
- [ ] Backend validates user session before issuing JWT
- [ ] JWTs are short-lived (1 hour max)
- [ ] Network errors are handled gracefully
- [ ] Token refresh mechanism implemented
- [ ] Analytics/logging for chat usage

---

## Security Checklist

### ✅ Do This:
- Store private key and encryption secret on backend only
- Fetch JWT from authenticated backend endpoint
- Use short-lived tokens (≤ 1 hour)
- Validate user session before issuing tokens
- Use HTTPS for all API calls
- Rotate encryption secret periodically
- Log token generation for audit trail

### ❌ Never Do This:
- Hardcode JWT in mobile app
- Generate JWT client-side
- Store private key in app bundle
- Store encryption secret in app code
- Use long-lived tokens (> 1 day)
- Skip user authentication before issuing tokens
- Expose token generation endpoint publicly

---

## Troubleshooting

### "Chat loads but shows authentication error"
- JWT may be malformed or expired
- Check backend logs for signature/encryption errors
- Verify public key in Maven matches your private key
- Verify encryption secret matches between backend and Maven

### "Cannot connect to chat"
- Verify organization ID and agent ID are correct
- Test the URL directly: `https://chat.onmaven.app/{orgId}/{agentId}`
- Check that Chat app is installed in your Maven agent
- Ensure JavaScript is enabled in WebView

### "postMessage not working"
- Check `injectedJavaScript` in WebView
- Verify `onMessage` handler is attached
- Look for JavaScript errors in WebView console
- Ensure `domStorageEnabled={true}`

### "Backend token generation fails"
- Verify private key format (PEM with EC key)
- Check encryption secret is 44 characters base64url
- Ensure `jose` library is installed
- Check Node.js version (≥ 16 required for `jose`)

---

## Demo Access

Test the chat interface directly in a browser:

**Test URL**: https://chat.onmaven.app/mavenagi-apps/barry

This helps verify:
- Organization ID and Agent ID are correct
- Chat app is properly configured
- Your agent is responding correctly

Once this works in browser, the mobile integration should work identically!

---

## Next Steps

1. **Start Simple**: Test with demo credentials (no auth)
2. **Generate Keys**: Create your own keypair and encryption secret
3. **Configure Maven**: Add public key and secret to Chat app
4. **Implement Backend**: Create token generation endpoint
5. **Update Mobile**: Add token fetching to App.tsx
6. **Test**: Verify end-to-end authentication flow
7. **Deploy**: Roll out to production with proper monitoring

Good luck! 🚀
