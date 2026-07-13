import { Injectable, inject, signal } from '@angular/core';
import { EMPTY, Subscription, catchError, forkJoin } from 'rxjs';
import { Alert, RescuerDashboardStatistics, WebSocketAlertMessage } from '../../../models/alert';
import { RescuerAlertService } from '../services/rescuer-alert.service';
import { RescuerWebsocketService } from '../services/rescuer-websocket.service';

@Injectable({ providedIn: 'root' })
export class RescuerStateService {
  private readonly alertsApi = inject(RescuerAlertService);
  private readonly websocket = inject(RescuerWebsocketService);
  private subscription?: Subscription;
  readonly assignedAlerts = signal<Alert[]>([]);
  /** Active, unassigned alerts discovered around the current rescuer. */
  readonly availableAlerts = signal<Alert[]>([]);
  readonly nearbyAlerts = signal<Alert[]>([]);
  readonly statistics = signal<RescuerDashboardStatistics | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly websocketConnected = signal(false);

  load(position?: { latitude: number; longitude: number }): void {
    this.loading.set(true); this.error.set('');
    const requests = { assigned: this.alertsApi.assigned(), statistics: this.alertsApi.statistics() };
    forkJoin(requests).pipe(catchError(error => { this.fail(error); return EMPTY; })).subscribe(({ assigned, statistics }) => { this.assignedAlerts.set(this.unique(assigned)); this.statistics.set(statistics); this.loading.set(false); });
    if (position) this.loadNearby(position.latitude, position.longitude);
  }
  loadNearby(latitude: number, longitude: number): void { this.alertsApi.nearby(latitude, longitude).pipe(catchError(error => { this.fail(error); return EMPTY; })).subscribe(alerts => { const unique = this.unique(alerts); this.nearbyAlerts.set(unique); this.availableAlerts.set(unique.filter(alert => alert.status === 'active' && !alert.assigned_to)); }); }
  connect(): void { this.subscription?.unsubscribe(); this.subscription = this.websocket.messages$.subscribe(message => this.handleMessage(message)); this.websocket.connect(); this.websocketConnected.set(true); }
  destroy(): void { this.subscription?.unsubscribe(); this.subscription = undefined; this.websocket.disconnect(); this.websocketConnected.set(false); }
  runAction(action: 'accept' | 'start' | 'resolve', alertId: string): void {
    this.loading.set(true);
    this.alertsApi[action](alertId).pipe(catchError(error => { this.fail(error); return EMPTY; })).subscribe(alert => { this.upsert(alert); this.loading.set(false); });
  }
  claim(alertId: string): void {
    this.loading.set(true); this.error.set('');
    this.alertsApi.claim(alertId).pipe(catchError(error => { this.fail(error); return EMPTY; })).subscribe(alert => {
      this.upsert(alert);
      this.availableAlerts.update(alerts => alerts.filter(item => item.id !== alert.id));
      this.nearbyAlerts.update(alerts => this.unique([alert, ...alerts.filter(item => item.id !== alert.id)]));
      this.loading.set(false);
    });
  }
  private handleMessage(message: WebSocketAlertMessage): void {
    const data = message.data;
    if (message.type === 'initial_alerts' && Array.isArray(data)) { this.assignedAlerts.set(this.unique(data as Alert[])); return; }
    if (['alert_assigned', 'alert_updated', 'alert_resolved'].includes(message.type) && this.isAlert(data)) {
      this.upsert(data);
      this.availableAlerts.update(alerts => alerts.filter(item => item.id !== data.id));
    }
  }
  private upsert(alert: Alert): void { this.assignedAlerts.update(alerts => this.unique([alert, ...alerts.filter(item => item.id !== alert.id)])); }
  private unique(alerts: Alert[]): Alert[] { return [...new Map(alerts.map(alert => [alert.id, alert])).values()].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)); }
  private isAlert(value: unknown): value is Alert { return !!value && typeof value === 'object' && 'id' in value; }
  private fail(error: any): void { this.error.set(error?.error?.detail ?? 'Une opération secouriste a échoué.'); this.loading.set(false); }
}
