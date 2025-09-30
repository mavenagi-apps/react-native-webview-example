# Token Generation Quick Start

**Generate JWT tokens for testing Maven Chat with authenticated users**

## TL;DR (Automated Setup)

```bash
# 1. Generate keys automatically
node setup-maven-keys.js

# 2. Copy the PUBLIC KEY from output and upload to Maven Agent Designer
#    (Apps → Chat → Settings → JWT Public Key)

# 3. Update MAVEN_ORG_ID and MAVEN_AGENT_ID in .env

# 4. Generate token
node generate-test-token.js

# 5. Copy the token output and paste into App.tsx
```

## Alternative: Manual Setup

```bash
# 1. Copy template
cp .env.example .env

# 2. Edit .env with your Maven credentials (see below)

# 3. Generate token
node generate-test-token.js

# 4. Copy the token output and paste into App.tsx
```

## Automated Key Generation (Recommended)

### What It Does
The `setup-maven-keys.js` script automatically:
- ✅ Generates ES256 (P-256) public/private key pair using OpenSSL
- ✅ Creates a secure encryption secret
- ✅ Updates your .env file with the keys
- ✅ Displays the public key to upload to Maven

### Step-by-Step

**1. Run the setup script:**
```bash
node setup-maven-keys.js
```

**2. Copy the PUBLIC KEY from the output:**
```
═══════════════════════════════════════════════════════════
📋 PUBLIC KEY - Upload this to Maven Agent Designer
═══════════════════════════════════════════════════════════

-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...
-----END PUBLIC KEY-----
```

**3. Upload to Maven Agent Designer:**
- Visit https://agent.mavenagi.com
- Go to **Apps** → **Chat** → **Settings**
- Paste the PUBLIC KEY in the "JWT Public Key" field
- Note your **Organization ID** and **Agent ID**
- Click Save

**4. Update your .env file:**
```bash
# Edit .env and update these values:
MAVEN_ORG_ID=your-actual-org-id
MAVEN_AGENT_ID=your-actual-agent-id
```

**5. Generate a token:**
```bash
node generate-test-token.js
```

Done! The private key and encryption secret are already in your .env file.

### Regenerating Keys

If you need to regenerate keys (this will invalidate existing tokens):
```bash
node setup-maven-keys.js --force
```

## Manual Setup (Alternative)

### Step 1: Get Maven Credentials

Visit: https://agent.mavenagi.com

1. **Apps** → **Chat** → **Settings**
2. Note your **Organization ID** and **Agent ID**
3. Generate/copy your **ES256 Private Key** (PEM format)
4. Copy your **Encryption Secret** (base64 string)

## Step 2: Configure .env

```bash
cp .env.example .env
```

Edit `.env`:

```bash
MAVEN_ORG_ID=your-org-id
MAVEN_AGENT_ID=your-agent-id

# Important: Use \n for newlines in the private key
MAVEN_PRIVATE_KEY=-----BEGIN EC PRIVATE KEY-----\nMHcCAQEE...\n-----END EC PRIVATE KEY-----

MAVEN_ENCRYPTION_SECRET=your-base64-secret

# Customize test user
TEST_USER_ID=barry-123
TEST_USER_FIRST_NAME=Barry
TEST_USER_LAST_NAME=Test
TEST_USER_EMAIL=barry@example.com
```

**Private Key Format**:
- Replace actual newlines with `\n`
- Keep it as one continuous line
- Include the BEGIN and END markers

## Step 3: Generate Token

```bash
node generate-test-token.js
```

Output:
```
═══════════════════════════════════════════════════════════
📋 YOUR MAVEN CHAT TOKEN (copy this):
═══════════════════════════════════════════════════════════

eyJhbGciOiJkaXIiLCJlbmMiOiJBMTI4Q0JDLUhTMjU2In0...[long string]
```

**Copy the entire token!**

## Step 4: Use in App

Open `App.tsx`:

```typescript
const MAVEN_CONFIG = {
  organizationId: 'your-org-id',    // From .env
  agentId: 'your-agent-id',         // From .env
  signedUserData: 'eyJhbGci...',    // Paste token here
};
```

## Step 5: Test

```bash
# Reload the app
npm run ios
# or press Cmd+R in simulator
```

The chat should now:
- ✅ Greet you by name ("Hi Barry!")
- ✅ Remember your conversation history
- ✅ Have access to your user profile

## What Changed?

| Before | After |
|--------|-------|
| Hardcoded credentials in code | Secure .env file |
| Manual editing of JS file | Configure once, use many times |
| Risk of committing secrets | .env is gitignored |
| Edit code for each user | Just edit .env values |

## Troubleshooting

### "Missing required environment variables"
→ Create `.env` file: `cp .env.example .env`

### "Invalid key format"
→ Use `\n` for newlines (not actual line breaks) in `MAVEN_PRIVATE_KEY`

### "Encryption failed"
→ Check `MAVEN_ENCRYPTION_SECRET` is the exact base64 string from Maven

### Token doesn't work in app
→ Verify `organizationId` and `agentId` in App.tsx match your .env values

## Scripts

| Command | Description |
|---------|-------------|
| `node setup-maven-keys.js` | Generate ES256 keys and encryption secret |
| `node generate-test-token.js` | Generate a new JWT token |
| `npm run ios` | Run iOS simulator |
| `npm run android` | Run Android emulator |
| `npm start` | Start Metro bundler |

## Security Notes

- ✅ `.env` is in `.gitignore` (never committed)
- ✅ Keep your private key secret
- ✅ Don't share your encryption secret
- ✅ Tokens expire after 7 days by default
- ⚠️ This is for testing only - production tokens should come from your secure backend

## Production Usage

In production, **never generate tokens in the mobile app**. Instead:

```typescript
// Fetch token from your backend
const response = await fetch('https://your-api.com/maven/token', {
  headers: { Authorization: `Bearer ${userToken}` }
});
const { mavenToken } = await response.json();

// Use it
<MavenChatWebView signedUserData={mavenToken} />
```

## More Help

- **`ENV_SETUP.md`** - Detailed environment configuration guide
- **`AUTHENTICATED_USER_TESTING.md`** - Complete testing guide
- **`generate-test-token.js`** - Token generator source code
- **Maven Docs** - https://docs.mavenagi.com
