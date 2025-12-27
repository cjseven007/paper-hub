import { Component, computed, inject, signal, effect } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';

import { PaperParserService, ParsedPaper, ParsedQuestion } from '../../services/paper-parser.service';
import { AuthService } from '../../auth/auth.service';
import { PaperService, PaperDoc, PaperStatus } from '../../services/paper.service';

import { PaperCardComponent } from '../../components/paper-card-component/paper-card-component';
import { UniversityService, University } from '../../services/university.service';
@Component({
  selector: 'app-contribute-paper-component',
  standalone: true,
  imports: [CommonModule, FormsModule, PaperCardComponent],
  templateUrl: './contribute-paper-component.html',
  styleUrl: './contribute-paper-component.css',
})
export class ContributePaperComponent {
  private parser = inject(PaperParserService);
  private auth = inject(AuthService);
  private paperService = inject(PaperService);
  private universityService = inject(UniversityService);

  // zoneless-friendly current user
  private userSig = toSignal(this.auth.user$, { initialValue: null });
  private papersSub: Subscription | null = null;

  // user info
  userUid = computed(() => this.userSig()?.uid ?? null);
  userName = computed(() => this.userSig()?.displayName ?? null);
  userPhotoURL = computed(() => this.userSig()?.photoURL ?? null);

  // Papers list
  userPapers = signal<PaperDoc[]>([]);
  papersLoading = signal(true);

  // UI state
  selectedFile = signal<File | null>(null);
  parsing = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);

  // University
  universities = signal<University[]>([]);
  universitiesLoading = signal(false);
  selectedUniversityId = signal<string | null>(null);

  // modals
  showUploadDialog = signal(false);
  showEditDialog = signal(false);
  showPreviewDialog = signal(false);

  // active paper editing/preview
  editMode = signal<'create' | 'edit'>('create');
  activePaperId = signal<string | null>(null);
  activeStatus = signal<PaperStatus>('draft');

  // parsed / editable fields
  paperTitle = signal('');
  courseCode = signal('');
  courseName = signal('');
  examDate = signal('');
  examYear = signal('');
  questions = signal<ParsedQuestion[]>([]);
  selectedQuestionIndex = signal(0);

  // preview / workspace state
  activePreviewPaper = signal<PaperDoc | null>(null);
  checkingWorkspace = signal(false);
  alreadyInWorkspace = signal(false);
  previewError = signal<string | null>(null);

  constructor() {
    effect(() => {
      const user = this.userSig();

      // cleanup old sub
      if (this.papersSub) {
        this.papersSub.unsubscribe();
        this.papersSub = null;
      }

      if (!user?.uid) {
        this.userPapers.set([]);
        this.papersLoading.set(false);
        return;
      }

      this.papersLoading.set(true);

      this.papersSub = this.paperService.getUserPapers(user.uid).subscribe({
        next: (papers) => {
          this.userPapers.set(papers);
          this.papersLoading.set(false);
        },
        error: (err) => {
          console.error('Error loading papers', err);
          this.error.set('Failed to load your papers.');
          this.papersLoading.set(false);
        },
      });
    });

    // load universities once
    this.universitiesLoading.set(true);
    this.universityService.getUniversities().subscribe({
      next: (unis) => {
        this.universities.set(unis);
        this.universitiesLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load universities', err);
        this.universitiesLoading.set(false);
      },
    });
  }

  // helpers
  get hasParsedPaper() {
    return this.questions().length > 0;
  }

  // header actions
  openUploadDialog() {
    this.showUploadDialog.set(true);
    this.error.set(null);
    this.selectedFile.set(null);
  }

  closeUploadDialog() {
    this.showUploadDialog.set(false);
    this.selectedFile.set(null);
  }

  // file change
  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedFile.set(file);
    this.error.set(null);
  }

  // call Gemini via PaperParserService
  async parseWithGemini() {
    const file = this.selectedFile();
    if (!file) {
      this.error.set('Please select a PDF exam paper first.');
      return;
    }

    const user = this.userSig();
    if (!user) {
      this.error.set('You must be logged in to parse a paper.');
      return;
    }

    this.parsing.set(true);
    this.error.set(null);

    try {
      const parsed: ParsedPaper = await this.parser.parseExamPdf(file);

      this.courseCode.set(parsed.course_code ?? '');
      this.courseName.set(parsed.course_name ?? '');
      this.examDate.set(parsed.exam_date ?? '');
      this.examYear.set(parsed.exam_year ?? '');

      this.paperTitle.set(
        parsed.course_code && parsed.exam_year
          ? `${parsed.course_code} ${parsed.exam_year} Exam`
          : file.name.replace(/\.pdf$/i, '')
      );

      this.questions.set(parsed.questions ?? []);
      this.selectedUniversityId.set(null);
      this.selectedQuestionIndex.set(0);

      this.editMode.set('create');
      this.activePaperId.set(null);
      this.activeStatus.set('draft');

      this.showUploadDialog.set(false);
      this.showEditDialog.set(true);
    } catch (e: any) {
      console.error('Error parsing paper', e);
      this.error.set('Failed to parse the exam paper. Please try again.');
    } finally {
      this.parsing.set(false);
    }
  }

  // card click behaviour
  onPaperCardClick(paper: PaperDoc) {
    if (paper.status === 'draft') {
      this.openEditForDraft(paper);
    } else {
      this.openPreview(paper);
    }
  }

  private openEditForDraft(paper: PaperDoc) {
    this.editMode.set('edit');
    this.activePaperId.set(paper.id);
    this.activeStatus.set('draft');

    this.paperTitle.set(paper.title);
    this.courseCode.set(paper.courseCode);
    this.courseName.set(paper.courseName);
    this.examDate.set(paper.examDate);
    this.examYear.set(paper.examYear);
    this.questions.set(paper.questions ?? []);
    this.selectedQuestionIndex.set(0);
    this.selectedUniversityId.set(paper.universityId ?? null);

    this.showEditDialog.set(true);
  }

  onUniversityChange(id: string | null) {
    this.selectedUniversityId.set(id);
  }

  // preview for published paper (with workspace check)
  async openPreview(paper: PaperDoc) {
    this.activePreviewPaper.set(paper);
    this.showPreviewDialog.set(true);
    this.previewError.set(null);
    this.alreadyInWorkspace.set(false);

    const uid = this.userUid();
    if (!uid) return;

    this.checkingWorkspace.set(true);
    try {
      const exists = await this.paperService.userHasAnswerForPaper(uid, paper.id);
      this.alreadyInWorkspace.set(exists);
    } catch (e) {
      console.error('Error checking workspace from contribute page', e);
      // fail silently; user can still attempt save, extra guard in save
    } finally {
      this.checkingWorkspace.set(false);
    }
  }

  closeEditDialog() {
    this.showEditDialog.set(false);
  }

  closePreviewDialog() {
    this.showPreviewDialog.set(false);
    this.activePreviewPaper.set(null);
    this.previewError.set(null);
    this.alreadyInWorkspace.set(false);
    this.checkingWorkspace.set(false);
  }

  selectQuestion(index: number) {
    this.selectedQuestionIndex.set(index);
  }

  onQuestionTextChange(index: number, text: string) {
    const qs = [...this.questions()];
    qs[index] = { ...qs[index], text };
    this.questions.set(qs);
  }

  onSubQuestionTextChange(qIndex: number, sIndex: number, text: string) {
    const qs = [...this.questions()];
    const subs = [...(qs[qIndex].sub_questions ?? [])];
    subs[sIndex] = { ...subs[sIndex], text };
    qs[qIndex] = { ...qs[qIndex], sub_questions: subs };
    this.questions.set(qs);
  }

  // Save draft or publish
  async savePaper(status: PaperStatus) {
    if (!this.hasParsedPaper) return;

    const user = this.userSig();
    if (!user) {
      this.error.set('You must be logged in to save a paper.');
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const uniId = this.selectedUniversityId();
    const uni = this.universities().find((u) => u.id === uniId) || null;

    const payload = {
      title: this.paperTitle(),
      courseCode: this.courseCode(),
      courseName: this.courseName(),
      examDate: this.examDate(),
      examYear: this.examYear(),
      questions: this.questions(),
      status,
      ownerUid: user.uid,
      ownerName: this.userName(),
      ownerPhotoURL: this.userPhotoURL(),
      universityId: uniId ?? null,
      universityName: uni?.name ?? null,
    };

    try {
      const existingId = this.activePaperId();
      if (this.editMode() === 'edit' && existingId) {
        await this.paperService.updatePaper(existingId, payload);
      } else {
        await this.paperService.createPaper(payload);
      }

      this.showEditDialog.set(false);
      this.activePaperId.set(null);
      this.editMode.set('create');
    } catch (e: any) {
      console.error('Error saving paper', e);
      this.error.set('Failed to save paper.');
    } finally {
      this.saving.set(false);
    }
  }

  // Save questions to workspace – creates answer doc
  async saveQuestionsToWorkspace() {
    const user = this.userSig();
    const paper = this.activePreviewPaper();

    if (!user || !paper) return;

    // guard if we already know it's in workspace
    if (this.alreadyInWorkspace()) {
      this.previewError.set('This paper is already in your workspace.');
      return;
    }

    this.saving.set(true);
    this.previewError.set(null);
    this.error.set(null);

    try {
      // double-check just before writing to avoid race conditions
      const exists = await this.paperService.userHasAnswerForPaper(user.uid, paper.id);
      if (exists) {
        this.alreadyInWorkspace.set(true);
        this.previewError.set('This paper is already in your workspace.');
        return;
      }

      await this.paperService.savePaperToWorkspace(paper, {
        ownerUid: user.uid,
        ownerName: this.userName(),
        ownerPhotoURL: this.userPhotoURL(),
      });

      this.showPreviewDialog.set(false);
      this.activePreviewPaper.set(null);
      this.alreadyInWorkspace.set(false);
    } catch (e: any) {
      console.error('Error creating answer doc', e);
      this.previewError.set('Failed to save questions to workspace.');
    } finally {
      this.saving.set(false);
    }
  }
}
