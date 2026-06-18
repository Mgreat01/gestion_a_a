import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Alert } from '../models/alert';

@Injectable({
  providedIn: 'root'
})
export class Dashboard {

  private http = inject(HttpClient);

  private apiUrl = 'http://127.0.0.1:8000/alerts/';
  private token = localStorage.getItem('token');


  getAlerts(): Observable<Alert[]> {
    return this.http.get<Alert[]>(this.apiUrl, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });
  }
}