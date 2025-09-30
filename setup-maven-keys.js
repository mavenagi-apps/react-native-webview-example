#!/usr/bin/env node
/**
 * Maven Chat All-in-One Setup
 * 
 * This script:
 * 1. Initializes .env from .env.example if it doesn't exist
 * 2. Generates ES256 (P-256) key pair and encryption secret (--force only)
 * 3. Generates JWT token (if all required values are present)
 * 4. Generates maven-config.js for React Native import
 * 5. Reports what configuration is missing
 * 
 * Usage:
 *   node setup-maven-keys.js        # Check config and generate JWT
 *   node setup-maven-keys.js --force # Regenerate keys + encryption secret + JWT
 * 
 * Output files:
 *   .env               - Your configuration (gitignored)
 *   maven-config.js    - Safe values for React Native (gitignored)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ENV_EXAMPLE_FILE = path.join(__dirname, '.env.example');
const ENV_FILE = path.join(__dirname, '.env');
const CONFIG_FILE = path.join(__dirname, 'maven-config.js');

// Load jose for JWT generation
let jose;
try {
  jose = require('jose');
} catch (error) {
  console.error('\n❌ ERROR: jose module not found!');
  console.error('Please install it: npm install jose\n');
  process.exit(1);
}

// ANSI colors for pretty output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkOpenSSL() {
  try {
    execSync('openssl version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    log('\n❌ ERROR: OpenSSL is not installed or not in PATH', 'yellow');
    log('\nInstallation instructions:', 'bright');
    log('  macOS:   OpenSSL should be pre-installed');
    log('  Linux:   sudo apt-get install openssl');
    log('  Windows: Download from https://slproweb.com/products/Win32OpenSSL.html\n');
    return false;
  }
}

function generateES256KeyPair() {
  log('\n🔑 Generating ES256 (P-256) key pair...', 'cyan');
  
  try {
    // Generate private key
    const privateKey = execSync(
      'openssl ecparam -name prime256v1 -genkey -noout',
      { encoding: 'utf8' }
    );
    
    // Generate public key from private key
    // Save private key to temp file first
    const tempPrivateKeyFile = path.join(__dirname, '.temp_private_key.pem');
    fs.writeFileSync(tempPrivateKeyFile, privateKey);
    
    const publicKey = execSync(
      `openssl ec -in "${tempPrivateKeyFile}" -pubout`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
    
    // Clean up temp file
    fs.unlinkSync(tempPrivateKeyFile);
    
    log('✅ Key pair generated successfully', 'green');
    
    return {
      privateKey: privateKey.trim(),
      publicKey: publicKey.trim(),
    };
  } catch (error) {
    log(`\n❌ ERROR: Failed to generate keys: ${error.message}`, 'yellow');
    process.exit(1);
  }
}

function generateEncryptionSecret() {
  log('🔒 Generating encryption secret...', 'cyan');
  
  // Generate 32 random bytes and encode as base64
  // This is suitable for A128CBC-HS256 encryption (needs 32 bytes)
  const secret = crypto.randomBytes(32).toString('base64');
  
  log('✅ Encryption secret generated', 'green');
  return secret;
}

async function generateJWTToken(privateKey, encryptionSecret, userData) {
  log('\n🎫 Generating JWT token...', 'cyan');
  
  try {
    // Step 1: Sign the user data with ES256
    const privateKeyObj = crypto.createPrivateKey({
      key: privateKey,
      format: 'pem',
    });

    const signedJWT = await new jose.SignJWT(userData)
      .setProtectedHeader({ alg: 'ES256' })
      .setIssuedAt()
      .setExpirationTime('7d') // Token valid for 7 days
      .sign(privateKeyObj);

    // Step 2: Encrypt the signed JWT with A128CBC-HS256
    const encryptionKey = Buffer.from(encryptionSecret, 'base64');

    const encryptedJWT = await new jose.EncryptJWT({ jwt: signedJWT })
      .setProtectedHeader({ alg: 'dir', enc: 'A128CBC-HS256' })
      .encrypt(encryptionKey);

    log('✅ JWT token generated', 'green');
    return encryptedJWT;
  } catch (error) {
    log(`\n❌ ERROR: Failed to generate JWT token: ${error.message}`, 'yellow');
    throw error;
  }
}

function initializeEnvFile() {
  if (!fs.existsSync(ENV_FILE)) {
    if (!fs.existsSync(ENV_EXAMPLE_FILE)) {
      log('❌ ERROR: .env.example not found!', 'yellow');
      process.exit(1);
    }
    log('📋 Creating .env from .env.example...', 'cyan');
    fs.copyFileSync(ENV_EXAMPLE_FILE, ENV_FILE);
    log('✅ .env file created\n', 'green');
  }
}

function loadExistingEnv() {
  if (!fs.existsSync(ENV_FILE)) {
    return {};
  }
  
  const envContent = fs.readFileSync(ENV_FILE, 'utf8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts.join('=').trim();
    }
  });
  
  return env;
}

function formatPrivateKeyForEnv(privateKey) {
  // Replace actual newlines with \n for .env file format
  return privateKey.replace(/\n/g, '\\n');
}

function writeEnvFile(config) {
  log('\n📝 Writing configuration to .env...', 'cyan');
  
  // Read existing .env if it exists
  let template = '';
  if (fs.existsSync(ENV_FILE)) {
    template = fs.readFileSync(ENV_FILE, 'utf8');
  }
  
  // Update or add values
  const lines = template ? template.split('\n') : [];
  const output = [];
  const updatedKeys = new Set();
  
  // Process existing lines
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      output.push(line);
      continue;
    }
    
    const [key] = trimmed.split('=');
    const trimmedKey = key.trim();
    
    if (config.hasOwnProperty(trimmedKey)) {
      output.push(`${trimmedKey}=${config[trimmedKey]}`);
      updatedKeys.add(trimmedKey);
    } else {
      output.push(line);
    }
  }
  
  // Add any keys that weren't in the existing file
  for (const [key, value] of Object.entries(config)) {
    if (!updatedKeys.has(key)) {
      output.push(`${key}=${value}`);
    }
  }
  
  fs.writeFileSync(ENV_FILE, output.join('\n') + '\n');
  log('✅ .env file updated', 'green');
}

function generateConfigFile(config) {
  log('\n📝 Generating maven-config.js...', 'cyan');
  
  const configContent = `// maven-config.js
// Auto-generated by setup-maven-keys.js - DO NOT EDIT MANUALLY
// Contains only public values safe for app bundle

export const MAVEN_CONFIG = {
  organizationId: '${config.MAVEN_ORG_ID || ''}',
  agentId: '${config.MAVEN_AGENT_ID || ''}',
  signedUserData: ${config.MAVEN_JWT_TOKEN ? `'${config.MAVEN_JWT_TOKEN}'` : 'null'},
};
`;
  
  fs.writeFileSync(CONFIG_FILE, configContent);
  log('✅ maven-config.js generated', 'green');
}

function displayPublicKey(publicKey, encryptionSecret) {
  log('\n' + '═'.repeat(70), 'blue');
  log('📋 MAVEN AGENT DESIGNER CONFIGURATION', 'bright');
  log('═'.repeat(70), 'blue');
  
  log('\n🔑 PUBLIC KEY:', 'bright');
  log('Copy this to the "JWT Public Key" field\n', 'cyan');
  log(publicKey, 'cyan');
  
  log('\n🔐 ENCRYPTION SECRET:', 'bright');
  log('Copy this to the "Encryption secret" field\n', 'yellow');
  log(encryptionSecret, 'yellow');
  
  log('\n' + '═'.repeat(70), 'blue');
  
  log('\n📌 CRITICAL: Configure BOTH values in Maven Agent Designer:', 'bright');
  log('1. Go to: https://agent.mavenagi.com', 'bright');
  log('2. Navigate to: Apps → Chat → Settings → Advanced Settings');
  log('3. Paste PUBLIC KEY (above) into "JWT Public Key" field');
  log('4. Paste ENCRYPTION SECRET (above) into "Encryption secret" field');
  log('5. Save the configuration');
  log('\n⚠️  Without both values, users will appear as anonymous!\n', 'yellow');
}

async function main() {
  log('\n' + '='.repeat(70), 'bright');
  log('🚀 Maven Chat Setup', 'bright');
  log('='.repeat(70) + '\n', 'bright');
  
  // Check prerequisites
  if (!checkOpenSSL()) {
    process.exit(1);
  }
  
  // Initialize .env from .env.example if it doesn't exist
  initializeEnvFile();
  
  // Load existing configuration
  const existingEnv = loadExistingEnv();
  const config = { ...existingEnv };
  
  // Check what's missing
  const isEmpty = (value) => !value || value.trim() === '';
  const missingKeys = isEmpty(config.MAVEN_PRIVATE_KEY);
  const missingSecret = isEmpty(config.MAVEN_ENCRYPTION_SECRET);
  const missingOrgId = isEmpty(config.MAVEN_ORG_ID);
  const missingAgentId = isEmpty(config.MAVEN_AGENT_ID);
  const missingUserId = isEmpty(config.TEST_USER_ID);
  const missingUserFirstName = isEmpty(config.TEST_USER_FIRST_NAME);
  const missingUserLastName = isEmpty(config.TEST_USER_LAST_NAME);
  const missingUserEmail = isEmpty(config.TEST_USER_EMAIL);
  
  let privateKey, publicKey, encryptionSecret;
  let keysGenerated = false;
  
  // Generate keys and encryption secret if --force or if they're missing
  const forceRegenerate = process.argv.includes('--force');
  
  if (forceRegenerate) {
    log('🔄 --force flag detected, regenerating keys and encryption secret...\n', 'yellow');
    
    // Generate new keys
    const keyPair = generateES256KeyPair();
    privateKey = keyPair.privateKey;
    publicKey = keyPair.publicKey;
    encryptionSecret = generateEncryptionSecret();
    
    // Format and store keys
    config.MAVEN_PRIVATE_KEY = formatPrivateKeyForEnv(privateKey);
    config.MAVEN_PUBLIC_KEY = formatPrivateKeyForEnv(publicKey);
    config.MAVEN_ENCRYPTION_SECRET = encryptionSecret;
    keysGenerated = true;
  } else if (missingKeys || missingSecret) {
    log('⚠️  Missing cryptographic keys or encryption secret', 'yellow');
    log('   Run with --force to generate: node setup-maven-keys.js --force\n', 'cyan');
  } else {
    log('✅ Keys and encryption secret found in .env\n', 'green');
    
    // Extract public key from existing private key
    try {
      const tempPrivateKeyFile = path.join(__dirname, '.temp_private_key.pem');
      const formattedKey = config.MAVEN_PRIVATE_KEY.replace(/\\n/g, '\n');
      fs.writeFileSync(tempPrivateKeyFile, formattedKey);
      
      publicKey = execSync(
        `openssl ec -in "${tempPrivateKeyFile}" -pubout`,
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
      ).trim();
      
      fs.unlinkSync(tempPrivateKeyFile);
      
      // Use existing keys
      privateKey = formattedKey;
      encryptionSecret = config.MAVEN_ENCRYPTION_SECRET;
      
      // Store public key in config if not already there
      if (!config.MAVEN_PUBLIC_KEY) {
        config.MAVEN_PUBLIC_KEY = formatPrivateKeyForEnv(publicKey);
      }
    } catch (error) {
      log('⚠️  Could not extract public key from existing private key', 'yellow');
    }
  }
  
  // Generate JWT token only if all required values are present
  const canGenerateToken = privateKey && encryptionSecret && 
                          !missingOrgId && !missingAgentId &&
                          !missingUserId && !missingUserFirstName && 
                          !missingUserLastName && !missingUserEmail;
  
  if (canGenerateToken) {
    const userData = {
      id: config.TEST_USER_ID,
      firstName: config.TEST_USER_FIRST_NAME,
      lastName: config.TEST_USER_LAST_NAME,
      email: config.TEST_USER_EMAIL,
    };
    
    try {
      const jwtToken = await generateJWTToken(privateKey, encryptionSecret, userData);
      config.MAVEN_JWT_TOKEN = jwtToken;
      log('✅ JWT token generated\n', 'green');
    } catch (error) {
      log('❌ Failed to generate JWT token\n', 'yellow');
    }
  } else if (!missingKeys && !missingSecret) {
    log('⚠️  Cannot generate JWT token - missing required configuration\n', 'yellow');
  }
  
  // Write to .env file if anything changed
  if (keysGenerated || canGenerateToken) {
    writeEnvFile(config);
  }
  
  // Generate maven-config.js for React Native
  generateConfigFile(config);
  
  // Display public key and encryption secret for Agent Designer if keys were generated
  if (keysGenerated && publicKey && encryptionSecret) {
    displayPublicKey(publicKey, encryptionSecret);
  }
  
  log('\n' + '='.repeat(70), 'bright');
  log('📋 CONFIGURATION STATUS', 'bright');
  log('='.repeat(70) + '\n', 'bright');
  
  // Report status
  const missing = [];
  if (missingKeys) missing.push('MAVEN_PRIVATE_KEY');
  if (!config.MAVEN_PUBLIC_KEY || isEmpty(config.MAVEN_PUBLIC_KEY)) missing.push('MAVEN_PUBLIC_KEY');
  if (missingSecret) missing.push('MAVEN_ENCRYPTION_SECRET');
  if (missingOrgId) missing.push('MAVEN_ORG_ID');
  if (missingAgentId) missing.push('MAVEN_AGENT_ID');
  if (missingUserId) missing.push('TEST_USER_ID');
  if (missingUserFirstName) missing.push('TEST_USER_FIRST_NAME');
  if (missingUserLastName) missing.push('TEST_USER_LAST_NAME');
  if (missingUserEmail) missing.push('TEST_USER_EMAIL');
  
  if (missing.length > 0) {
    log('❌ Missing configuration:', 'yellow');
    missing.forEach(key => {
      log(`   • ${key}`, 'yellow');
    });
    log('\nNext steps:', 'bright');
    
    if (missingKeys || missingSecret) {
      log('1. Generate keys: node setup-maven-keys.js --force');
      log('2. Copy PUBLIC KEY and ENCRYPTION SECRET to Agent Designer');
      log('   (Settings → Apps → Chat → Security)');
    }
    
    if (missingOrgId || missingAgentId) {
      log('3. Edit .env and set MAVEN_ORG_ID and MAVEN_AGENT_ID');
      log('   Get these from: https://agent.mavenagi.com → Apps → Chat');
    }
    
    if (missingUserId || missingUserFirstName || missingUserLastName || missingUserEmail) {
      log('4. Edit .env and set TEST_USER_* values for JWT token generation');
    }
    
    log('5. Run again: node setup-maven-keys.js\n');
  } else {
    log('✅ All configuration complete!', 'green');
    log('\nYour app is ready to run:', 'bright');
    log('  npm run ios    # iOS simulator');
    log('  npm run android # Android emulator\n');
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { generateES256KeyPair, generateEncryptionSecret, generateJWTToken };
