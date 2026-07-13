import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertStateService } from '../../../../core/services/alert-state.service';
import { Auth } from '../../../../core/services/auth';
import { Dashboard } from '../../../../core/services/dashboard';
import { UserManagementService } from '../../../../core/services/user-management.service';
import { Alert, AlertSeverity, AlertStatus, UpdateAlertPayload } from '../../../../models/alert';
import { AuthMeResponse, User } from '../../../../models/user';
import { MapView } from '../../../dashboard/components/map-view/map-view';
import { DashboardSidebar, SidebarView } from '../../../dashboard/components/dashboard-sidebar/dashboard-sidebar';

@Component({
  selector: 'app-rescue-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, MapView, DashboardSidebar],
  templateUrl: './rescue-dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RescueDashboard implements OnInit, OnDestroy {
  private readonly alertState = inject(AlertStateService);
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly userService = inject(UserManagementService);
  private readonly dashboard = inject(Dashboard);

  readonly alerts = this.alertState.alerts;
  readonly loading = this.alertState.loading;
  readonly error = this.alertState.error;

  currentUser = signal<AuthMeResponse | null>(this.auth.getMeCache());
  users: User[] = [];
  alertStatusDraft: Record<string, 'active' | 'acknowledged' | 'resolved'> = {};

  activeView: SidebarView = 'dashboard';
  selectedAlert: Alert | null = null;
  search = '';
  severityFilter: 'all' | AlertSeverity = 'all';
  statusFilter: 'all' | AlertStatus = 'all';

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadUsers();
    this.alertState.loadAlerts();
    this.alertState.initializeRealtime(false);
  }

  ngOnDestroy(): void {
    this.alertState.destroyRealtime();
  }

  logout(): void {
    this.auth.removeToken();
    this.router.navigate(['/login']);
  }

  refreshAlerts(): void {
    this.alertState.loadAlerts();
  }

  updateAlert(alertId: string, status: 'active' | 'acknowledged' | 'resolved'): void {
    const payload: UpdateAlertPayload = { status };
    this.alertState.updateAlert(alertId, payload);
  }

  claimAlert(alertId: string): void {
    this.dashboard.claimAlert(alertId).subscribe({
      next: () => {
        this.alertState.loadAlerts();
      },
      error: (err) => {
        console.error('Failed to claim alert:', err);
      }
    });
  }

  toggleUser(user: User): void {
    this.userService.updateUserStatus(user.id!, !user.is_active).subscribe(() => {
      user.is_active = !user.is_active;
    });
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe((data) => {
      this.users = data;
    });
  }

  private async loadCurrentUser(): Promise<void> {
    try {
      const me = await this.auth.me();
      this.currentUser.set(me);
      this.auth.setMe(me);
    } catch {
      const cachedUser = this.auth.getMeCache();
      this.currentUser.set(cachedUser);
    }
  }

  get activeAlerts(): Alert[] {
    return this.alerts().filter((alert) => alert.status !== 'resolved');
  }

  get availableAlerts(): Alert[] {
    return this.alerts().filter((alert) => alert.status === 'active' && !alert.assigned_to);
  }

  get myAssignedAlerts(): Alert[] {
    return this.alerts().filter((alert) => alert.assigned_to === this.currentUser()?.id);
  }

  get sidebarItems(): { key: SidebarView; label: string }[] {
    return [
      { key: 'dashboard', label: 'Dashboard' },
      { key: 'alerts', label: 'Alertes' },
      { key: 'map', label: 'Carte' },
      { key: 'analytics', label: 'Analytics' },
      { key: 'profile', label: 'Profil' },
      { key: 'settings', label: 'Paramètres' },
    ];
  }

  get filteredAlerts(): Alert[] {
    const query = this.search.toLowerCase();

    return this.alerts().filter(alert => {
      const content = `
        ${alert.id}
        ${alert.address ?? ''}
        ${alert.assigned_to ?? ''}
        ${this.locationLabel(alert)}
      `.toLowerCase();

      return (
        (this.severityFilter === 'all' || alert.severity === this.severityFilter) &&
        (this.statusFilter === 'all' || alert.status === this.statusFilter) &&
        content.includes(query)
      );
    });
  }

  get criticalAlerts(): number {
    return this.alerts().filter(a => a.severity === 'high').length;
  }

  get acknowledgedAlerts(): number {
    return this.alerts().filter(a => a.status === 'acknowledged').length;
  }

  get resolvedAlerts(): number {
    return this.alerts().filter(a => a.status === 'resolved').length;
  }

  get mediumAlerts(): number {
    return this.alerts().filter(a => a.severity === 'medium').length;
  }

  get lowAlerts(): number {
    return this.alerts().filter(a => a.severity === 'low').length;
  }

  severityClass(severity: AlertSeverity): string {
    return {
      high: 'bg-red-50 text-red-800 border border-red-200',
      medium: 'bg-amber-50 text-amber-800 border border-amber-200',
      low: 'bg-emerald-50 text-emerald-800 border border-emerald-200'
    }[severity];
  }

  locationLabel(alert: Alert): string {
    if (alert.address) {
      return alert.address;
    }

    const lat = alert.location?.coordinates?.[1] ?? alert.latitude;
    const lng = alert.location?.coordinates?.[0] ?? alert.longitude;
    return `${lat}, ${lng}`;
  }
}
