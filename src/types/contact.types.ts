export type EmergencyContact = {
  id: string;
  name: string;
  phone: string;
  relation?: string;
  priority: number;
  isActive: boolean;
};

export type SmsLog = {
  name: string;
  phone: string;
  status: 'SENT' | 'FAILED' | 'PENDING';
  errorMessage?: string;
};

export type DangerImage = {
  path: string;
  cameraType: 'BACK' | 'FRONT';
};

export type SosAlertImage = {
  id?: string | number;
  image_url?: string;
  image_path?: string;
  url?: string;
  camera_type?: 'BACK' | 'FRONT';
  cameraType?: 'BACK' | 'FRONT';
  image_order?: number;
};

export type SosAlertAudio = {
  id?: string | number;

  audio_url?: string;
  audio_path?: string;

  url?: string;
  path?: string;

  original_filename?: string;
  mime_type?: string;

  duration_seconds?: number | null;
  durationSeconds?: number | null;

  size_bytes?: number | null;
  created_at?: string;
};

export type SosAlertMessage = {
  type?: string;

  id?: string | number;
  alert_code: string;
  user_name: string;

  latitude?: string | number;
  longitude?: string | number;
  map_link: string;

  image_count: number;
  images?: SosAlertImage[];

  audio?: SosAlertAudio | null;
  audios?: SosAlertAudio[];
  has_audio?: boolean;
  audio_count?: number;

  audio_url?: string | null;
  audio_path?: string | null;
  audio_duration_seconds?: number | null;

  triggered_by?: string;
  created_at?: string;

  sms_status?: string;
  sms_sent_count?: number;
  sms_failed_count?: number;

  cnn_label?: string;
  cnn_confidence?: number | null;
};
