import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import {
  UniversityService,
  University,
} from '../../services/university.service';
import { Observable } from 'rxjs';

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
  private universityService = inject(UniversityService);

  universities$: Observable<University[]> = this.universityService.getUniversities();

  loading = false;

  // form model
  name = '';
  selectedUniversity = '';
  selectedCourse = '';
  coursesForSelected: string[] = [];

  onUniversityChange(universityName: string, universities: University[]) {
    this.selectedUniversity = universityName;
    const uni = universities.find(u => u.name === universityName);
    this.coursesForSelected = uni?.courses ?? [];

    // reset course if not in this uni
    if (!this.coursesForSelected.includes(this.selectedCourse)) {
      this.selectedCourse = '';
    }
  }

  async submit(form: NgForm) {
    if (this.loading) return;

    // basic validation
    if (!this.name || !this.selectedUniversity || !this.selectedCourse) {
      return;
    }

    this.loading = true;
    try {
      await this.auth.saveProfile({
        name: this.name.trim(),
        university: this.selectedUniversity,
        course: this.selectedCourse,
      });

      await this.router.navigateByUrl('/home');
    } catch (e) {
      console.error('Error saving profile', e);
      this.loading = false;
    }
  }
}
