import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-complete-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './complete-profile-component.html',
  styleUrl: './complete-profile-component.css',
})
export class CompleteProfileComponent {
private auth = inject(AuthService);
  private router = inject(Router);

  loading = false;

  async submit(form: NgForm) {
    if (form.invalid) return;
    this.loading = true;
    try {
      await this.auth.saveProfile(form.value);
      this.router.navigateByUrl('/home');
    } catch (e) {
      console.error(e);
    } finally {
      this.loading = false;
    }
  }
}
