import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';

import { AlertStateService } from '../../../../core/services/alert-state.service';
import { Auth } from '../../../../core/services/auth';
import { AssignAlertPayload, CreateEncryptedAlertRequest, UpdateAlertPayload } from '../../../../models/alert';
import { AuthMeResponse } from '../../../../models/user';
import { TacticalDashboard } from '../../components/tactical-dashboard/tactical-dashboard';

@Component({
  selector: 'app-command-center',
  standalone: true,
  imports: [CommonModule, TacticalDashboard],
  templateUrl: './command-center.html',
})
export class CommandCenter implements OnInit, OnDestroy {
  private readonly alertState = inject(AlertStateService);
  private readonly auth = inject(Auth);

  readonly alerts = this.alertState.alerts;
  readonly adminNotifications = this.alertState.notifications;
  readonly loading = this.alertState.loading;
  readonly error = this.alertState.error;
  readonly statistics = this.alertState.statistics;

  readonly currentUser = signal<AuthMeResponse | null>(this.auth.getMeCache());

  async ngOnInit(): Promise<void> {
    await this.loadCurrentUser();
  }

  ngOnDestroy(): void {
    this.alertState.destroyRealtime();
  }

  onRefresh(): void {
    this.alertState.loadAlerts();
  }

  clearAdminNotifications(): void {
    this.alertState.clearNotifications();
  }

  onCreateAlert(request: CreateEncryptedAlertRequest): void {
    void this.alertState.createEncryptedAlert(request);
  }

  onUpdateAlert(event: { alertId: string; payload: UpdateAlertPayload }): void {
    this.alertState.updateAlert(event.alertId, event.payload);
  }

  onAssignAlert(event: { alertId: string; payload: AssignAlertPayload }): void {
    this.alertState.assignAlert(event.alertId, event.payload);
  }

  private async loadCurrentUser(): Promise<void> {
    try {
      const me = await this.auth.me();
      this.currentUser.set(me);
      this.auth.setMe(me);
      this.alertState.initializeRealtime(me.role === 'admin');
    } catch {
      const cachedUser = this.auth.getMeCache();
      this.currentUser.set(cachedUser);
      this.alertState.initializeRealtime(cachedUser?.role === 'admin');
    }
  }
}
