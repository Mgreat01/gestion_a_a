import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Alert, AlertStatus } from '../../../../models/alert';
import { AuthMeResponse } from '../../../../models/user';
import { RescuerStateService } from '../../store/rescuer-state.service';
import { LocationService } from '../../../../core/services/location.service';
import { Auth } from '../../../../core/services/auth';
import { MapView } from '../../../dashboard/components/map-view/map-view';
import { DashboardSidebar, SidebarView } from '../../../dashboard/components/dashboard-sidebar/dashboard-sidebar';

@Component({ selector: 'app-rescuer-dashboard', standalone: true, imports: [CommonModule, FormsModule, MapView, DashboardSidebar], templateUrl: './rescuer-dashboard.html', changeDetection: ChangeDetectionStrategy.OnPush })
export class RescuerDashboardComponent implements OnInit, OnDestroy {
  private readonly state = inject(RescuerStateService);
  private readonly location = inject(LocationService);
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  readonly assignedAlerts = this.state.assignedAlerts;
  readonly nearbyAlerts = this.state.nearbyAlerts;
  readonly statistics = this.state.statistics;
  readonly loading = this.state.loading;
  readonly error = this.state.error;
  readonly statusFilter = signal<'all' | AlertStatus>('all');
  readonly severityFilter = signal<'all' | Alert['severity']>('all');
  readonly search = signal('');
  readonly selectedAlert = signal<Alert | null>(null);
  readonly currentUser = signal<AuthMeResponse | null>(this.auth.getMeCache());
  activeView: SidebarView = 'dashboard';
  readonly visibleAlerts = computed(() => {
    const query = this.search().trim().toLowerCase();
    return this.assignedAlerts().filter(alert =>
      (this.statusFilter() === 'all' || alert.status === this.statusFilter()) &&
      (this.severityFilter() === 'all' || alert.severity === this.severityFilter()) &&
      (!query || `${alert.id} ${alert.address ?? ''} ${alert.assigned_to ?? ''}`.toLowerCase().includes(query)),
    );
  });
  ngOnInit(): void { this.state.load(); this.state.connect(); void this.loadLocation(); }
  ngOnDestroy(): void { this.state.destroy(); }
  refresh(): void { this.state.load(); }
  logout(): void { this.auth.removeToken(); void this.router.navigate(['/login']); }
  selectAlert(alert: Alert): void { this.selectedAlert.set(alert); }
  closeDrawer(): void { this.selectedAlert.set(null); }
  actionFor(alert: Alert): { label: string; action: 'accept' | 'start' | 'resolve' } | null {
    if (alert.status === 'active') return { label: 'Accepter', action: 'accept' };
    if (alert.status === 'acknowledged') return { label: 'Démarrer intervention', action: 'start' };
    if (alert.status === 'assigned') return { label: 'Résoudre', action: 'resolve' };
    return null;
  }
  act(alert: Alert): void { const action = this.actionFor(alert); if (action) this.state.runAction(action.action, alert.id); }
  locationLabel(alert: Alert): string { return alert.address || `${alert.location?.coordinates?.[1] ?? alert.latitude}, ${alert.location?.coordinates?.[0] ?? alert.longitude}`; }
  elapsed(alert: Alert): string { const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(alert.created_at)) / 60000)); return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`; }
  severityClass(severity: Alert['severity']): string { return ({ high: 'bg-red-50 text-red-800 border border-red-200', medium: 'bg-amber-50 text-amber-800 border border-amber-200', low: 'bg-emerald-50 text-emerald-800 border border-emerald-200' })[severity]; }
  get activeCount(): number { return this.assignedAlerts().filter(alert => alert.status !== 'resolved').length; }
  get criticalCount(): number { return this.assignedAlerts().filter(alert => alert.severity === 'high' && alert.status !== 'resolved').length; }
  get interventionCount(): number { return this.assignedAlerts().filter(alert => alert.status === 'assigned').length; }
  get sidebarItems(): { key: SidebarView; label: string }[] { return [{ key: 'dashboard', label: 'Opérations' }, { key: 'alerts', label: 'Interventions' }, { key: 'map', label: 'Carte' }, { key: 'analytics', label: 'Statistiques' }, { key: 'profile', label: 'Profil' }]; }
  private async loadLocation(): Promise<void> { try { const position = await this.location.getCurrentPosition(); this.state.loadNearby(position.latitude, position.longitude); } catch { /* Nearby alerts remain unavailable until location permission is granted. */ } }
}
