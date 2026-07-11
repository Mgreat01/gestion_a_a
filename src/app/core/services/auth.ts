
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthMeResponse, User } from '../../models/user';
import { environment } from '../../../environments/environments';

@Injectable({ providedIn: 'root' })
export class Auth {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/auth/`;
  login(user: User): Promise<any> {
    return firstValueFrom(this.http.post(this.url + 'login', { email: user.email, password: user.password }));
  }

  register(user: User): Promise<any> {
    return firstValueFrom(this.http.post(this.url + 'register', { ...user, role: 'user' }));
  }

  me(): Promise<AuthMeResponse> {
    return firstValueFrom(this.http.get<AuthMeResponse>(this.url + 'me', { headers: this.authHeaders() }));
  }

  getToken(){ return localStorage.getItem('token'); }
  setToken(token: string){ localStorage.setItem('token', token); }
  removeToken(){ localStorage.removeItem('token'); localStorage.removeItem('me'); }

  getCurrentUserId(): string | null {
    const me = this.getMeCache();
    const meId = me?.id ?? me?.user_id ?? me?.sub;

    if (meId) {
      return String(meId);
    }

    const token = this.getToken();

    if (!token) {
      return null;
    }

    const payload = this.decodeJwtPayload(token) as { sub?: string; user_id?: string; id?: string; userId?: string } | null;

    return payload?.sub ?? payload?.user_id ?? payload?.id ?? payload?.userId ?? null;
  }
  isAuth(){
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  isTokenExpired(token: string): boolean {
    const payload = this.decodeJwtPayload(token);

    if (!payload?.exp || typeof payload.exp !== 'number') {
      return false;
    }

    return payload.exp * 1000 <= Date.now();
  }

  authHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.getToken() ?? ''}` });
  }

  setMe(me: AuthMeResponse){ localStorage.setItem('me', JSON.stringify(me)); }
  getMeCache(): AuthMeResponse | null {
    const raw = localStorage.getItem('me');

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as AuthMeResponse;
    } catch {
      this.removeToken();
      return null;
    }
  }

  private decodeJwtPayload(token: string): { exp?: number } | null {
    try {
      const [, payload] = token.split('.');

      if (!payload) {
        return null;
      }

      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='));
      return JSON.parse(decoded) as { exp?: number };
    } catch {
      return null;
    }
  }
}
