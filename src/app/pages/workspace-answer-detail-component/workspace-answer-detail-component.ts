import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  PaperService,
  AnswerDoc,
  AnswerQuestion,
  AnswerSubQuestion,
  PaperDoc,
} from '../../services/paper.service';
@Component({
  selector: 'app-workspace-answer-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './workspace-answer-detail-component.html',
  styleUrl: './workspace-answer-detail-component.css',
})
export class WorkspaceAnswerDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private paperService = inject(PaperService);

  answerDoc = signal<AnswerDoc | null>(null);
  paper = signal<PaperDoc | null>(null);
  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);

  selectedQuestionIndex = signal(0);

  // track dirty state
  private originalAnswersJson = signal<string>('');
  dirty = computed(() => {
    const current = this.answersJson();
    return current !== this.originalAnswersJson();
  });

  // derived helpers
  answersJson = computed(() =>
    JSON.stringify(this.answerDoc()?.answers ?? [], null, 2)
  );

  get hasData() {
    return !!this.answerDoc() && !!this.paper();
  }

  constructor() {
    const answerId = this.route.snapshot.paramMap.get('answerId');
    if (!answerId) {
      this.error.set('Invalid answer document.');
      this.loading.set(false);
      return;
    }

    this.loadData(answerId);
  }

  private async loadData(answerId: string) {
    this.loading.set(true);
    this.error.set(null);

    try {
      const answer = await this.paperService.getAnswerDocById(answerId);
      if (!answer) {
        this.error.set('Answer document not found.');
        this.loading.set(false);
        return;
      }

      this.answerDoc.set(answer);

      const paper = await this.paperService.getPaperById(answer.paperId);
      if (!paper) {
        this.error.set('Original paper not found.');
      } else {
        this.paper.set(paper);
      }

      this.selectedQuestionIndex.set(0);
      this.originalAnswersJson.set(this.answersJson());
    } catch (e: any) {
      console.error('Error loading answer detail', e);
      this.error.set('Failed to load this workspace item.');
    } finally {
      this.loading.set(false);
    }
  }

  selectQuestion(index: number) {
    this.selectedQuestionIndex.set(index);
  }

  // helpers to access and mutate answers
  get answerQuestions(): AnswerQuestion[] {
    return this.answerDoc()?.answers ?? [];
  }

  updateQuestionAnswer(index: number, value: string) {
    const doc = this.answerDoc();
    if (!doc) return;

    const answers = [...doc.answers];
    answers[index] = { ...answers[index], answer: value };

    this.answerDoc.set({ ...doc, answers });
  }

  updateSubAnswer(qIndex: number, sIndex: number, value: string) {
    const doc = this.answerDoc();
    if (!doc) return;

    const answers = [...doc.answers];
    const subQuestions = [...answers[qIndex].sub_questions];
    subQuestions[sIndex] = { ...subQuestions[sIndex], answer: value };
    answers[qIndex] = { ...answers[qIndex], sub_questions: subQuestions };

    this.answerDoc.set({ ...doc, answers });
  }

  async saveProgress() {
    const doc = this.answerDoc();
    if (!doc) return;

    this.saving.set(true);
    this.error.set(null);

    try {
      await this.paperService.updateAnswerDoc(doc.id, {
        answers: doc.answers, // only update answers
      });
      // reset dirty baseline
      this.originalAnswersJson.set(this.answersJson());
    } catch (e: any) {
      console.error('Error saving answers', e);
      this.error.set('Failed to save your progress.');
    } finally {
      this.saving.set(false);
    }
  }

  async goBackToWorkspace() {
    if (this.dirty()) {
      const shouldSave = window.confirm(
        'You have unsaved changes. Save before returning to workspace?'
      );
      if (shouldSave) {
        await this.saveProgress();
      }
    }
    this.router.navigate(['/workspace']);
  }
}
