import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { EMPTY, Subscription, catchError, switchMap, timer } from 'rxjs';
import { CommonModule } from '@angular/common';

import { TacticalDashboard } from '../../components/tactical-dashboard/tactical-dashboard';

import { Alert, CreateAlertPayload, UpdateAlertPayload } from '../../../../models/alert';

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
  private alertsSubscription?: Subscription;

  alerts: Alert[] = [];

  currentUser: AuthMeResponse | null = this.auth.getMeCache();

  loading = true;

  error = '';

  ngOnInit(): void {
    this.currentUser = this.auth.getMeCache();
    this.loadAlerts();
    void this.loadCurrentUser();
  }

  ngOnDestroy(): void {
    this.alertsSubscription?.unsubscribe();
  }

  private async loadCurrentUser(): Promise<void> {
    try {
      const me = await this.auth.me();

      this.currentUser = me;

      this.auth.setMe(me);
    } catch {
      this.currentUser = this.auth.getMeCache();
    }
  }

  private loadAlerts(): void {
    this.alertsSubscription?.unsubscribe();

    this.loading = true;

    this.alertsSubscription = timer(0, 10000)
      .pipe(
        switchMap(() =>
          this.dashboard.getAlerts().pipe(
            catchError((err) => {
              this.error = err?.error?.detail ?? 'Erreur de chargement des alertes';
              this.loading = false;
              return EMPTY;
            }),
          ),
        ),
      )
      .subscribe({
        next: (alerts) => {
          console.log('Utilisateur :', this.currentUser);

          console.log('Alertes reçues :', alerts);

          this.alerts = alerts;

          this.error = '';

          this.loading = false;
        },
      });
  }

  onRefresh(): void {
    this.loading = true;

    this.dashboard.getAlerts().subscribe({
      next: (alerts) => {
        this.alerts = alerts;

        this.error = '';

        this.loading = false;
      },

      error: () => {
        this.loading = false;
      },
    });
  }

  onCreateAlert(payload: CreateAlertPayload): void {
    this.dashboard.createAlert(payload).subscribe({
      next: () => this.onRefresh(),
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
        next: () => this.onRefresh(),
      });
  }
}
