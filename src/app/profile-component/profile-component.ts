import { Component, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';

import { AuthService, UserProfile } from '../auth/auth.service';
import {
  UniversityService,
  University,
} from '../services/university.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-component.html',
})
export class ProfileComponent {
  private auth = inject(AuthService);
  private universityService = inject(UniversityService);

  // Signals wrapping the Firestore streams (zoneless-friendly)
  private profileSig = toSignal(this.auth.profile$, {
    initialValue: null as UserProfile | null,
  });

  private universitiesSig = toSignal(
    this.universityService.getUniversities(),
    { initialValue: [] as University[] }
  );

  // Used by template
  saving = false;

  // Form model
  name = '';
  selectedUniversity = '';
  selectedCourse = '';
  coursesForSelected: string[] = [];

  private formInitialized = false;

  constructor() {
    // Effect runs whenever profile or universities change
    effect(() => {
      const profile = this.profileSig();
      const universities = this.universitiesSig();

      console.log('[ProfileComponent effect] profile:', profile);
      console.log('[ProfileComponent effect] universities:', universities);

      if (profile && universities.length && !this.formInitialized) {
        this.name = profile.name ?? '';
        this.selectedUniversity = profile.university ?? '';
        this.selectedCourse = profile.course ?? '';
        this.updateCoursesForSelected();
        this.formInitialized = true;
      }
    });
  }

  // Getters used by your template -----------------------------------

  get profile(): UserProfile | null {
    return this.profileSig();
  }

  get universities(): University[] {
    return this.universitiesSig();
  }

  get loading(): boolean {
    // Spinner while profile or universities not ready
    return !this.profile || !this.universities.length;
  }

  // -----------------------------------------------------------------

  private updateCoursesForSelected() {
    const unis = this.universities;
    if (!this.selectedUniversity || !unis.length) {
      this.coursesForSelected = [];
      return;
    }

    const uni = unis.find(u => u.name === this.selectedUniversity);
    this.coursesForSelected = uni?.courses ?? [];

    if (!this.coursesForSelected.includes(this.selectedCourse)) {
      this.selectedCourse = '';
    }
  }

  onUniversityChange(universityName: string) {
    this.selectedUniversity = universityName;
    this.updateCoursesForSelected();
  }

  async submit(form: NgForm) {
    if (this.saving) return;
    if (!this.name || !this.selectedUniversity || !this.selectedCourse) return;
    if (!this.profile) return; // guarded, but just in case

    this.saving = true;
    try {
      await this.auth.saveProfile({
        name: this.name.trim(),
        university: this.selectedUniversity,
        course: this.selectedCourse,
      });
      this.saving = false;
    } catch (e) {
      console.error('[ProfileComponent] error updating profile', e);
      this.saving = false;
    }
  }
}
