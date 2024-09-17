import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { take } from 'rxjs/operators';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatProgressSpinnerModule
  ]
})
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  isLogin = true;
  email = '';
  password = '';
  name = '';
  isEventOwner = false;
  loader = false;
  isCheckingAuth = true;

  ngOnInit() {
    this.authService.getCurrentUser().pipe(take(1)).subscribe(user => {
      if (user) {
        console.log('User already logged in, redirecting to home');
        this.router.navigate(['/home']);
      } else {
        this.isCheckingAuth = false;
      }
    });
  }

  toggleMode() {
    this.isLogin = !this.isLogin;
  }

  async onSubmit() {
    if (this.isCheckingAuth) {
      return;
    }

    this.loader = true;

    try {
      if (this.isLogin) {
        await this.authService.login(this.email, this.password);
      } else {
        await this.authService.register(this.email, this.password, this.name, this.isEventOwner);
      }
      this.router.navigate(['/home']);
    } catch (error) {
      console.error(this.isLogin ? 'Login error:' : 'Registration error:', error);
      // Hata mesajını kullanıcıya göster
      // Örneğin: this.errorMessage = 'Invalid email or password';
    } finally {
      this.loader = false;
    }
  }
}