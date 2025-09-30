# Web Widget vs Mobile Integration - Quick Comparison

## Side-by-Side Comparison

### Web Widget Installation
```html
<!-- Step 1: Load widget script -->
<script src='https://chat.onmaven.app/js/widget.js' defer></script>

<!-- Step 2: Initialize widget -->
<script>
addEventListener("load", function () {
  Maven.ChatWidget.load({
    organizationId: "mavenagi-apps",
    agentId: "barry",
    signedUserData: "jwt-token-here", // Optional
    bgColor: "#6C2BD9",
    horizontalPosition: "right",
    verticalPosition: "bottom"
  });
});
</script>
```

**What happens:**
1. `widget.js` loads and exposes `Maven.ChatWidget` global
2. Script creates a floating button (positioned via config)
3. Script creates an iframe: `https://chat.onmaven.app/{orgId}/{agentId}`
4. Button click opens/closes the iframe
5. Widget uses `postMessage` to send auth data to iframe

---

### Mobile (React Native) Integration
```typescript
// Step 1: Import WebView component
import MavenChatWebView from './MavenChatWebView';

// Step 2: Render directly (no script loading)
<Modal visible={isChatOpen}>
  <MavenChatWebView
    organizationId="mavenagi-apps"
    agentId="barry"
    signedUserData={jwt}  // Optional
  />
</Modal>
```

**What happens:**
1. You create your own button/trigger
2. WebView loads iframe directly: `https://chat.onmaven.app/{orgId}/{agentId}`
3. WebView uses `postMessage` bridge to send auth data to iframe
4. Modal handles open/close (no widget.js needed)

---

## Architecture Mapping

| Layer | Web | Mobile | Notes |
|-------|-----|--------|-------|
| **User Trigger** | Widget-generated button | Custom button/trigger | You control the UI |
| **Loader** | `<script src="widget.js">` | Direct WebView | Skip the script |
| **Container** | iframe (auto-created) | WebView component | Same underlying tech |
| **URL** | `https://chat.onmaven.app/{orgId}/{agentId}` | Same URL | Identical |
| **Communication** | Browser postMessage | RN WebView postMessage | Same protocol |
| **Positioning** | CSS (via config) | Modal/View styling | You control layout |
| **Auth Data** | Via postMessage | Via postMessage | Same flow |

---

## Configuration Mapping

### Web Widget Config
```typescript
Maven.ChatWidget.load({
  organizationId: "mavenagi-apps",    // ✅ Same
  agentId: "barry",                   // ✅ Same
  signedUserData: "jwt",              // ✅ Same
  unsignedUserData: {...},            // ✅ Same
  bgColor: "#6C2BD9",                 // ❌ Handle in your UI
  textColor: "white",                 // ❌ Handle in your UI
  horizontalPosition: "right",        // ❌ Use Modal positioning
  verticalPosition: "bottom",         // ❌ Use Modal positioning
  buttonLabel: "Get Help",            // ❌ Use your own button
  hideButton: false,                  // ❌ Control visibility yourself
})
```

### Mobile Component Props
```typescript
<MavenChatWebView
  organizationId="mavenagi-apps"     // ✅ Direct mapping
  agentId="barry"                    // ✅ Direct mapping
  signedUserData={jwt}               // ✅ Direct mapping
  unsignedUserData={{...}}           // ✅ Direct mapping
  customData={{...}}                 // ➕ Additional prop
  tags={['mobile']}                  // ➕ Additional prop
/>

{/* Positioning handled by Modal/View */}
<Modal 
  visible={open}
  animationType="slide"
  presentationStyle="pageSheet"
>
  {/* Button styled however you want */}
  <Button title="Chat" onPress={...} />
</Modal>
```

---

## JWT Authentication Flow

Both web and mobile use **identical JWT authentication**:

### 1. Backend Generates JWT
```typescript
// ✅ Same for both web and mobile
const signedJWT = await new SignJWT(userData)
  .setProtectedHeader({ alg: 'ES256' })
  .setIssuedAt()
  .setExpirationTime('1h')
  .sign(privateKey);

const encryptedJWT = await new EncryptJWT({ jwt: signedJWT })
  .setProtectedHeader({ alg: 'dir', enc: 'A128CBC-HS256' })
  .encrypt(secretKey);
```

### 2. Frontend Receives JWT
```typescript
// Web
const response = await fetch('/api/maven/token');
const { mavenToken } = await response.json();
Maven.ChatWidget.load({ signedUserData: mavenToken });

// Mobile
const response = await fetch('https://api.example.com/maven/token');
const { mavenToken } = await response.json();
setJwt(mavenToken); // Pass to <MavenChatWebView />
```

### 3. postMessage to Chat
```typescript
// Web (widget.js handles this)
iframe.postMessage({
  type: 'SIGNED_USER_DATA',
  data: signedUserData
}, '*');

// Mobile (MavenChatWebView handles this)
webViewRef.current.postMessage(JSON.stringify({
  type: 'SIGNED_USER_DATA',
  data: signedUserData
}));
```

### 4. Chat Validates & Authenticates
```
✅ Identical on both platforms:
1. Chat receives postMessage
2. Decrypts JWT with encryption secret
3. Verifies signature with public key
4. Creates/updates Maven user
5. Starts authenticated conversation
```

---

## Key Insights

### What's the Same ✅
- Chat iframe URL
- JWT generation process
- Message protocol (postMessage)
- Authentication flow
- User data requirements
- Maven backend APIs

### What's Different 🔄
- **Loading mechanism**: Script tag vs WebView component
- **Button creation**: Widget creates it vs you create it
- **Styling/positioning**: CSS config vs React Native styles
- **Container**: Browser iframe vs WebView component
- **Lifecycle**: Widget manages it vs you manage it

---

## Migration Path: Web → Mobile

If you already have web chat working:

1. **Reuse your backend** (JWT generation) - no changes needed!
2. **Use same org/agent IDs** - configuration is identical
3. **Copy JWT endpoint** - mobile app calls same API
4. **Skip widget.js** - load iframe directly in WebView
5. **Create your UI** - button, modal, styling

Example:
```typescript
// Web: widget.js creates button
Maven.ChatWidget.load({...});

// Mobile: you create button
<Button onPress={() => setOpen(true)}>
  Chat Support
</Button>

<Modal visible={open}>
  <MavenChatWebView {...config} />
</Modal>
```

---

## Testing Both Platforms

### Test URL (works in both)
```
https://chat.onmaven.app/mavenagi-apps/barry
```

**Web Browser**: Open directly
**Mobile WebView**: Load in WebView component
**Result**: Identical chat interface

### With Authentication

**Web**:
```javascript
Maven.ChatWidget.load({
  organizationId: "mavenagi-apps",
  agentId: "barry",
  signedUserData: await fetchJWT()
});
```

**Mobile**:
```typescript
const jwt = await fetchJWT();
<MavenChatWebView
  organizationId="mavenagi-apps"
  agentId="barry"
  signedUserData={jwt}
/>
```

---

## Summary

The mobile integration is **not a separate system** - it's just a different way to load the same Maven chat interface. Think of it as:

- **Web**: Maven provides the loader (`widget.js`) + UI (button)
- **Mobile**: You provide the loader (WebView) + UI (button/modal)

Both platforms:
- Load the same chat URL
- Use the same authentication
- Call the same Maven APIs
- Provide the same user experience

The core Maven chat is platform-agnostic! 🎉
