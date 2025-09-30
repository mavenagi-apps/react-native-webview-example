# Environment Configuration Setup

This guide explains how to securely configure Maven Chat credentials using environment variables.

## Why Use Environment Variables?

✅ **Security**: Keeps secrets out of source code
✅ **Flexibility**: Easy to change credentials without modifying code
✅ **Best Practice**: Industry standard for managing sensitive configuration
✅ **Git Safe**: `.env` is automatically ignored by git

## Quick Setup (Automated - Recommended)

### 1. Run the automated setup

```bash
node setup-maven-keys.js
```

This will:
- Generate ES256 public/private key pair
- Create a secure encryption secret
- Create/update your .env file
- Display the public key to upload to Maven

### 2. Upload public key to Maven

Copy the public key from the script output and:
- Go to https://agent.mavenagi.com
- Navigate to **Apps** → **Chat** → **Settings**
- Paste the PUBLIC KEY in "JWT Public Key" field
- Save

### 3. Update organization and agent IDs

Edit `.env` and add your Maven organization and agent IDs:
```bash
MAVEN_ORG_ID=your-actual-org-id
MAVEN_AGENT_ID=your-actual-agent-id
```

Done! You can now generate tokens with `node generate-test-token.js`.

## Manual Setup (Alternative)

### 1. Copy the template

```bash
cp .env.example .env
```

### 2. Get your Maven credentials

Go to [Maven Agent Designer](https://agent.mavenagi.com):
1. Navigate to **Apps** → **Chat** → **Settings**
2. Note your **Organization ID** and **Agent ID**
3. Generate or copy your **ES256 Private Key**
4. Copy your **Encryption Secret** (base64 encoded)

### 3. Edit the .env file

Open `.env` and replace the placeholder values:

```bash
# Your Maven organization and agent
MAVEN_ORG_ID=mavenagi-apps
MAVEN_AGENT_ID=barry

# ES256 Private Key (use \n for newlines)
MAVEN_PRIVATE_KEY=-----BEGIN EC PRIVATE KEY-----\nMHcCAQEEIJ...(your key)...\n-----END EC PRIVATE KEY-----

# Encryption Secret (base64)
MAVEN_ENCRYPTION_SECRET=abcd1234efgh5678...

# Test user details
TEST_USER_ID=barry-123
TEST_USER_FIRST_NAME=Barry
TEST_USER_LAST_NAME=Test
TEST_USER_EMAIL=barry@example.com
```

**Important**: For `MAVEN_PRIVATE_KEY`, replace actual newlines with `\n`

Example:
```
# Multi-line key in PEM format:
-----BEGIN EC PRIVATE KEY-----
MHcCAQEEIJ1234567890...
abcdefghijklmnop...
-----END EC PRIVATE KEY-----

# Becomes in .env (single line with \n):
MAVEN_PRIVATE_KEY=-----BEGIN EC PRIVATE KEY-----\nMHcCAQEEIJ1234567890...\nabcdefghijklmnop...\n-----END EC PRIVATE KEY-----
```

### 4. Generate a test token

```bash
node generate-test-token.js
```

This will:
- Load credentials from `.env`
- Generate a JWT token for your test user
- Output the token to copy into your app

### 5. Use in your app

The `generate-test-token.js` script will output a token. Copy it and paste into `App.tsx`:

```typescript
const MAVEN_CONFIG = {
  organizationId: 'your-org-id', // Or use process.env in a real app
  agentId: 'your-agent-id',
  signedUserData: 'eyJhbGci...PASTE_TOKEN_HERE',
};
```

## What's in the .env File?

| Variable | Description | Example |
|----------|-------------|---------|
| `MAVEN_ORG_ID` | Your Maven organization ID | `mavenagi-apps` |
| `MAVEN_AGENT_ID` | Your agent ID | `barry` |
| `MAVEN_PRIVATE_KEY` | ES256 private key (PEM format with `\n`) | `-----BEGIN EC PRIVATE KEY-----\n...` |
| `MAVEN_ENCRYPTION_SECRET` | Base64 encryption secret | `abcd1234...` |
| `TEST_USER_ID` | Test user's unique ID | `test-user-123` |
| `TEST_USER_FIRST_NAME` | Test user's first name | `Barry` |
| `TEST_USER_LAST_NAME` | Test user's last name | `Test` |
| `TEST_USER_EMAIL` | Test user's email | `barry@example.com` |

## Security Best Practices

### ✅ DO

- Keep `.env` file local (never commit it)
- Use different credentials for dev/staging/production
- Rotate keys periodically
- Use environment-specific `.env` files if needed

### ❌ DON'T

- Commit `.env` to version control (it's in `.gitignore`)
- Share your private key or encryption secret
- Hardcode secrets in source code
- Use production keys for testing

## Troubleshooting

### "Missing required environment variables"

- Make sure you created `.env` (not just `.env.example`)
- Check that all required variables are set
- Verify there are no typos in variable names

### "Invalid key format"

- Ensure `MAVEN_PRIVATE_KEY` uses `\n` for newlines (not actual newlines)
- Check the key is complete with BEGIN and END markers
- Verify it's an ES256 (P-256) key, not RSA

### "Encryption failed"

- Confirm `MAVEN_ENCRYPTION_SECRET` is base64 encoded
- Check there are no extra spaces or newlines
- Verify the secret matches what's in Maven Agent Designer

### Token generation fails

- Make sure you ran `npm install dotenv jose`
- Verify your Node.js version is >= 20
- Check that the `.env` file is in the same directory as `generate-test-token.js`

## Advanced: Multiple Environments

For different environments (dev, staging, prod), create separate env files:

```bash
.env.development
.env.staging
.env.production
```

Load specific environment:

```bash
# Development
node -r dotenv/config setup-maven-keys.js dotenv_config_path=.env.development
node -r dotenv/config generate-test-token.js dotenv_config_path=.env.development

# Production
node -r dotenv/config setup-maven-keys.js dotenv_config_path=.env.production
node -r dotenv/config generate-test-token.js dotenv_config_path=.env.production
```

## Alternative: JSON Config

If you prefer JSON format, you can also use `maven-config.json`:

```json
{
  "organizationId": "your-org-id",
  "agentId": "your-agent-id",
  "privateKey": "-----BEGIN EC PRIVATE KEY-----\n...",
  "encryptionSecret": "your-secret",
  "testUser": {
    "id": "test-user-123",
    "firstName": "Barry",
    "lastName": "Test",
    "email": "barry@example.com"
  }
}
```

Then load it in your script:
```javascript
const config = require('./maven-config.json');
```

(This file is also gitignored for security)

## Uploading Public Key to Maven Agent Designer

After running `npm run setup-keys`, you need to upload the public key to Maven:

### Step-by-Step with Screenshots

**1. Copy the Public Key**
The setup script outputs:
```
═══════════════════════════════════════════════════════════
📋 PUBLIC KEY - Upload this to Maven Agent Designer
═══════════════════════════════════════════════════════════

-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...
-----END PUBLIC KEY-----
```

Copy everything from `-----BEGIN PUBLIC KEY-----` to `-----END PUBLIC KEY-----` (inclusive).

**2. Open Maven Agent Designer**
- Navigate to https://agent.mavenagi.com
- Log in to your account

**3. Go to Chat App Settings**
- Click **Apps** in the left sidebar
- Find the **Chat** app (install it if you haven't)
- Click on the Chat app to open it
- Click **Settings** tab

**4. Paste Public Key**
- Find the field labeled **"JWT Public Key"** or **"Public Key"**
- Paste your copied public key
- Click **Save** or **Update**

**5. Get Your IDs**
While you're in the Chat app settings, note:
- **Organization ID**: Usually shown in the URL or settings
- **Agent ID**: The ID of the agent this chat is for

**6. Update .env**
```bash
MAVEN_ORG_ID=your-org-id-from-maven
MAVEN_AGENT_ID=your-agent-id-from-maven
```

### Important Notes

- **Keep Private Key Secret**: Never share or upload the private key (it stays in .env)
- **Only Upload Public Key**: Maven only needs the public key for verification
- **Keys are Linked**: The public key on Maven must match the private key in your .env
- **Multiple Agents**: You can use the same key pair for multiple agents in your organization

### What Maven Does with the Public Key

Maven uses the public key to:
1. Verify that JWT tokens were signed by your private key
2. Decrypt the user data in the token
3. Authenticate the user in chat conversations
4. Ensure tokens weren't tampered with

## Need Help?

- Check `AUTHENTICATED_USER_TESTING.md` for full testing guide
- See `generate-test-token.js` for the token generation script
- See `setup-maven-keys.js` for automated key generation
- Visit [Maven Documentation](https://docs.mavenagi.com) for more info
