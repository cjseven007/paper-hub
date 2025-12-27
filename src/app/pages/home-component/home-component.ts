import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { PaperService, PaperDoc } from '../../services/paper.service';
import { PaperCardComponent } from '../../components/paper-card-component/paper-card-component';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PaperCardComponent],
  templateUrl: './home-component.html',
  styleUrl: './home-component.css',
})
export class HomeComponent {
 private paperService = inject(PaperService);
  private auth = inject(AuthService);

  // auth
  private userSig = toSignal(this.auth.user$, { initialValue: null });
  userUid = computed(() => this.userSig()?.uid ?? null);
  userName = computed(() => this.userSig()?.displayName ?? null);
  userPhotoURL = computed(() => this.userSig()?.photoURL ?? null);

  // data
  loading = signal(true);
  error = signal<string | null>(null);
  allPapers = signal<PaperDoc[]>([]);   // all published (up to limit)

  // search
  searchTerm = signal('');

  // filter client-side
  filteredPapers = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const papers = this.allPapers();

    if (!term) {
      // show up to 12 in the grid
      return papers.slice(0, 12);
    }

    const filtered = papers.filter((p) => {
      const courseCode = (p.courseCode || '').toLowerCase();
      const courseName = (p.courseName || '').toLowerCase();
      const universityName = (p.universityName || '').toLowerCase();

      return (
        courseCode.includes(term) ||
        courseName.includes(term) ||
        universityName.includes(term)
      );
    });

    return filtered.slice(0, 12); // still cap at 3x4
  });

  // preview modal state
  showPreviewDialog = signal(false);
  activePaper = signal<PaperDoc | null>(null);
  savingToWorkspace = signal(false);
  previewError = signal<string | null>(null);

  checkingWorkspace = signal(false);
  alreadyInWorkspace = signal(false);

  constructor() {
    this.loadPublishedPapers();
  }

  private loadPublishedPapers() {
    this.loading.set(true);
    this.error.set(null);

    this.paperService.getPublishedPapers(100).subscribe({
      next: (papers) => {
        this.allPapers.set(papers);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading published papers', err);
        this.error.set('Failed to load published papers.');
        this.loading.set(false);
      },
    });
  }

  onSearch(term: string) {
    this.searchTerm.set(term);
  }

  async openPaperPreview(paper: PaperDoc) {
    this.activePaper.set(paper);
    this.previewError.set(null);
    this.showPreviewDialog.set(true);

    // reset + check if already saved
    this.alreadyInWorkspace.set(false);
    const uid = this.userUid();
    if (!uid) return;

    this.checkingWorkspace.set(true);
    try {
      const exists = await this.paperService.userHasAnswerForPaper(uid, paper.id);
      this.alreadyInWorkspace.set(exists);
    } catch (e) {
      console.error('Error checking workspace for paper', e);
      // fail silently, user can still attempt to save
    } finally {
      this.checkingWorkspace.set(false);
    }
  }

  

  closePreviewDialog() {
    this.showPreviewDialog.set(false);
    this.activePaper.set(null);
    this.previewError.set(null);
    this.alreadyInWorkspace.set(false);
    this.checkingWorkspace.set(false);
  }

  async saveToWorkspaceFromHome() {
    const paper = this.activePaper();
    const uid = this.userUid();

    if (!paper) return;
    if (!uid) {
      this.previewError.set('You must be logged in to save this paper to your workspace.');
      return;
    }

    // extra guard
    if (this.alreadyInWorkspace()) {
      this.previewError.set('This paper is already in your workspace.');
      return;
    }

    this.savingToWorkspace.set(true);
    this.previewError.set(null);

    try {
      // Double-check just before writing (race-condition safe)
      const exists = await this.paperService.userHasAnswerForPaper(uid, paper.id);
      if (exists) {
        this.alreadyInWorkspace.set(true);
        this.previewError.set('This paper is already in your workspace.');
        return;
      }

      await this.paperService.savePaperToWorkspace(paper, {
        ownerUid: uid,
        ownerName: this.userName(),
        ownerPhotoURL: this.userPhotoURL(),
      });

      this.showPreviewDialog.set(false);
      this.activePaper.set(null);
      this.alreadyInWorkspace.set(false);
    } catch (e: any) {
      console.error('Error saving paper to workspace from home', e);
      this.previewError.set('Failed to save to workspace. Please try again.');
    } finally {
      this.savingToWorkspace.set(false);
    }
  }

  get isLoggedIn() {
    return !!this.userUid();
  }
}
