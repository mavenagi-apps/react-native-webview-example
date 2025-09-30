/**
 * Maven Chat WebView Component
 * Integrates Maven AGI Chat into React Native via WebView
 * 
 * Uses the documented Maven widget.js integration approach:
 * - Loads widget.js in an HTML page
 * - Calls Maven.ChatWidget.load() with signedUserData
 * - Follows the official authentication flow
 */

import React, { useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import WebView from 'react-native-webview';

interface MavenChatWebViewProps {
  organizationId: string;
  agentId: string;
  signedUserData?: string | null; // JWT token from your backend
  unsignedUserData?: Record<string, any> | null; // Optional context metadata
  tags?: string[]; // Optional conversation tags
}

export default function MavenChatWebView({
  organizationId,
  agentId,
  signedUserData,
  unsignedUserData,
  tags = [],
}: MavenChatWebViewProps) {
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Create an HTML page that properly uses Maven's widget.js
   * This follows the documented integration pattern from:
   * https://docs.mavenagi.com/apps/chat
   */
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <meta charset="utf-8">
      <style>
        * { 
          margin: 0; 
          padding: 0; 
          box-sizing: border-box; 
        }
        html, body { 
          height: 100%; 
          width: 100%;
          overflow: hidden; 
          background: #fff;
        }
      </style>
    </head>
    <body>
      <!-- Load Maven widget.js as documented -->
      <script src="https://chat.onmaven.app/js/widget.js"></script>
      <script>
        window.addEventListener('load', function() {
          console.log('Maven WebView loaded, initializing widget...');
          
          // Use the official Maven.ChatWidget.load() API
          // This properly handles authentication via signedUserData
          window.Maven.ChatWidget.load({
            organizationId: ${JSON.stringify(organizationId)},
            agentId: ${JSON.stringify(agentId)},
            ${signedUserData ? `signedUserData: ${JSON.stringify(signedUserData)},` : ''}
            ${unsignedUserData ? `unsignedUserData: ${JSON.stringify(unsignedUserData)},` : ''}
            ${tags?.length > 0 ? `tags: ${JSON.stringify(tags)},` : ''}
            hideButton: true, // Hide default button since we control opening
          });
          
          // Auto-open the chat interface
          setTimeout(function() {
            if (window.Maven && window.Maven.ChatWidget && window.Maven.ChatWidget.open) {
              console.log('Opening Maven chat...');
              window.Maven.ChatWidget.open();
            } else {
              console.warn('Maven.ChatWidget.open not available');
            }
          }, 500);
        });
        
        // Optional: Log errors for debugging
        window.addEventListener('error', function(e) {
          console.error('WebView error:', e.message);
        });
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C2BD9" />
        </View>
      )}
      
      <WebView
        ref={webViewRef}
        source={{ 
          html: htmlContent,
          baseUrl: 'https://chat.onmaven.app' 
        }}
        originWhitelist={['*']}
        onLoadEnd={() => setIsLoading(false)}
        style={styles.webview}
        // Enable JavaScript (required for Maven chat)
        javaScriptEnabled={true}
        // Enable DOM storage (required for session persistence)
        domStorageEnabled={true}
        // Allow third-party cookies (required for Maven API calls)
        thirdPartyCookiesEnabled={true}
        // Disable zoom for better mobile experience
        scalesPageToFit={false}
        // Allow media playback
        allowsInlineMediaPlayback={true}
        // Allow file uploads (for chat attachments if enabled)
        allowFileAccess={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    zIndex: 1,
  },
  webview: {
    flex: 1,
  },
});
