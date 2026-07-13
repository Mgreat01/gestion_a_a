import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environments';
import { Alert, RescuerDashboardStatistics } from '../../../models/alert';
import { Auth } from '../../../core/services/auth';

@Injectable({ providedIn: 'root' })
export class RescuerAlertService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(Auth);
  private readonly baseUrl = environment.apiUrl;
  private options() { return { headers: this.auth.authHeaders() }; }
  assigned(): Observable<Alert[]> { return this.http.get<Alert[]>(`${this.baseUrl}/alerts/rescuer/assigned`, this.options()); }
  nearby(latitude: number, longitude: number, radiusMeters = 5000): Observable<Alert[]> {
    const params = new HttpParams().set('latitude', latitude).set('longitude', longitude).set('radius_meters', radiusMeters);
    return this.http.get<Alert[]>(`${this.baseUrl}/alerts/nearby/`, { ...this.options(), params });
  }
  statistics(): Observable<RescuerDashboardStatistics> { return this.http.get<RescuerDashboardStatistics>(`${this.baseUrl}/alerts/rescuer/dashboard/stats`, this.options()); }
  claim(id: string): Observable<Alert> { return this.http.put<Alert>(`${this.baseUrl}/alerts/${id}/claim`, {}, this.options()); }
  accept(id: string): Observable<Alert> { return this.http.put<Alert>(`${this.baseUrl}/alerts/${id}/accept`, {}, this.options()); }
  start(id: string): Observable<Alert> { return this.http.put<Alert>(`${this.baseUrl}/alerts/${id}/start`, {}, this.options()); }
  resolve(id: string): Observable<Alert> { return this.http.put<Alert>(`${this.baseUrl}/alerts/${id}/resolve`, {}, this.options()); }
}
