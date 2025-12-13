export type UserRole = 'tourist' | 'official';

export type SafetyLevel = 'safe' | 'caution' | 'danger';

export type DensityLevel = 'low' | 'medium' | 'high';

export type SOSStatus = 'active' | 'resolved' | 'cancelled';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  language: string;
  created_at: string;
  updated_at: string;
}

export interface TrustedContact {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  relationship: string | null;
  created_at: string;
}

export interface SafetyZone {
  id: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  radius_meters: number;
  safety_level: SafetyLevel;
  created_at: string;
  updated_at: string;
}

export interface CrowdReport {
  id: string;
  user_id: string | null;
  latitude: number;
  longitude: number;
  person_count: number;
  density_level: DensityLevel;
  image_url: string | null;
  location_name: string | null;
  created_at: string;
}

export interface SOSAlert {
  id: string;
  user_id: string;
  latitude: number | null;
  longitude: number | null;
  status: SOSStatus;
  resolved_at: string | null;
  created_at: string;
}

export interface Scam {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string | null;
  prevention_tips: string[];
  severity: 'low' | 'medium' | 'high';
  created_at: string;
}

export interface TransportService {
  id: string;
  name: string;
  service_type: string;
  license_number: string | null;
  phone: string | null;
  area: string | null;
  is_verified: boolean;
  rating: number | null;
  created_at: string;
}

export interface WatchMeSession {
  id: string;
  user_id: string;
  is_active: boolean;
  duration_minutes: number;
  started_at: string;
  expires_at: string;
  last_latitude: number | null;
  last_longitude: number | null;
  last_updated_at: string;
}

export interface ChecklistItem {
  id: string;
  user_id: string;
  title: string;
  is_completed: boolean;
  category: string | null;
  created_at: string;
}

export interface RoboflowResponse {
  predictions: Array<{
    class: string;
    confidence: number;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  personCount: number;
  densityLevel: DensityLevel;
}
