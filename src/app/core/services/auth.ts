
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthMeResponse, User } from '../../models/user';

@Injectable({ providedIn: 'root' })
export class Auth {
  private http = inject(HttpClient);
  private url = '/auth/';

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
  isAuth(){ return !!this.getToken(); }

  authHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.getToken() ?? ''}` });
  }

  setMe(me: AuthMeResponse){ localStorage.setItem('me', JSON.stringify(me)); }
  getMeCache(): AuthMeResponse | null {
    const raw = localStorage.getItem('me'); return raw ? JSON.parse(raw) : null;
  }
}
