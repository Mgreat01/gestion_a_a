import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Alert, AssignAlertPayload, CreateAlertPayload, CreateLocationPayload, UpdateAlertPayload } from '../../models/alert';
import { Auth } from './auth';
import { environment } from '../../../environments/environments';
@Injectable({ providedIn: 'root' })
export class Dashboard {
  private http = inject(HttpClient); private auth = inject(Auth); private base= `${environment.apiUrl}`;
  getAlerts():Observable<Alert[]>{return this.http.get<Alert[]>(`${this.base}/alerts/`,{headers:this.auth.authHeaders()})}
  createAlert(payload:CreateAlertPayload):Observable<Alert>{
    console.log('Creating alert with payload: %o', payload);
    return this.http.post<Alert>(`${this.base}/alerts/`,payload,{headers:this.auth.authHeaders()})}
  updateAlert(alertId:string,payload:UpdateAlertPayload):Observable<any>{return this.http.put(`${this.base}/alerts/${alertId}`,payload,{headers:this.auth.authHeaders()})}
  claimAlert(alertId: string): Observable<Alert> { return this.http.put<Alert>(`${this.base}/alerts/${alertId}/claim`, {}, { headers: this.auth.authHeaders() }); }
  assignAlert(alertId: string, payload: AssignAlertPayload): Observable<Alert> { return this.http.put<Alert>(`${this.base}/alerts/${alertId}/assign`, payload, { headers: this.auth.authHeaders() }); }
  getAlertHistory(alertId: string): Observable<unknown[]> { return this.http.get<unknown[]>(`${this.base}/alerts/${alertId}/history`, { headers: this.auth.authHeaders() }); }
  createLocation(payload:CreateLocationPayload):Observable<any>{return this.http.post(`${this.base}/locations/`,payload,{headers:this.auth.authHeaders()})}
  getLocations(alertId:string):Observable<any>{return this.http.get(`${this.base}/locations/${alertId}`,{headers:this.auth.authHeaders()})}
}
