import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { CommandCenter } from './features/dashboard/pages/command-center/command-center';
import { RescueDashboard } from './features/rescue-team/pages/rescue-dashboard/rescue-dashboard';
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
    component: RescueDashboard,
    canActivate: [authGuard],
    data: { roles: ['rescuer'] },
  },
  { path: 'user', redirectTo: '/user/dashboard', pathMatch: 'full' },
];
