import { Injectable, computed, inject, signal } from '@angular/core';
import { EMPTY, Subscription, catchError } from 'rxjs';

import {
  AdminAlertNotification,
  Alert,
  CreateAlertPayload,
  CreateEncryptedAlertRequest,
  DashboardStatistics,
  UpdateAlertPayload,
} from '../../models/alert';
import { Dashboard } from './dashboard';
import { CryptoService } from './crypto.service';
import { KeyStorageService } from './key-storage.service';
import { LocationService } from './location.service';
import { StatisticsService } from './statistics.service';
import { WebsocketService } from './websocket.service';

@Injectable({ providedIn: 'root' })
export class AlertStateService {
  private readonly dashboard = inject(Dashboard);
  private readonly crypto = inject(CryptoService);
  private readonly keyStorage = inject(KeyStorageService);
  private readonly location = inject(LocationService);
  private readonly statisticsService = inject(StatisticsService);
  private readonly websocket = inject(WebsocketService);
  private readonly notificationsLimit = 20;

  readonly alerts = signal<Alert[]>([]);
  readonly notifications = signal<AdminAlertNotification[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly statistics = computed<DashboardStatistics>(() =>
    this.statisticsService.calculate(this.alerts()),
  );

  private websocketSubscription?: Subscription;

  initializeRealtime(isAdmin: boolean): void {
    this.loadAlerts();

    this.websocketSubscription?.unsubscribe();

    if (!isAdmin) {
      this.websocket.disconnect();
      return;
    }

    this.websocketSubscription = this.websocket.messages$.subscribe((message) =>
      this.handleSocketMessage(message),
    );
    this.websocket.connect('/alerts/ws/admin');
  }

  destroyRealtime(): void {
    this.websocketSubscription?.unsubscribe();
    this.websocketSubscription = undefined;
    this.websocket.disconnect();
  }

  loadAlerts(): void {
    this.loading.set(true);

    this.dashboard
      .getAlerts()
      .pipe(
        catchError((err) => {
          this.error.set(err?.error?.detail ?? 'Erreur de chargement des alertes');
          this.loading.set(false);
          return EMPTY;
        }),
      )
      .subscribe((alerts) => {
        this.alerts.set(this.uniqueLatestAlerts(alerts));
        this.error.set('');
        this.loading.set(false);
      });
  }

  clearNotifications(): void {
    this.notifications.set([]);
  }

  async createEncryptedAlert(request: CreateEncryptedAlertRequest): Promise<void> {
    this.loading.set(true);

    try {
      const [position, recipientPublicKey] = await Promise.all([
        this.location.getCurrentPosition(),
        this.getRecipientPublicKey(),
      ]);
      const encrypted = await this.crypto.encryptForRecipient(request.message, recipientPublicKey);
      const payload: CreateAlertPayload = {
        ...encrypted,
        latitude: position.latitude,
        longitude: position.longitude,
        accuracy: position.accuracy,
        severity: request.severity,
      };

      this.dashboard.createAlert(payload).subscribe({
        next: (alert) => {
          this.alerts.update((alerts) => this.uniqueLatestAlerts([alert, ...alerts]));
          this.error.set('');
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.detail ?? "Erreur d'envoi de l'alerte");
          this.loading.set(false);
        },
      });
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : String(error));
      this.loading.set(false);
    }
  }

  updateAlert(alertId: string, payload: UpdateAlertPayload): void {
    this.dashboard.updateAlert(alertId, payload).subscribe({
      next: (updatedAlert) => {
        const alert = this.toAlert(updatedAlert);

        if (alert) {
          this.alerts.update((alerts) =>
            this.uniqueLatestAlerts([alert, ...alerts.filter((item) => item.id !== alert.id)]),
          );
        }
      },
      error: (err) => this.error.set(err?.error?.detail ?? "Erreur de mise a jour de l'alerte"),
    });
  }

  private handleSocketMessage(message: { type?: string; data?: unknown }): void {
    if (message.type === 'initial_alerts' && Array.isArray(message.data)) {
      const alerts = message.data
        .map((alert) => this.toAlert(alert))
        .filter((alert): alert is Alert => alert !== null);

      this.alerts.set(this.uniqueLatestAlerts(alerts));
      this.notifications.set(
        this.uniqueLatestNotifications(message.data.map((alert) => this.toNotification(alert))),
      );
      return;
    }

    if (message.type === 'new_alert' && message.data != null) {
      const alert = this.toAlert(message.data);

      if (alert) {
        this.alerts.update((alerts) => this.uniqueLatestAlerts([alert, ...alerts]));
      }

      this.notifications.set(
        this.uniqueLatestNotifications([this.toNotification(message.data), ...this.notifications()]),
      );
    }
  }

  private async getRecipientPublicKey(): Promise<JsonWebKey> {
    const existingRecipientKey = await this.keyStorage.getRecipientPublicKey();

    if (existingRecipientKey) {
      return existingRecipientKey;
    }

    const existingPublicKey = await this.keyStorage.getPublicKey();

    if (existingPublicKey) {
      return existingPublicKey;
    }

    const keyPair = await this.crypto.generateKeyPair();
    const exported = await this.crypto.exportKeyPair(keyPair);

    await Promise.all([
      this.keyStorage.savePrivateKey(exported.privateKey),
      this.keyStorage.savePublicKey(exported.publicKey),
      this.keyStorage.saveRecipientPublicKey(exported.publicKey),
    ]);

    return exported.publicKey;
  }

  private toNotification(alert: unknown): AdminAlertNotification {
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

    return this.sortNotificationsByDate(notifications)
      .filter((notification) => {
        const key = this.notificationKey(notification);

        if (seen.has(key)) {
          return false;
        }

        seen.add(key);
        return true;
      })
      .slice(0, this.notificationsLimit);
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
}
