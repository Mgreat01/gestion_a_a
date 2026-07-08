import { Component, NgZone, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { EMPTY, Subscription, catchError, switchMap, timer } from 'rxjs';
import { CommonModule } from '@angular/common';

import { TacticalDashboard } from '../../components/tactical-dashboard/tactical-dashboard';

import {
  AdminAlertNotification,
  Alert,
  CreateAlertPayload,
  UpdateAlertPayload,
} from '../../../../models/alert';

import { Dashboard } from '../../../../core/services/dashboard';
import { Auth } from '../../../../core/services/auth';
import { AuthMeResponse } from '../../../../models/user';

@Component({
  selector: 'app-command-center',
  standalone: true,
  imports: [CommonModule, TacticalDashboard],
  templateUrl: './command-center.html',
})
export class CommandCenter implements OnInit, OnDestroy {
  private dashboard = inject(Dashboard);
  private auth = inject(Auth);
  private zone = inject(NgZone);
  private alertsSubscription?: Subscription;
  private adminReconnectSubscription?: Subscription;
  private adminNotificationsSocket?: WebSocket;
  private readonly adminNotificationsLimit = 20;
  private readonly adminReconnectDelayMs = 3000;
  private isDestroyed = false;

  alerts = signal<Alert[]>([]);
  adminNotifications = signal<AdminAlertNotification[]>([]);

  currentUser = signal<AuthMeResponse | null>(this.auth.getMeCache());

  loading = signal(true);

  error = signal('');

  ngOnInit(): void {
    this.isDestroyed = false;
    this.loadAlerts();
    void this.loadCurrentUser();
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    this.alertsSubscription?.unsubscribe();
    this.disconnectAdminNotifications();
  }

  private async loadCurrentUser(): Promise<void> {
    let userLoaded = false;

    try {
      const me = await this.auth.me();

      this.currentUser.set(me);

      this.auth.setMe(me);
      userLoaded = true;
    } catch {
      this.currentUser.set(this.auth.getMeCache());
    } finally {
      if (userLoaded) {
        this.connectAdminNotifications();
      } else {
        this.disconnectAdminNotifications();
      }
    }
  }

  private loadAlerts(): void {
    this.alertsSubscription?.unsubscribe();

    this.loading.set(true);

    this.alertsSubscription = timer(0, 10000)
      .pipe(
        switchMap(() =>
          this.dashboard.getAlerts().pipe(
            catchError((err) => {
              this.error.set(err?.error?.detail ?? 'Erreur de chargement des alertes');
              this.loading.set(false);
              return EMPTY;
            }),
          ),
        ),
      )
      .subscribe({
        next: (alerts) => {
          console.log('Utilisateur :', this.currentUser());

          console.log('Alertes reçues :', alerts);

          this.alerts.set(this.sortAlertsByDate(alerts));

          this.error.set('');

          this.loading.set(false);
        },
      });
  }

  onRefresh(): void {
    this.refreshAlerts(true);
  }

  clearAdminNotifications(): void {
    this.adminNotifications.set([]);
  }

  private refreshAlerts(showLoading: boolean): void {
    if (showLoading) {
      this.loading.set(true);
    }

    this.dashboard.getAlerts().subscribe({
      next: (alerts) => {
        this.alerts.set(this.sortAlertsByDate(alerts));

        this.error.set('');

        this.loading.set(false);
      },

      error: () => {
        this.loading.set(false);
      },
    });
  }

  private connectAdminNotifications(): void {
    if (this.currentUser()?.role !== 'admin') {
      this.disconnectAdminNotifications();
      return;
    }

    if (this.adminNotificationsSocket) {
      return;
    }

    const token = this.auth.getToken();

    if (!token) {
      console.warn('[Admin alerts WS] Connexion annulee: token absent.');
      return;
    }

    this.adminReconnectSubscription?.unsubscribe();
    this.adminReconnectSubscription = undefined;

    const ws = new WebSocket(
      `ws://localhost:8000/alerts/ws/admin?token=${encodeURIComponent(token)}`,
    );

    this.adminNotificationsSocket = ws;

    ws.onopen = () => {
      console.info('[Admin alerts WS] Connexion ouverte.');
    };

    ws.onmessage = (event) => {
      this.zone.run(() => {
        console.info('[Admin alerts WS] Message recu:', event.data);
        this.handleAdminNotificationMessage(event.data);
        this.refreshAlerts(false);
      });
    };

    ws.onclose = (event) => {
      console.warn('[Admin alerts WS] Connexion fermee:', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
      });

      if (this.adminNotificationsSocket === ws) {
        this.adminNotificationsSocket = undefined;
      }

      this.scheduleAdminNotificationsReconnect();
    };

    ws.onerror = (event) => {
      console.error('[Admin alerts WS] Erreur WebSocket:', event);
    };
  }

  private disconnectAdminNotifications(): void {
    this.adminReconnectSubscription?.unsubscribe();
    this.adminReconnectSubscription = undefined;
    this.adminNotificationsSocket?.close();
    this.adminNotificationsSocket = undefined;
  }

  private scheduleAdminNotificationsReconnect(): void {
    if (this.isDestroyed || this.currentUser()?.role !== 'admin' || this.adminNotificationsSocket) {
      return;
    }

    this.adminReconnectSubscription?.unsubscribe();
    console.info(
      `[Admin alerts WS] Reconnexion automatique dans ${
        this.adminReconnectDelayMs / 1000
      } secondes.`,
    );

    this.adminReconnectSubscription = timer(this.adminReconnectDelayMs).subscribe(() => {
      if (!this.isDestroyed && this.currentUser()?.role === 'admin') {
        this.connectAdminNotifications();
      }
    });
  }

  private handleAdminNotificationMessage(data: string): void {
    const parsed = this.parseAdminNotificationMessage(data);

    if (parsed?.type === 'initial_alerts' && Array.isArray(parsed.data)) {
      const alerts = parsed.data
        .map((alert) => this.toAlert(alert))
        .filter((alert): alert is Alert => alert !== null);

      if (alerts.length > 0) {
        this.alerts.set(this.uniqueLatestAlerts(alerts));
      }

      this.adminNotifications.set(
        this.uniqueLatestNotifications(
          this.sortNotificationsByDate(parsed.data.map((alert) => this.toAdminNotification(alert))),
        ),
      );
      return;
    }

    if (parsed?.type === 'new_alert' && parsed.data != null) {
      const alert = this.toAlert(parsed.data);

      if (alert) {
        this.alerts.update((alerts) => this.uniqueLatestAlerts([alert, ...alerts]));
      }

      this.adminNotifications.set(
        this.uniqueLatestNotifications([
          this.toAdminNotification(parsed.data),
          ...this.adminNotifications(),
        ]),
      );
      return;
    }

    console.warn('[Admin alerts WS] Message ignore: format inconnu.', parsed);
  }

  private parseAdminNotificationMessage(data: string): { type?: string; data?: unknown } | null {
    try {
      const parsed = JSON.parse(data);
      return typeof parsed === 'object' && parsed !== null
        ? (parsed as { type?: string; data?: unknown })
        : null;
    } catch {
      console.warn('[Admin alerts WS] Message ignore: JSON invalide.', data);
      return null;
    }
  }

  private toAdminNotification(alert: unknown): AdminAlertNotification {
    if (typeof alert !== 'object' || alert === null) {
      return { message: String(alert) };
    }

    const notification = alert as AdminAlertNotification;

    return {
      ...notification,
      alert_id: notification.alert_id ?? notification.id,
    };
  }

  private toAlert(value: unknown): Alert | null {
    if (typeof value !== 'object' || value === null || !('id' in value)) {
      return null;
    }

    return value as Alert;
  }

  private uniqueLatestAlerts(alerts: Alert[]): Alert[] {
    const seen = new Set<string>();

    return this.sortAlertsByDate(alerts).filter((alert) => {
      if (seen.has(alert.id)) {
        return false;
      }

      seen.add(alert.id);
      return true;
    });
  }

  private sortAlertsByDate(alerts: Alert[]): Alert[] {
    return [...alerts].sort((a, b) => this.alertTime(b) - this.alertTime(a));
  }

  private alertTime(alert: Alert): number {
    const time = Date.parse(alert.created_at);
    return Number.isNaN(time) ? 0 : time;
  }

  private uniqueLatestNotifications(
    notifications: AdminAlertNotification[],
  ): AdminAlertNotification[] {
    const seen = new Set<string>();

    return notifications
      .filter((notification) => {
        const key = this.notificationKey(notification);

        if (seen.has(key)) {
          return false;
        }

        seen.add(key);
        return true;
      })
      .slice(0, this.adminNotificationsLimit);
  }

  private sortNotificationsByDate(
    notifications: AdminAlertNotification[],
  ): AdminAlertNotification[] {
    return [...notifications].sort((a, b) => this.notificationTime(b) - this.notificationTime(a));
  }

  private notificationKey(notification: AdminAlertNotification): string {
    return String(
      notification.alert_id ??
        notification.id ??
        notification.created_at ??
        notification.message ??
        JSON.stringify(notification),
    );
  }

  private notificationTime(notification: AdminAlertNotification): number {
    const time = notification.created_at ? Date.parse(notification.created_at) : NaN;
    return Number.isNaN(time) ? 0 : time;
  }

  onCreateAlert(payload: CreateAlertPayload): void {
    this.dashboard.createAlert(payload).subscribe({
      next: (alert) => {
        this.alerts.update((alerts) => this.uniqueLatestAlerts([alert, ...alerts]));
        this.refreshAlerts(false);
      },
    });
  }

  onUpdateAlert(event: {
    alertId: string;

    payload: UpdateAlertPayload;
  }): void {
    this.dashboard
      .updateAlert(
        event.alertId,

        event.payload,
      )
      .subscribe({
        next: (updatedAlert) => {
          const alert = this.toAlert(updatedAlert);

          if (alert) {
            this.alerts.update((alerts) =>
              this.uniqueLatestAlerts([alert, ...alerts.filter((item) => item.id !== alert.id)]),
            );
          }

          this.refreshAlerts(false);
        },
      });
  }
}
