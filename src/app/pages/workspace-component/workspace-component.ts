import { Component, effect, inject, signal, computed } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { AuthService } from '../../auth/auth.service';
import { PaperService, AnswerDoc } from '../../services/paper.service';
import { AnswerCardComponent } from '../../components/answer-card-component/answer-card-component';

@Component({
  selector: 'app-workspace-component',
  standalone: true,
  imports: [CommonModule, RouterModule, AnswerCardComponent],
  templateUrl: './workspace-component.html',
  styleUrl: './workspace-component.css',
})
export class WorkspaceComponent {
  private auth = inject(AuthService);
  private paperService = inject(PaperService);
  private router = inject(Router);

  private userSig = toSignal(this.auth.user$, { initialValue: null });

  answerDocs = signal<AnswerDoc[]>([]);
  error = signal<string | null>(null);
  answersLoading = signal(true);
  deletingId = signal<string | null>(null);
  deleteTarget = signal<AnswerDoc | null>(null);
  showDeleteDialog = signal(false);

  private answersSub: Subscription | null = null;

  constructor() {
    effect(() => {
      const user = this.userSig();

      if (this.answersSub) {
        this.answersSub.unsubscribe();
        this.answersSub = null;
      }

      if (!user?.uid) {
        this.answerDocs.set([]);
        this.answersLoading.set(false);
        return;
      }

      this.answersLoading.set(true);
      this.error.set(null);

      this.answersSub = this.paperService.getUserAnswerDocs(user.uid).subscribe({
        next: (answers) => {
          this.answerDocs.set(answers);
          this.answersLoading.set(false);
        },
        error: (err) => {
          console.error('Error loading workspace answers', err);
          this.error.set('Failed to load your workspace.');
          this.answersLoading.set(false);
        },
      });
    });
  }

  openAnswer(answer: AnswerDoc) {
    this.router.navigate(['/workspace', answer.id]);
  }

  async deleteAnswer(answer: AnswerDoc) {
    const confirmDelete = window.confirm(
      'Delete this answer set from your workspace? This cannot be undone.'
    );
    if (!confirmDelete) return;

    this.deletingId.set(answer.id);
    this.error.set(null);

    try {
      await this.paperService.deleteAnswerDoc(answer.id);
      // Firestore subscription will auto-update answerDocs
    } catch (e: any) {
      console.error('Error deleting answer doc', e);
      this.error.set('Failed to delete this answer. Please try again.');
    } finally {
      this.deletingId.set(null);
    }
  }

  // called when trash icon is clicked
  requestDelete(answer: AnswerDoc) {
    this.deleteTarget.set(answer);
    this.showDeleteDialog.set(true);
    this.error.set(null);
  }

  closeDeleteDialog() {
    this.showDeleteDialog.set(false);
    this.deleteTarget.set(null);
  }

  async confirmDeleteAnswer() {
    const answer = this.deleteTarget();
    if (!answer) return;

    this.deletingId.set(answer.id);
    this.error.set(null);

    try {
      await this.paperService.deleteAnswerDoc(answer.id);
      // subscription will auto-refresh list
      this.showDeleteDialog.set(false);
      this.deleteTarget.set(null);
    } catch (e: any) {
      console.error('Error deleting answer doc', e);
      this.error.set('Failed to delete this answer. Please try again.');
    } finally {
      this.deletingId.set(null);
    }
  }
}
