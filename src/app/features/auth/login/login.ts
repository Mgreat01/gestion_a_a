import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../../core/services/auth';
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
      .then(async response => {
        this.message = 'Connexion réussie ! Redirection...';
        this.error = '';
        this.auth.setToken(response.access_token);
        const me = await this.auth.me();
        this.auth.setMe(me);
        const redirectPath = me.role === 'admin' ? '/admin/dashboard' :
                             me.role === 'rescuer' ? '/rescuer/dashboard' :
                             '/user/dashboard';
        setTimeout(() => this.router.navigate([redirectPath]), 1000);
      })
      .catch(err => {
        this.message = '';
        const status = err.status;
        
        switch (status) {
          case 400:
            this.error = 'Requête invalide. Vérifiez vos informations.';
            break;
          case 401:
            this.error = 'Email ou mot de passe incorrect.';
            break;
          case 403:
            this.error = 'Accès refusé. Votre compte est peut-être désactivé.';
            break;
          case 404:
            this.error = 'Utilisateur non trouvé.';
            break;
          case 422:
            this.error = err.error?.detail || 'Données invalides.';
            break;
          case 500:
            this.error = 'Erreur serveur. Veuillez réessayer plus tard.';
            break;
          case 0:
            this.error = 'Erreur de connexion. Vérifiez votre internet.';
            break;
          default:
            this.error = err.error?.detail || err.error?.message || 'Erreur lors de la connexion.';
        }
        
        console.error('Login error:', err);
      });
  }
}
