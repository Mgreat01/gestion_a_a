
import { Component, OnInit, inject } from '@angular/core';
import { interval, startWith, switchMap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { TacticalDashboard } from '../../components/tactical-dashboard/tactical-dashboard';
import { Alert, CreateAlertPayload, UpdateAlertPayload } from '../../../../models/alert';
import { Dashboard } from '../../../../core/dashboard';
import { Auth } from '../../../../core/auth';
import { AuthMeResponse } from '../../../../models/user';

@Component({
  selector: 'app-command-center',
  standalone: true,
  imports: [CommonModule, TacticalDashboard],
  templateUrl: './command-center.html'
})
export class CommandCenter implements OnInit {
  private dashboard = inject(Dashboard);
  private auth = inject(Auth);
  alerts: Alert[] = [];
  currentUser: AuthMeResponse | null = null;
  loading = true;
  error = '';

  ngOnInit(): void {
    this.auth.me().then(me => { this.currentUser = me; this.auth.setMe(me); }).catch(()=> {
      this.currentUser = this.auth.getMeCache();
    });
    interval(10000).pipe(startWith(0), switchMap(() => this.dashboard.getAlerts())).subscribe({
      next: alerts => { this.alerts = alerts; this.loading = false; },
      error: err => { this.error = err?.error?.detail || 'Erreur de chargement des alertes'; this.loading = false; }
    });
  }

  onRefresh(){ this.loading = true; this.dashboard.getAlerts().subscribe({next:a=>{this.alerts=a; this.loading=false;}, error:()=>this.loading=false}); }
  onCreateAlert(payload: CreateAlertPayload){ this.dashboard.createAlert(payload).subscribe({next:()=>this.onRefresh()}); }
  onUpdateAlert(event: {alertId:string, payload: UpdateAlertPayload}){ this.dashboard.updateAlert(event.alertId, event.payload).subscribe({next:()=>this.onRefresh()}); }
}
