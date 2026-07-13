
export interface User {
  id?: string;
  username?: string;
  email: string;
  role?: 'admin' | 'user' | 'rescuer' | 'rescue_team';
  password?: string;
  public_key?: string;
  publicKey?: string;
  is_active?: boolean;
  is_verified?: boolean;
  email_verified?: boolean;
  created_at?: string;
}

export interface AuthMeResponse {
  id?: string;
  user_id?: string;
  sub?: string;
  email?: string;
  role?: 'admin' | 'user' | 'rescuer' | 'rescue_team';
  username?: string;
  full_name?: string;
  public_key?: string;
  publicKey?: string;
  is_active?: boolean;
  is_verified?: boolean;
  email_verified?: boolean;
}

export type UserRole =
  | 'user'
  | 'rescuer'
  | 'rescue_team'
  | 'admin';
