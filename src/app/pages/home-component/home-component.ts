import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';

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

  private userSig = toSignal(this.auth.user$, { initialValue: null });
  userUid = computed(() => this.userSig()?.uid ?? null);
  userName = computed(() => this.userSig()?.displayName ?? null);
  userPhotoURL = computed(() => this.userSig()?.photoURL ?? null);

  loading = signal(true);
  error = signal<string | null>(null);

  // papers currently shown (result of search or default)
  papers = signal<PaperDoc[]>([]);
  searchTerm = signal('');

  private papersSub: Subscription | null = null;

  // preview modal
  showPreviewDialog = signal(false);
  activePaper = signal<PaperDoc | null>(null);
  savingToWorkspace = signal(false);
  previewError = signal<string | null>(null);

  constructor() {
    // react to search term changes and re-subscribe
    effect(() => {
      const term = this.searchTerm();
      this.subscribeToPapersForTerm(term);
    });
  }

  private subscribeToPapersForTerm(term: string) {
    if (this.papersSub) {
      this.papersSub.unsubscribe();
      this.papersSub = null;
    }

    this.loading.set(true);
    this.error.set(null);

    const trimmed = term.trim();

    const source$ = trimmed
      ? this.paperService.searchPublishedPapers(trimmed, 12)
      : this.paperService.getPublishedPapers(12);

    this.papersSub = source$.subscribe({
      next: (papers) => {
        this.papers.set(papers);
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

  openPaperPreview(paper: PaperDoc) {
    this.activePaper.set(paper);
    this.previewError.set(null);
    this.showPreviewDialog.set(true);
  }

  closePreviewDialog() {
    this.showPreviewDialog.set(false);
    this.activePaper.set(null);
    this.previewError.set(null);
  }

  async saveToWorkspaceFromHome() {
    const paper = this.activePaper();
    const uid = this.userUid();

    if (!paper) return;
    if (!uid) {
      this.previewError.set('You must be logged in to save this paper to your workspace.');
      return;
    }

    this.savingToWorkspace.set(true);
    this.previewError.set(null);

    try {
      await this.paperService.savePaperToWorkspace(paper, {
        ownerUid: uid,
        ownerName: this.userName(),
        ownerPhotoURL: this.userPhotoURL(),
      });

      this.showPreviewDialog.set(false);
      this.activePaper.set(null);
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
