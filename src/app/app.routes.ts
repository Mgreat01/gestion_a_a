import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { CommandCenter } from './features/dashboard/pages/command-center/command-center';
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
  { path: 'user', redirectTo: '/user/dashboard', pathMatch: 'full' },
];
