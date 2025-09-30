# Testing Maven Chat with Authenticated Users

This guide shows you how to test the chat with a logged-in user (not anonymous).

## Overview

**Anonymous mode** (current): Chat works but doesn't know who the user is
**Authenticated mode**: Chat knows user identity (name, email, etc.) and can personalize the experience

## Step 1: Generate Keys Automatically (Recommended)

Use the automated setup script to generate all required keys:

```bash
node setup-maven-keys.js
```

This will:
- ✅ Generate ES256 public/private key pair
- ✅ Create encryption secret
- ✅ Create/update your .env file
- ✅ Display the public key to upload to Maven

Skip to **Step 2** after running this command.

### Alternative: Manual Key Generation

If you prefer to generate keys manually:

```bash
# Generate private key
openssl ecparam -name prime256v1 -genkey -noout -out private-key.pem

# Generate public key
openssl ec -in private-key.pem -pubout -out public-key.pem

# Generate encryption secret (32 bytes, base64 encoded)
openssl rand -base64 32
```

- **Public Key**: Upload to Maven (Apps → Chat → Settings → JWT Public Key)
- **Private Key**: Keep secret! Add to .env as MAVEN_PRIVATE_KEY
- **Encryption Secret**: Add to .env as MAVEN_ENCRYPTION_SECRET

## Step 2: Upload Public Key to Maven

1. Go to [Maven Agent Designer](https://agent.mavenagi.com)
2. Navigate to **Apps** → **Chat** (install if needed)
3. Click **Settings** tab
4. Paste your PUBLIC KEY in the "JWT Public Key" field
5. Note your **Organization ID** and **Agent ID**
6. Click **Save**

Update your .env with the IDs:
```bash
MAVEN_ORG_ID=your-org-id
MAVEN_AGENT_ID=your-agent-id
```

## Step 3: Verify Dependencies

Dependencies are already installed (jose, dotenv). If you need to reinstall:

```bash
npm install jose dotenv
# or
yarn add jose dotenv
```

If you used the automated setup (`npm run setup-keys`), your `.env` is already configured with keys. Skip to **Step 4**.

### Manual Configuration (if you didn't use setup-keys)

Create a `.env` file with your Maven credentials:

```bash
# Copy the template
cp .env.example .env

# Then edit .env with your actual values
```

Your `.env` file should look like:

```bash
MAVEN_ORG_ID=your-org-id
MAVEN_AGENT_ID=your-agent-id
MAVEN_PRIVATE_KEY=-----BEGIN EC PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END EC PRIVATE KEY-----
MAVEN_ENCRYPTION_SECRET=your-base64-secret
TEST_USER_ID=test-user-123
TEST_USER_FIRST_NAME=Barry
TEST_USER_LAST_NAME=Test
TEST_USER_EMAIL=barry@example.com
```

**Note**: For the private key, use `\n` for newlines (not actual line breaks).

See `ENV_SETUP.md` for detailed configuration instructions.

## Step 4: Generate a Test Token

```bash
node generate-test-token.js
```

This will output something like:
```
═══════════════════════════════════════════════════════════
📋 YOUR MAVEN CHAT TOKEN (copy this):
═══════════════════════════════════════════════════════════

eyJhbGciOiJkaXIiLCJlbmMiOiJBMTI4Q0JDLUhTMjU2In0..abc123...xyz789
```

**Copy this token!**

## Step 5: Update Your App

Open `App.tsx` and replace the config:

```typescript
// Change from this (anonymous):
const MAVEN_CONFIG = {
  organizationId: 'mavenagi-apps',
  agentId: 'barry',
  signedUserData: null, // ❌ Anonymous mode
};

// To this (authenticated):
const MAVEN_CONFIG = {
  organizationId: 'your-actual-org-id',    // Your org ID
  agentId: 'your-actual-agent-id',         // Your agent ID
  signedUserData: 'eyJhbGciOiJka...xyz789', // ✅ Paste token here
};
```

## Step 6: Test It!

1. Reload the app (Cmd+R in simulator)
2. Open the chat
3. The chat should now recognize you as "Barry Test"

### How to Verify It's Working

The authenticated user experience includes:
- Chat greets you by name: "Hi Barry!"
- Your conversation is tied to your user ID
- Maven can access your user data in conversation context
- Conversations persist across sessions

## Production Implementation

⚠️ **NEVER generate tokens in the mobile app!**

In production, tokens should come from your secure backend:

```typescript
// In App.tsx
const [jwt, setJwt] = useState<string | null>(null);

useEffect(() => {
  // Fetch JWT from your backend API
  fetch('https://your-backend.com/api/maven/token', {
    headers: {
      'Authorization': `Bearer ${userAccessToken}`, // Your auth
    },
  })
    .then(res => res.json())
    .then(data => setJwt(data.mavenToken))
    .catch(err => console.error('Failed to fetch Maven token:', err));
}, []);

// Then use it:
<MavenChatWebView
  organizationId="your-org"
  agentId="your-agent"
  signedUserData={jwt} // Token from backend
/>
```

### Backend API Example (Node.js/Express)

```javascript
app.get('/api/maven/token', authenticate, async (req, res) => {
  const { generateMavenToken } = require('./maven-token-generator');
  
  const token = await generateMavenToken({
    id: req.user.id,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    email: req.user.email,
  });
  
  res.json({ mavenToken: token });
});
```

## Troubleshooting

### Token Generation Fails

- **"Invalid key format"**: Check that private key is complete PEM format
- **"Encryption failed"**: Ensure encryption secret is base64 encoded
- **Missing jose**: Run `npm install jose`

### Chat Doesn't Recognize User

- **Check token is not expired**: Tokens expire after 7 days (configurable)
- **Verify org/agent IDs match**: Must match your Maven configuration
- **Check public key uploaded**: Public key in Maven must match private key used

### "Authentication failed" in Chat

- **Public/private key mismatch**: Ensure you uploaded the correct public key to Maven
- **Wrong encryption secret**: Double-check the encryption secret in Maven settings
- **Expired token**: Generate a new token

## Token Security Best Practices

1. **Never commit private keys** to version control
2. **Store secrets in environment variables** (`.env` file, gitignored)
3. **Generate tokens server-side only** in production
4. **Use short expiration times** (1-7 days recommended)
5. **Rotate keys periodically** for enhanced security

## Additional User Data

You can include more fields in the token:

```javascript
const TEST_USER = {
  id: 'test-user-123',
  firstName: 'Barry',
  lastName: 'Test',
  email: 'barry@example.com',
  phone: '+1234567890',
  company: 'Acme Corp',
  role: 'developer',
  plan: 'premium',
  // Any custom fields your chat needs
};
```

Maven will have access to all these fields during conversations!
