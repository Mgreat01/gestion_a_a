import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';   
import { User } from '../../../models/user';
import { Auth } from '../../../core/auth';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,             
  imports: [FormsModule,CommonModule],        
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class Register {
  user: User = {
    username: '',
    email: '',
    password: ''
  };

  message: string = '';
  error: string = '';

  constructor(private auth: Auth , private router: Router) {}

  onSubmit(): void {
    this.auth.register(this.user)
      .then(response => {
        let d = response.access_token;
        //let d = 's'
        this.message = `Inscription réussie ! Redirection... ${d}`;
        console.log(response);
        this.router.navigate(['/login']);
      })
      .catch(err => {
        this.error = err.error?.detail || 'Erreur lors de l\'inscription';
        this.message = '';
        console.error(err.error?.detail);
        
      });
  }
}