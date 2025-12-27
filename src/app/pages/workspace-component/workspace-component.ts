import { Component, effect, inject, signal, computed } from '@angular/core';
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

  userUid = computed(() => this.userSig()?.uid ?? null);
  userName = computed(() => this.userSig()?.displayName ?? null);

  answerDocs = signal<AnswerDoc[]>([]);
  error = signal<string | null>(null);

  constructor() {
    effect(() => {
      const user = this.userSig();
      if (!user?.uid) {
        this.answerDocs.set([]);
        return;
      }

      this.paperService.getUserAnswerDocs(user.uid).subscribe({
        next: (answers) => {this.answerDocs.set(answers);},
        error: (err) => {
          console.error('Error loading workspace answers', err);
          this.error.set('Failed to load your workspace.');
        },
      });
    });
  }

  openAnswer(answer: AnswerDoc) {
    this.router.navigate(['/workspace', answer.id]);
  }
}
