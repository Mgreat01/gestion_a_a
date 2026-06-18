export interface Alert {

  id: string;
  user_id: string;

  encrypted_content: string;
  encrypted_key: string;

  latitude: number;
  longitude: number;

  location: {
    type: string;
    coordinates: number[];
  };

  severity: 'low' | 'medium' | 'high';

  status: 'active' | 'acknowledged' | 'resolved';

  assigned_to: string | null;

  created_at: string;

  acknowledged_at: string | null;

  resolved_at: string | null;

}