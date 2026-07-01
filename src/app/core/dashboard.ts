import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Alert, CreateAlertPayload, CreateLocationPayload, UpdateAlertPayload } from '../models/alert';
import { Auth } from './auth';
@Injectable({ providedIn: 'root' })
export class Dashboard {
  private http = inject(HttpClient); private auth = inject(Auth); private base='';
  getAlerts():Observable<Alert[]>{return this.http.get<Alert[]>(`${this.base}/alerts/`,{headers:this.auth.authHeaders()})}
  createAlert(payload:CreateAlertPayload):Observable<Alert>{
    console.log('Creating alert with payload: %o', payload);
    return this.http.post<Alert>(`${this.base}/alerts/`,payload,{headers:this.auth.authHeaders()})}
  updateAlert(alertId:string,payload:UpdateAlertPayload):Observable<any>{return this.http.put(`${this.base}/alerts/${alertId}`,payload,{headers:this.auth.authHeaders()})}
  createLocation(payload:CreateLocationPayload):Observable<any>{return this.http.post(`${this.base}/locations/`,payload,{headers:this.auth.authHeaders()})}
  getLocations(alertId:string):Observable<any>{return this.http.get(`${this.base}/locations/${alertId}`,{headers:this.auth.authHeaders()})}
  getCurrentPosition():Promise<{latitude:number;longitude:number;accuracy:number}>{return new Promise((resolve,reject)=>{if(!navigator.geolocation)return reject(new Error('unsupported'));navigator.geolocation.getCurrentPosition(p=>resolve({latitude:p.coords.latitude,longitude:p.coords.longitude,accuracy:p.coords.accuracy??0}),reject,{enableHighAccuracy:true,timeout:12000,maximumAge:0})})}
}
