import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
} from '@angular/fire/firestore';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';

export interface University {
  id: string;
  name: string;
  courses: string[];
}

@Component({
  selector: 'app-manage-universities-component',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-universities-component.html',
  styleUrl: './manage-universities-component.css',
})
export class ManageUniversitiesComponent {
  private firestore = inject(Firestore);

  private universities$ = collectionData(
    collection(this.firestore, 'universities'),
    { idField: 'id' }
  ) as Observable<University[]>;

  universitiesSig = toSignal(this.universities$, {
    initialValue: [] as University[],
  });

  // selection & editing state
  selectedUniversityId: string | null = null;
  editingCourses: string[] = [];

  // modal state
  showAddUniModal = false;
  showAddCourseModal = false;
  showEditNameModal = false;

  showDeleteUniModal = false;
  showDeleteCourseModal = false;

  // to remember what we're deleting
  pendingDeleteCourseIndex: number | null = null;
  pendingDeleteCourseName = '';

  // modal form fields
  newUniversityName = '';
  newCourseName = '';
  editUniversityName = '';

  get universities(): University[] {
    return this.universitiesSig();
  }

  get selectedUniversity(): University | null {
    return this.universities.find((u) => u.id === this.selectedUniversityId) ?? null;
  }

  // ----------------- Selection -----------------

  selectUniversity(uni: University) {
    this.selectedUniversityId = uni.id;
    this.editUniversityName = uni.name;
    this.editingCourses = [...(uni.courses ?? [])];
    this.newCourseName = '';
  }

  // ----------------- Add university -----------------

  openAddUniModal() {
    this.newUniversityName = '';
    this.showAddUniModal = true;
  }

  closeAddUniModal() {
    this.showAddUniModal = false;
  }

  async addUniversity() {
    const name = this.newUniversityName.trim();
    if (!name) return;

    await addDoc(collection(this.firestore, 'universities'), {
      name,
      courses: [],
    });

    this.showAddUniModal = false;
    this.newUniversityName = '';
  }

  // ----------------- Edit university name -----------------

  openEditNameModal() {
    if (!this.selectedUniversity) return;
    this.editUniversityName = this.selectedUniversity.name;
    this.showEditNameModal = true;
  }

  closeEditNameModal() {
    this.showEditNameModal = false;
  }

  async saveUniversityName() {
    if (!this.selectedUniversityId) return;
    const name = this.editUniversityName.trim();
    if (!name) return;

    const ref = doc(this.firestore, 'universities', this.selectedUniversityId);
    await updateDoc(ref, { name });

    this.showEditNameModal = false;
  }

  // ----------------- Delete university -----------------

  openDeleteUniModal() {
    if (!this.selectedUniversity) return;
    this.showDeleteUniModal = true;
  }

  closeDeleteUniModal() {
    this.showDeleteUniModal = false;
  }

  async confirmDeleteUniversity() {
    if (!this.selectedUniversity) return;

    const ref = doc(this.firestore, 'universities', this.selectedUniversity.id);
    await deleteDoc(ref);

    this.showDeleteUniModal = false;

    // reset right side
    this.selectedUniversityId = null;
    this.editUniversityName = '';
    this.editingCourses = [];
    this.newCourseName = '';
  }

  // ----------------- Add course -----------------

  openAddCourseModal() {
    if (!this.selectedUniversity) return;
    this.newCourseName = '';
    this.showAddCourseModal = true;
  }

  closeAddCourseModal() {
    this.showAddCourseModal = false;
  }

  async addCourse() {
    if (!this.selectedUniversityId) return;
    const course = this.newCourseName.trim();
    if (!course) return;

    const updated = [...this.editingCourses, course];
    this.editingCourses = updated;

    const ref = doc(this.firestore, 'universities', this.selectedUniversityId);
    await updateDoc(ref, { courses: updated });

    this.newCourseName = '';
    this.showAddCourseModal = false;
  }

  // ----------------- Remove course -----------------

  openDeleteCourseModal(index: number) {
    this.pendingDeleteCourseIndex = index;
    this.pendingDeleteCourseName = this.editingCourses[index];
    this.showDeleteCourseModal = true;
  }

  closeDeleteCourseModal() {
    this.showDeleteCourseModal = false;
    this.pendingDeleteCourseIndex = null;
    this.pendingDeleteCourseName = '';
  }

  async confirmDeleteCourse() {
    if (this.pendingDeleteCourseIndex == null || !this.selectedUniversityId) return;

    const updated = this.editingCourses.filter(
      (_, i) => i !== this.pendingDeleteCourseIndex
    );
    this.editingCourses = updated;

    const ref = doc(this.firestore, 'universities', this.selectedUniversityId);
    await updateDoc(ref, { courses: updated });

    this.closeDeleteCourseModal();
  }
}
