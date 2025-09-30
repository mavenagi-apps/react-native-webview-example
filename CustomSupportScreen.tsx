/**
 * Custom Support Screen
 * Your own branded support interface that wraps Maven chat
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MavenChatWebView from './MavenChatWebView';

interface CustomSupportScreenProps {
  organizationId: string;
  agentId: string;
  signedUserData?: string | null;
  currentScreen?: string; // Current screen/page name
  onClose: () => void;
}

export default function CustomSupportScreen({
  organizationId,
  agentId,
  signedUserData,
  currentScreen = 'Unknown',
  onClose,
}: CustomSupportScreenProps) {
  const [showChat, setShowChat] = useState(false);
  const [chatOpenedFrom, setChatOpenedFrom] = useState<string>('Support Landing');

  // Helper to open chat and track where it was opened from
  const openChat = (source: string) => {
    setChatOpenedFrom(source);
    setShowChat(true);
  };

  if (showChat) {
    // Show the full chat interface
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowChat(false)} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Live Chat</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
        <MavenChatWebView
          organizationId={organizationId}
          agentId={agentId}
          signedUserData={signedUserData}
          unsignedUserData={{
            currentScreen: currentScreen,
            chatOpenedFrom: chatOpenedFrom,
            openedAt: new Date().toISOString(),
            platform: 'react-native',
          }}
          tags={['mobile-app']}
        />
      </SafeAreaView>
    );
  }

  // Custom support landing screen
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Your Custom Branding */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>How can we help you?</Text>
          <Text style={styles.heroSubtitle}>
            Get instant answers or chat with our support team
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => openChat('Quick Action: Chat with Support')}
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>💬</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Chat with Support</Text>
              <Text style={styles.actionDescription}>
                Get instant help from our AI assistant
              </Text>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>📚</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Knowledge Base</Text>
              <Text style={styles.actionDescription}>
                Browse articles and guides
              </Text>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>📧</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Email Support</Text>
              <Text style={styles.actionDescription}>
                support@yourcompany.com
              </Text>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked</Text>
          
          <TouchableOpacity
            style={styles.faqCard}
            onPress={() => openChat('FAQ: How do I reset my password?')}
          >
            <Text style={styles.faqQuestion}>How do I reset my password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.faqCard}
            onPress={() => openChat('FAQ: Where is my order?')}
          >
            <Text style={styles.faqQuestion}>Where is my order?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.faqCard}
            onPress={() => openChat('FAQ: How do I update my account?')}
          >
            <Text style={styles.faqQuestion}>How do I update my account?</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Floating Chat Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => openChat('Floating Button: Chat Now')}
      >
        <Text style={styles.floatingButtonText}>💬 Chat Now</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#6C2BD9',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6C2BD9',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  heroSection: {
    padding: 24,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionIconText: {
    fontSize: 24,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#666',
  },
  actionArrow: {
    fontSize: 20,
    color: '#ccc',
  },
  faqCard: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
  },
  faqQuestion: {
    fontSize: 15,
    color: '#333',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#6C2BD9',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
