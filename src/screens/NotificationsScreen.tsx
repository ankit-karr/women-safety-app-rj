// Imports React and hooks used for callback functions and state.
import React, {useCallback, useState} from 'react';

// Imports React Native UI components and alert popup.
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Imports navigation props type for this stack screen.
import {NativeStackScreenProps} from '@react-navigation/native-stack';

// Imports app route type definitions.
import {RootStackParamList} from '../../App';

// Imports local storage helpers to get and clear received SOS alerts.
import {
  clearReceivedAlerts,
  getReceivedAlerts,
} from '../storage/alertStorage';

// Imports SOS alert message type.
import {SosAlertMessage} from '../types/contact.types';

// Imports hook that runs when this screen comes into focus.
import {useFocusEffect} from '@react-navigation/native';

// Defines props type for Notifications screen.
type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

// Main Notifications screen component.
export default function NotificationsScreen({navigation}: Props) {
  // Stores all saved SOS alerts.
  const [alerts, setAlerts] = useState<SosAlertMessage[]>([]);

  // Loads saved SOS alerts from local storage.
  const loadAlerts = useCallback(async () => {
    // Gets all received alerts from local storage.
    const savedAlerts = await getReceivedAlerts();

    // Saves loaded alerts in state so UI can show them.
    setAlerts(savedAlerts);
  }, []);

  // Runs every time this screen becomes active/focused.
  useFocusEffect(
    useCallback(() => {
      // Loads latest saved alerts when user opens this screen.
      loadAlerts();
    }, [loadAlerts]),
  );

  // Clears all saved SOS alerts.
  const clearAlerts = async () => {
    // Removes all received alerts from local storage.
    await clearReceivedAlerts();

    // Clears alerts from UI state.
    setAlerts([]);
  };

  // Shows confirmation popup before clearing all alerts.
  const confirmClear = () => {
    Alert.alert('Clear Alerts', 'Do you want to clear all saved SOS alerts?', [
      {
        // Cancel button closes popup without clearing anything.
        text: 'Cancel',
        style: 'cancel',
      },
      {
        // Clear button deletes all saved SOS alerts.
        text: 'Clear',
        style: 'destructive',
        onPress: clearAlerts,
      },
    ]);
  };

  // Renders the notifications screen UI.
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Top hero section with screen title and description. */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>SOS Notifications</Text>
          <Text style={styles.heroSubtitle}>
            Tap any received SOS alert to view location and uploaded images.
          </Text>
        </View>

        {/* Button to manually reload alerts from local storage. */}
        <TouchableOpacity style={styles.secondaryButton} onPress={loadAlerts}>
          <Text style={styles.buttonText}>REFRESH ALERTS</Text>
        </TouchableOpacity>

        {/* Button to ask confirmation before clearing all alerts. */}
        <TouchableOpacity style={styles.dangerButton} onPress={confirmClear}>
          <Text style={styles.buttonText}>CLEAR ALERTS</Text>
        </TouchableOpacity>

        {/* Shows empty card if no alerts are found, otherwise shows alert list. */}
        {alerts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No SOS alerts received yet.</Text>
            <Text style={styles.emptyText}>
              Start Receiver Mode from Home screen and keep the app running.
            </Text>
          </View>
        ) : (
          alerts.map(alert => (
            // Each alert card opens alert details screen when tapped.
            <TouchableOpacity
              key={alert.alert_code}
              style={styles.alertCard}
              onPress={() => {
                navigation.navigate('AlertDetails', {
                  alert,
                });
              }}>
              {/* Header row showing alert code and image count. */}
              <View style={styles.alertHeader}>
                <Text style={styles.alertCode}>{alert.alert_code}</Text>
                <Text style={styles.alertBadge}>
                  {alert.image_count ?? 0} Images
                </Text>
              </View>

              {/* Shows the user name who sent the SOS alert. */}
              <Text style={styles.alertUser}>{alert.user_name}</Text>

              {/* Shows how the SOS was triggered. */}
              <Text style={styles.alertText}>
                Triggered By: {alert.triggered_by || 'SOS'}
              </Text>

              {/* Shows the alert location map link if available. */}
              <Text style={styles.alertText}>
                Location: {alert.map_link || 'N/A'}
              </Text>

              {/* Shows alert created date only if it exists. */}
              {alert.created_at ? (
                <Text style={styles.alertDate}>{alert.created_at}</Text>
              ) : null}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Defines all styles used in this screen.
const styles = StyleSheet.create({
  // Root safe area style.
  safeArea: {
    flex: 1,
    backgroundColor: '#050816',
  },

  // Scroll view content wrapper style.
  container: {
    padding: 18,
    paddingBottom: 40,
  },

  // Top hero card style.
  hero: {
    backgroundColor: '#111827',
    borderRadius: 26,
    padding: 22,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#1f2937',
  },

  // Hero title text style.
  heroTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 8,
  },

  // Hero subtitle text style.
  heroSubtitle: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 21,
  },

  // Normal refresh button style.
  secondaryButton: {
    backgroundColor: '#334155',
    padding: 15,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'center',
  },

  // Dangerous clear button style.
  dangerButton: {
    backgroundColor: '#7f1d1d',
    padding: 15,
    borderRadius: 16,
    marginBottom: 18,
    alignItems: 'center',
  },

  // Common button text style.
  buttonText: {
    color: '#ffffff',
    fontWeight: '900',
  },

  // Empty state card style.
  emptyCard: {
    backgroundColor: '#0f172a',
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
  },

  // Empty state title text style.
  emptyTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 8,
  },

  // Empty state description text style.
  emptyText: {
    color: '#cbd5e1',
    lineHeight: 21,
  },

  // Single alert card style.
  alertCard: {
    backgroundColor: '#0f172a',
    padding: 18,
    borderRadius: 22,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
  },

  // Alert card header row style.
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // Alert code text style.
  alertCode: {
    color: '#fca5a5',
    fontSize: 16,
    fontWeight: '900',
  },

  // Image count badge style.
  alertBadge: {
    color: '#ffffff',
    backgroundColor: '#dc2626',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '900',
  },

  // Alert sender/user name style.
  alertUser: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 10,
  },

  // Common alert details text style.
  alertText: {
    color: '#cbd5e1',
    marginTop: 6,
    lineHeight: 20,
  },

  // Alert created date text style.
  alertDate: {
    color: '#94a3b8',
    marginTop: 10,
    fontSize: 12,
  },
});