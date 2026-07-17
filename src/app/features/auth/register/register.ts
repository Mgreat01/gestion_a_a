import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../../core/services/auth';
import { User } from '../../../models/user';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class Register {
  user: User = {
    username: '',
    email: '',
    password: '',
    role: 'user'
  };

  message = '';
  error = '';

  constructor(private auth: Auth, private router: Router) {}

  onSubmit(): void {
    this.auth.register(this.user)
      .then(() => {
        this.message = 'Inscription réussie ! Redirection...';
        this.error = '';
        this.router.navigate(['/login']);
      })
      .catch(err => {
        this.error = err.error?.detail || 'Erreur lors de l\'inscription';
        this.message = '';
        console.error(err.error?.detail);
      });
  }
}
