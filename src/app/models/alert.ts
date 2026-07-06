export type AlertSeverity = 'low' | 'medium' | 'high';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export interface AlertLocationPoint {
  latitude: number;
  longitude: number;
  accuracy?: number;
  created_at?: string;
}

export interface Alert {
  id: string;
  user_id: string;
  encrypted_content: string;
  encrypted_key: string;
  latitude: number;
  longitude: number;
  location: Location;
  severity: AlertSeverity;
  status: AlertStatus;
  assigned_to: string | null;
  created_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
  address: string | null;
}

export interface CreateAlertPayload {
  encrypted_content: string;
  encrypted_key: string;
  latitude?: number;
  longitude?: number;
  severity: AlertSeverity;
}

export interface UpdateAlertPayload {
  status?: AlertStatus;
  assigned_to?: string | null;
  severity?: AlertSeverity;
}

export interface CreateLocationPayload {
  alert_id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface AdminAlertNotification {
  alert_id?: string;
  id?: string;
  message?: string;
  severity?: string;
  status?: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface Location {
  type: string;
  coordinates: number[];
}
