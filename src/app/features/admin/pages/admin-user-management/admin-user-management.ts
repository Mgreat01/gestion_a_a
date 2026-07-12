import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { User, UserRole } from '../../../../models/user';
import { UserManagementService } from '../../../../core/services/user-management.service';

@Component({
  selector: 'app-admin-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './admin-user-management.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUserManagementComponent {
  private readonly usersApi = inject(UserManagementService);
  readonly users = signal<User[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly query = signal('');
  readonly role = signal<'all' | UserRole>('all');
  readonly activity = signal<'all' | 'active' | 'inactive'>('all');
  readonly verification = signal<'all' | 'verified' | 'unverified'>('all');

  readonly filteredUsers = computed(() => this.usersApi.searchUsers(this.users(), this.query()).filter(user =>
    (this.role() === 'all' || user.role === this.role()) &&
    (this.activity() === 'all' || (this.activity() === 'active') === !!user.is_active) &&
    (this.verification() === 'all' || (this.verification() === 'verified') === this.isVerified(user)),
  ));

  ngOnInit(): void { this.loadUsers(); }

  loadUsers(): void {
    this.loading.set(true); this.error.set('');
    this.usersApi.getUsers().subscribe({
      next: users => { this.users.set(users); this.loading.set(false); },
      error: error => { this.error.set(error?.error?.detail ?? 'Impossible de charger les utilisateurs.'); this.loading.set(false); },
    });
  }

  toggleActivation(user: User): void {
    if (!user.id) return;
    this.usersApi.updateUserStatus(user.id, !user.is_active).subscribe({
      next: updated => this.replaceUser({ ...user, ...updated, is_active: !user.is_active }),
      error: error => this.error.set(error?.error?.detail ?? 'Mise à jour impossible.'),
    });
  }

  verifyEmail(user: User): void {
    if (!user.id) return;
    this.usersApi.verifyEmail(user.id).subscribe({
      next: updated => this.replaceUser({ ...user, ...updated, email_verified: true, is_verified: true }),
      error: error => this.error.set(error?.error?.detail ?? 'Vérification impossible.'),
    });
  }

  isVerified(user: User): boolean { return !!(user.email_verified ?? user.is_verified); }
  private replaceUser(updated: User): void { this.users.update(users => users.map(user => user.id === updated.id ? updated : user)); }
}
