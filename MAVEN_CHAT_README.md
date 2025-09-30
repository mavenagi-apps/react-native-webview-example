# Maven Chat Mobile Integration

Complete setup guide for integrating Maven AGI chat into your React Native mobile app.

## 🚀 Quick Start

Get up and running in 3 minutes:

```bash
# 1. Generate keys and secrets
node setup-maven-keys.js

# 2. Upload the PUBLIC KEY to Maven (see output)
#    Go to: https://agent.mavenagi.com → Apps → Chat → Settings

# 3. Update .env with your Maven IDs
#    Edit MAVEN_ORG_ID and MAVEN_AGENT_ID

# 4. Generate a test token
node generate-test-token.js

# 5. Copy token to App.tsx and run
npm run ios
```

## 📚 Documentation

| Guide | Description |
|-------|-------------|
| **TOKEN_GENERATION_QUICKSTART.md** | Quick reference for generating JWT tokens |
| **ENV_SETUP.md** | Detailed environment configuration guide |
| **AUTHENTICATED_USER_TESTING.md** | How to test with logged-in users |
| **MAVEN_CHAT_SETUP.md** | Architecture and integration details |
| **WEB_VS_MOBILE_COMPARISON.md** | Differences between web and mobile integration |

## 🛠️ Available Scripts

```bash
node setup-maven-keys.js     # Generate ES256 keys and encryption secret
node generate-test-token.js  # Generate JWT token for authenticated testing
npm run ios                  # Run iOS simulator
npm run android              # Run Android emulator
npm run start                # Start Metro bundler
```

## 🔑 Key Generation (Automated)

The `setup-maven-keys.js` script handles all key generation automatically:

**What it generates:**
- ✅ ES256 (P-256) public/private key pair
- ✅ Secure 256-bit encryption secret
- ✅ Formatted .env file

**What you do:**
1. Copy the PUBLIC KEY from output
2. Upload to Maven Agent Designer
3. Update org/agent IDs in .env

**Safety features:**
- Won't overwrite existing keys (use `--force` to regenerate)
- Private keys never leave your machine
- Keys are automatically gitignored

```bash
# First time setup
node setup-maven-keys.js

# Regenerate keys (invalidates old tokens)
node setup-maven-keys.js --force
```

## 🎫 Token Generation

After setting up keys, generate tokens for testing:

```bash
node generate-test-token.js
```

**Customizing test users:**
Edit `.env`:
```bash
TEST_USER_ID=barry-123
TEST_USER_FIRST_NAME=Barry
TEST_USER_LAST_NAME=Test
TEST_USER_EMAIL=barry@example.com
```

## 📱 Usage in App

### Anonymous Mode (Current)
```typescript
const MAVEN_CONFIG = {
  organizationId: 'mavenagi-apps',
  agentId: 'barry',
  signedUserData: null, // No authentication
};
```

### Authenticated Mode
```typescript
const MAVEN_CONFIG = {
  organizationId: 'your-org-id',
  agentId: 'your-agent-id',
  signedUserData: 'eyJhbGci...', // JWT from generate-token
};
```

### Production (Fetch from Backend)
```typescript
const [jwt, setJwt] = useState<string | null>(null);

useEffect(() => {
  fetch('https://your-api.com/maven/token', {
    headers: { Authorization: `Bearer ${userToken}` }
  })
    .then(res => res.json())
    .then(data => setJwt(data.mavenToken));
}, []);

<MavenChatWebView signedUserData={jwt} />
```

## 🏗️ Architecture

```
Mobile App
  └─> WebView (https://chat.onmaven.app/{org}/{agent})
       └─> postMessage API
            ├─> MAVEN_LOADED (from chat)
            ├─> SIGNED_USER_DATA (to chat - JWT token)
            ├─> UNSIGNED_USER_DATA (to chat - optional)
            └─> CUSTOM_DATA (to chat - optional)
```

## 🔐 Security

### ✅ DO
- Generate keys using `npm run setup-keys`
- Keep `.env` file local (it's gitignored)
- Generate tokens on secure backend in production
- Upload only PUBLIC key to Maven
- Rotate keys periodically

### ❌ DON'T
- Commit `.env` to version control
- Share your private key or encryption secret
- Generate tokens in the mobile app (production)
- Use same keys for dev and production
- Hardcode credentials in source code

## 🎨 Customization

### Custom Support Screen
The app includes a custom branded support interface (`CustomSupportScreen.tsx`) that wraps the Maven chat. Customize it to match your brand:

- **Colors**: Update styles in `CustomSupportScreen.tsx`
- **Actions**: Add custom quick actions (Knowledge Base, Email Support, etc.)
- **FAQs**: Add frequently asked questions that open chat with pre-filled messages

### Chat Configuration
Configure chat behavior in `MavenChatWebView.tsx`:
- **Auto-open**: Chat opens automatically when screen loads
- **Custom data**: Pass additional context with `customData` prop
- **Conversation tags**: Organize conversations with `tags` prop

## 🐛 Troubleshooting

### Keys Not Generating
```bash
# Check OpenSSL is installed
openssl version

# If not installed:
# macOS: Pre-installed
# Linux: sudo apt-get install openssl
# Windows: Download from https://slproweb.com/products/Win32OpenSSL.html
```

### Token Generation Fails
```bash
# Ensure .env exists and has correct format
cat .env

# Regenerate keys if needed
npm run setup-keys -- --force
```

### Chat Not Authenticating
1. Verify public key uploaded to Maven matches private key in .env
2. Check MAVEN_ORG_ID and MAVEN_AGENT_ID are correct
3. Ensure token hasn't expired (default: 7 days)
4. Try generating a fresh token: `npm run generate-token`

### "Missing required environment variables"
```bash
# Run setup to create .env
npm run setup-keys

# Or manually create from template
cp .env.example .env
```

## 📦 Components

| File | Purpose |
|------|---------|
| `App.tsx` | Main app with modal trigger |
| `CustomSupportScreen.tsx` | Branded support interface |
| `MavenChatWebView.tsx` | WebView wrapper for Maven chat |
| `generate-test-token.js` | JWT token generator |
| `setup-maven-keys.js` | Automated key generation |

## 🌐 Production Deployment

For production, **never generate tokens in the mobile app**. 

### Backend API Setup (Node.js)
```javascript
const { generateMavenToken } = require('./maven-token-generator');

app.get('/api/maven/token', authenticate, async (req, res) => {
  const token = await generateMavenToken({
    id: req.user.id,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    email: req.user.email,
  });
  
  res.json({ mavenToken: token });
});
```

### Mobile App
```typescript
const token = await fetchMavenToken(userAccessToken);
<MavenChatWebView signedUserData={token} />
```

## 🔄 Key Rotation

When rotating keys:

```bash
# 1. Generate new keys
node setup-maven-keys.js --force

# 2. Copy new PUBLIC KEY from output

# 3. Update Maven Agent Designer with new public key

# 4. Deploy backend with new private key

# 5. Old tokens become invalid; users get new tokens on next login
```

## 📖 Additional Resources

- **Maven Documentation**: https://docs.mavenagi.com
- **Agent Designer**: https://agent.mavenagi.com
- **ES256 Key Info**: https://en.wikipedia.org/wiki/Elliptic_Curve_Digital_Signature_Algorithm
- **JWT Tokens**: https://jwt.io

## ❓ Getting Help

1. Check the troubleshooting section above
2. Review the detailed guides in the docs folder
3. Visit Maven documentation
4. Contact Maven support

## 📝 License

This is example/starter code for integrating Maven Chat. Customize as needed for your app.
