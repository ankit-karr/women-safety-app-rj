// Imports React and hooks used in this screen.
import React, {useCallback, useEffect, useState} from 'react';

// Imports React Native UI components and native utilities.
import {
  Image,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Imports navigation props type for stack screens.
import {NativeStackScreenProps} from '@react-navigation/native-stack';

// Imports app navigation route type.
import {RootStackParamList} from '../../App';

// Imports SOS alert image, audio, and alert message types.
import {
  SosAlertAudio,
  SosAlertImage,
  SosAlertMessage,
} from '../types/contact.types';

// Imports API used to fetch latest SOS alert details from backend.
import {getSosAlertDetailsApi} from '../api/alertApi';

// Imports default server IP used for backend image/audio URLs.
import {DEFAULT_SERVER_IP} from '../constants/config';

// Defines this screen props type.
type Props = NativeStackScreenProps<RootStackParamList, 'AlertDetails'>;

// Converts backend relative file path into full backend URL.
const getBackendFileUrl = (rawUrl?: string | null): string => {
  if (!rawUrl) {
    return '';
  }

  if (rawUrl.startsWith('http')) {
    return rawUrl;
  }

  if (rawUrl.startsWith('/')) {
    return `http://${DEFAULT_SERVER_IP}:8000${rawUrl}`;
  }

  return `http://${DEFAULT_SERVER_IP}:8000/${rawUrl}`;
};

// Converts backend image path/url into full image URL.
const getImageUrl = (image: SosAlertImage): string => {
  const rawUrl = image.image_url || image.url || image.image_path || '';

  return getBackendFileUrl(rawUrl);
};

// Converts backend audio path/url into full audio URL.
const getAudioUrl = (audio: SosAlertAudio): string => {
  const rawUrl =
    audio.audio_url || audio.url || audio.audio_path || audio.path || '';

  return getBackendFileUrl(rawUrl);
};

// Main Alert Details screen component.
export default function AlertDetailsScreen({route}: Props) {
  // Stores current alert details. Initially it uses alert data passed from navigation params.
  const [alertDetails, setAlertDetails] = useState<SosAlertMessage>(
    route.params.alert,
  );

  // Stores status message shown in the UI.
  const [status, setStatus] = useState('Ready');

  // Loads latest alert details from backend.
  const loadAlertDetails = useCallback(async () => {
    try {
      // Shows loading status while fetching alert details.
      setStatus('Fetching alert details from backend...');

      // Calls backend API using default server IP and alert code.
      const latestAlert = await getSosAlertDetailsApi(
        DEFAULT_SERVER_IP,
        route.params.alert.alert_code,
      );

      // Merges old saved socket alert data with latest backend alert data.
      setAlertDetails({
        ...route.params.alert,
        ...latestAlert,

        // Keeps socket user name if backend details returns empty user_name.
        user_name: latestAlert.user_name || route.params.alert.user_name,

        // Keeps socket map link if backend details returns empty map_link.
        map_link: latestAlert.map_link || route.params.alert.map_link,
      });

      // Shows success status after loading details.
      setStatus('Alert details loaded.');
    } catch (error: any) {
      // If backend fails, keeps showing saved alert details.
      setStatus(
        `Could not fetch latest details. Showing saved alert.\nReason: ${error.message}`,
      );
    }
  }, [route.params.alert]);

  // Runs loadAlertDetails when the screen opens.
  useEffect(() => {
    loadAlertDetails();
  }, [loadAlertDetails]);

  // Opens alert location in map app/browser.
  const openMap = async () => {
    if (alertDetails.map_link) {
      await Linking.openURL(alertDetails.map_link);
      return;
    }

    if (alertDetails.latitude && alertDetails.longitude) {
      await Linking.openURL(
        `https://maps.google.com/?q=${alertDetails.latitude},${alertDetails.longitude}`,
      );
    }
  };

  // Opens emergency audio file.
  const openAudio = async (audioUrl: string) => {
    if (!audioUrl) {
      setStatus('No audio URL found for this alert.');
      return;
    }

    await Linking.openURL(audioUrl);
  };

  // Gets images from alert details, or uses empty array if no images exist.
  const images = alertDetails.images ?? [];

  // Gets audios from backend details API or from live WebSocket alert.
  const audios =
    alertDetails.audios && alertDetails.audios.length > 0
      ? alertDetails.audios
      : alertDetails.audio
        ? [alertDetails.audio]
        : [];

  // Renders alert details UI.
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Top hero section showing alert code and short description. */}
        <View style={styles.hero}>
          <Text style={styles.heroBadge}>SOS ALERT</Text>
          <Text style={styles.heroTitle}>{alertDetails.alert_code}</Text>
          <Text style={styles.heroSubtitle}>
            Full emergency details, location, captured images, and voice
            recording.
          </Text>
        </View>

        {/* Card showing main alert information. */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Alert Information</Text>

          <Text style={styles.label}>User</Text>
          <Text style={styles.value}>{alertDetails.user_name || 'N/A'}</Text>

          <Text style={styles.label}>Triggered By</Text>
          <Text style={styles.value}>{alertDetails.triggered_by || 'SOS'}</Text>

          <Text style={styles.label}>Latitude</Text>
          <Text style={styles.value}>{alertDetails.latitude || 'N/A'}</Text>

          <Text style={styles.label}>Longitude</Text>
          <Text style={styles.value}>{alertDetails.longitude || 'N/A'}</Text>

          <Text style={styles.label}>Images</Text>
          <Text style={styles.value}>
            {images.length || alertDetails.image_count || 0}
          </Text>

          <Text style={styles.label}>Voice Recordings</Text>
          <Text style={styles.value}>
            {audios.length || alertDetails.audio_count || 0}
          </Text>

          {/* Shows created date only if it exists. */}
          {alertDetails.created_at ? (
            <>
              <Text style={styles.label}>Created At</Text>
              <Text style={styles.value}>{alertDetails.created_at}</Text>
            </>
          ) : null}

          {/* Button to open SOS location in map. */}
          <TouchableOpacity style={styles.primaryButton} onPress={openMap}>
            <Text style={styles.buttonText}>OPEN LOCATION IN MAP</Text>
          </TouchableOpacity>
        </View>

        {/* Status card showing backend fetch status or error message. */}
        <View style={styles.statusCard}>
          <Text style={styles.sectionTitle}>Status</Text>
          <Text style={styles.statusText}>{status}</Text>
        </View>

        {/* Card showing captured emergency audio. */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Emergency Voice Recording</Text>

          {audios.length === 0 ? (
            <Text style={styles.emptyText}>
              No voice recording found in this alert. Backend must return audios
              in alert details API.
            </Text>
          ) : (
            audios.map((audio, index) => {
              const audioUrl = getAudioUrl(audio);

              return (
                <View key={`${audioUrl}-${index}`} style={styles.audioCard}>
                  <Text style={styles.label}>Audio {index + 1}</Text>

                  <Text style={styles.value}>
                    Duration:{' '}
                    {audio.duration_seconds || audio.durationSeconds || 'N/A'}{' '}
                    seconds
                  </Text>

                  <Text style={styles.value}>
                    Type: {audio.mime_type || 'audio/mp4'}
                  </Text>

                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => openAudio(audioUrl)}>
                    <Text style={styles.buttonText}>PLAY VOICE RECORDING</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>

        {/* Card showing captured emergency images. */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Captured Images</Text>

          {/* Shows empty text if no image URLs are available. */}
          {images.length === 0 ? (
            <Text style={styles.emptyText}>
              No image URLs found in this alert. Backend must return images in
              alert details API.
            </Text>
          ) : (
            <View style={styles.imageGrid}>
              {/* Loops through all captured images and renders each image card. */}
              {images.map((image, index) => {
                // Builds final image URL for React Native Image component.
                const imageUrl = getImageUrl(image);

                return (
                  <View key={`${imageUrl}-${index}`} style={styles.imageCard}>
                    {/* Shows image if URL exists, otherwise shows placeholder. */}
                    {imageUrl ? (
                      <Image source={{uri: imageUrl}} style={styles.image} />
                    ) : (
                      <View style={styles.imagePlaceholder}>
                        <Text style={styles.emptyText}>No URL</Text>
                      </View>
                    )}

                    {/* Shows camera type and image number. */}
                    <Text style={styles.imageText}>
                      {image.camera_type || image.cameraType || 'IMAGE'}{' '}
                      {index + 1}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Defines all styles used in this screen.
const styles = StyleSheet.create({
  // Root screen style.
  safeArea: {
    flex: 1,
    backgroundColor: '#050816',
  },

  // ScrollView content container style.
  container: {
    padding: 18,
    paddingBottom: 40,
  },

  // Hero card style.
  hero: {
    backgroundColor: '#111827',
    borderRadius: 26,
    padding: 22,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#1f2937',
  },

  // Small badge text style.
  heroBadge: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 10,
  },

  // Alert code title style.
  heroTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 8,
  },

  // Hero description text style.
  heroSubtitle: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 21,
  },

  // Common card style.
  card: {
    backgroundColor: '#0f172a',
    padding: 18,
    borderRadius: 24,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
  },

  // Status card style.
  statusCard: {
    backgroundColor: '#020617',
    padding: 18,
    borderRadius: 24,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
  },

  // Audio card style.
  audioCard: {
    backgroundColor: '#1e293b',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 12,
  },

  // Section title text style.
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 14,
  },

  // Label text style.
  label: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 10,
    marginBottom: 5,
    fontWeight: '700',
  },

  // Value text style.
  value: {
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 22,
  },

  // Main blue button style.
  primaryButton: {
    backgroundColor: '#2563eb',
    padding: 15,
    borderRadius: 16,
    marginTop: 18,
    alignItems: 'center',
  },

  // Button text style.
  buttonText: {
    color: '#ffffff',
    fontWeight: '900',
  },

  // Status text style.
  statusText: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 21,
  },

  // Empty message text style.
  emptyText: {
    color: '#cbd5e1',
    lineHeight: 21,
  },

  // Image grid wrapper style.
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  // Single image card style.
  imageCard: {
    width: '47%',
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },

  // Image preview style.
  image: {
    width: '100%',
    height: 160,
    borderRadius: 14,
    backgroundColor: '#020617',
  },

  // Placeholder style when image URL is missing.
  imagePlaceholder: {
    width: '100%',
    height: 160,
    borderRadius: 14,
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Text below each image style.
  imageText: {
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '800',
  },
});