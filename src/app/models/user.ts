
export interface User {
  id?: string;
  username?: string;
  email: string;
  role?: 'admin' | 'user' | 'rescuer';
  password?: string;
  public_key?: string;
  publicKey?: string;
  is_active?: boolean;
}

export interface AuthMeResponse {
  id?: string;
  user_id?: string;
  sub?: string;
  email?: string;
  role?: 'admin' | 'user' | 'rescuer';
  username?: string;
  full_name?: string;
  public_key?: string;
  publicKey?: string;
  is_active?: boolean;
}

export type UserRole =
  | 'user'
  | 'rescuer'
  | 'admin';