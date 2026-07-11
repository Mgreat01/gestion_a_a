
export interface User {
  id?: string;
  username?: string;
  email: string;
  role?: 'admin' | 'user';
  password?: string;
  public_key?: string;
  publicKey?: string;
}

export interface AuthMeResponse {
  id?: string;
  user_id?: string;
  sub?: string;
  email?: string;
  role?: 'admin' | 'user';
  username?: string;
  full_name?: string;
  public_key?: string;
  publicKey?: string;
}
