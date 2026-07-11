export type AlertSeverity = 'low' | 'medium' | 'high';

export type AlertStatus =
  | 'active'
  | 'acknowledged'
  | 'resolved';

export const ALERT_ENCRYPTION_ALGORITHM = 'AES-256-GCM' as const;
export const ALERT_KEY_ENCRYPTION_ALGORITHM = 'RSA-OAEP-SHA256' as const;

export function normalizeAlertSeverity(value: string | undefined | null): AlertSeverity {
  if (value === 'medium' || value === 'low' || value === 'high') {
    return value;
  }

  return 'high';
}

export function normalizeCreateAlertPayload(payload: Partial<CreateAlertPayload>): CreateAlertPayload {
  const normalizedSeverity = normalizeAlertSeverity(payload.severity);

  return {
    encrypted_content: payload.encrypted_content ?? '',
    encrypted_key: payload.encrypted_key ?? '',
    encryption_algorithm: ALERT_ENCRYPTION_ALGORITHM,
    encrypted_content_nonce: payload.encrypted_content_nonce ?? '',
    encrypted_content_tag: payload.encrypted_content_tag ?? '',
    key_encryption_algorithm: ALERT_KEY_ENCRYPTION_ALGORITHM,
    recipient_keys: (payload.recipient_keys ?? []).map((recipient) => ({
      recipient_user_id: recipient.recipient_user_id ?? '',
      encrypted_key: recipient.encrypted_key ?? '',
      key_encryption_algorithm: recipient.key_encryption_algorithm ?? ALERT_KEY_ENCRYPTION_ALGORITHM,
    })),
    latitude: payload.latitude,
    longitude: payload.longitude,
    severity: normalizedSeverity,
  };
}


// ==========================
// LOCATION
// ==========================

export interface AlertLocationPoint {

  latitude: number;

  longitude: number;

  accuracy?: number;

  created_at?: string;

}



// ==========================
// ALERT RESPONSE BACKEND
// ==========================

export interface Alert {

  id: string;

  user_id: string;


  encrypted_content: string;

  encrypted_key: string;


  encryption_algorithm?: string;

  encrypted_content_nonce?: string;

  encrypted_content_tag?: string;

  key_encryption_algorithm?: string;


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



// ==========================
// E2EE RECIPIENT KEY
// ==========================

export interface RecipientKeyPayload {


  recipient_user_id: string;


  encrypted_key: string;


  key_encryption_algorithm:
    'RSA-OAEP-SHA256';

}



// ==========================
// CREATION ALERT BACKEND
// ==========================

export interface CreateAlertPayload {
  encrypted_content: string;
  encrypted_key: string;
  encryption_algorithm: 'AES-256-GCM';
  encrypted_content_nonce: string;
  encrypted_content_tag: string;
  key_encryption_algorithm: 'RSA-OAEP-SHA256';
  recipient_keys: RecipientKeyPayload[];
  latitude?: number;
  longitude?: number;
  severity: AlertSeverity;
}



// ==========================
// REQUEST FRONTEND
// ==========================

/**
 * Objet avant chiffrement
 * Ce que l'utilisateur saisit
 */
export interface CreateEncryptedAlertRequest {


  message: string;


  severity: AlertSeverity;

  latitude?: number;

  longitude?: number;

  accuracy?: number;

}



// ==========================
// UPDATE
// ==========================

export interface UpdateAlertPayload {

  status?: AlertStatus;

  assigned_to?: string | null;

  severity?: AlertSeverity;

}



// ==========================
// LOCATION API
// ==========================

export interface CreateLocationPayload {

  alert_id: string;

  latitude: number;

  longitude: number;

  accuracy: number;

}



// ==========================
// ADMIN NOTIFICATION
// ==========================

export interface AdminAlertNotification {

  alert_id?: string;

  id?: string;

  message?: string;

  severity?: string;

  status?: string;

  created_at?: string;

  [key:string]: unknown;

}



// ==========================
// GEOJSON LOCATION
// ==========================

export interface Location {

  type: string;

  coordinates: number[];

}



export interface LocationPoint {

  latitude:number;

  longitude:number;

  accuracy:number;

}



// ==========================
// CRYPTO
// ==========================

export interface CryptoPayload {


  encrypted_content:string;


  encrypted_key:string;


  encryption_algorithm:
    'AES-256-GCM';


  encrypted_content_nonce:string;


  encrypted_content_tag:string;


  key_encryption_algorithm:
    'RSA-OAEP-SHA256';

}



// ==========================
// KEY STORAGE
// ==========================

export interface JsonWebKeyPair {

  publicKey: JsonWebKey;

  privateKey: JsonWebKey;

}



// ==========================
// DASHBOARD
// ==========================

export interface DashboardStatistics {


  totalAlerts:number;


  activeAlerts:number;


  criticalAlerts:number;


  acknowledgedAlerts:number;


  resolvedAlerts:number;


  mediumAlerts:number;


  lowAlerts:number;


  averageInterventionMinutes:number;

}



// ==========================
// WEBSOCKET
// ==========================

export interface WebSocketAlertMessage {

  type:
    | 'initial_alerts'
    | 'new_alert'
    | string;


  data?:unknown;

}