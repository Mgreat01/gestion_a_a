import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { CommandCenter } from './features/dashboard/pages/command-center/command-center';
import { AdminUserManagementComponent } from './features/admin/pages/admin-user-management/admin-user-management';
import { RescuerDashboardComponent } from './features/rescuer/pages/rescuer-dashboard/rescuer-dashboard';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'dashboard', component: CommandCenter, canActivate: [authGuard] },
  {
    path: 'admin/dashboard',
    component: CommandCenter,
    canActivate: [authGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'user/dashboard',
    component: CommandCenter,
    canActivate: [authGuard],
    data: { roles: ['user'] },
  },
  {
    path: 'rescuer/dashboard',
    component: RescuerDashboardComponent,
    canActivate: [authGuard],
    data: { roles: ['rescuer', 'rescue_team'] },
  },
  { path: 'rescuer/alerts', component: RescuerDashboardComponent, canActivate: [authGuard], data: { roles: ['rescuer', 'rescue_team'] } },
  { path: 'admin/users', component: AdminUserManagementComponent, canActivate: [authGuard], data: { roles: ['admin'] } },
  { path: 'admin/alerts', component: CommandCenter, canActivate: [authGuard], data: { roles: ['admin'] } },
  { path: 'user', redirectTo: '/user/dashboard', pathMatch: 'full' },
];
