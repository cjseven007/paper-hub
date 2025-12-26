import { Component, inject } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [],
  templateUrl: './login-component.html',
  styleUrl: './login-component.css',
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = false;

  async signIn() {
    if (this.loading) return;
    this.loading = true;
    try {
      await this.auth.signInWithGoogle();
      await this.router.navigateByUrl('/home');
    } catch (e) {
      console.error('Login failed', e);
      this.loading = false;
    }
  }
}
