import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../../core/auth';
import { User } from '../../../models/user';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  credentials = {
    email: '',
    password: ''
  };

  message = '';
  error = '';

  constructor(
    private auth: Auth,
    private router: Router
  ) {}

  onSubmit(): void {
    const user: User = {
      username: '',
      email: this.credentials.email,
      password: this.credentials.password
    };

    this.auth.login(user)
      .then(response => {
        this.message = 'Connexion réussie ! Redirection...';
        this.error = '';
        this.auth.setToken(response.access_token);
        setTimeout(() => this.router.navigate(['/dashboard']), 1000);
      })
      .catch(err => {
        this.error = err.error?.message || 'Email ou mot de passe incorrect';
        this.message = '';
        console.error(err);
      });
  }
}
