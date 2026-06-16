import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private url = 'http://localhost:8000/auth/';

  constructor(private http: HttpClient) {}

  login(user: User): Promise<any> {
    const credentials = {
      email: user.email,
      password: user.password,
    };
    return firstValueFrom(this.http.post(this.url + 'login', credentials));
  }

  register(user: User): Promise<any> {
    const payload = {
      ...user,
      role: 'user', 
    };
    return firstValueFrom(this.http.post(this.url + 'register', payload));
  }


  getToken(): any {
    return localStorage.getItem('token');
  }

  setToken(token : string): any {
    return localStorage.setItem('token', token);
  }

  removeToken(){
    return localStorage.removeItem('token')
  }

  isAuth(){
    return this.getToken() !== null
  }
}