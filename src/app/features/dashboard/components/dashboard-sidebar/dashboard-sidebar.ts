import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

export type SidebarView =
  | 'dashboard'
  | 'alerts'
  | 'map'
  | 'analytics'
  | 'profile'
  | 'settings';

type SidebarItem = {
  key: SidebarView;
  label: string;
  icon: string;
  hint: string;
};

@Component({
  selector: 'app-dashboard-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-sidebar.html'
})
export class DashboardSidebar {
  @Input() role: 'admin' | 'user' = 'user';
  @Input() activeView: SidebarView = 'dashboard';

  @Output() viewChange = new EventEmitter<SidebarView>();

  get items(): SidebarItem[] {
    return this.role === 'admin'
      ? [
          { key: 'dashboard', label: 'Dashboard', icon: 'space_dashboard', hint: 'Vue globale' },
          { key: 'alerts', label: 'Alertes', icon: 'notification_important', hint: 'Gestion des incidents' },
          { key: 'map', label: 'Carte live', icon: 'map', hint: 'Vue tactique' },
          { key: 'analytics', label: 'Analytics', icon: 'monitoring', hint: 'Statistiques' },
          { key: 'profile', label: 'Profil', icon: 'person', hint: 'Compte admin' },
          { key: 'settings', label: 'Paramètres', icon: 'settings', hint: 'Préférences' }
        ]
      : [
          { key: 'dashboard', label: 'Accueil', icon: 'home', hint: 'Résumé personnel' },
          { key: 'alerts', label: 'Mes alertes', icon: 'notifications_active', hint: 'Historique' },
          { key: 'map', label: 'Carte', icon: 'map', hint: 'Position & alertes' },
          { key: 'profile', label: 'Profil', icon: 'person', hint: 'Compte' },
          { key: 'settings', label: 'Paramètres', icon: 'settings', hint: 'Préférences' }
        ];
  }
}
