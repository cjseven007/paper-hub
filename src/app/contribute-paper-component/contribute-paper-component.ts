import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaperParserService, ParsedPaper, ParsedQuestion } from '../services/paper-parser.service';
import { Firestore, addDoc, collection, serverTimestamp } from '@angular/fire/firestore';
import { AuthService } from '../auth/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-contribute-paper-component',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contribute-paper-component.html',
  styleUrl: './contribute-paper-component.css',
})
export class ContributePaperComponent {
  private parser = inject(PaperParserService);
  private firestore = inject(Firestore);
  private auth = inject(AuthService);

  private userSig = toSignal(this.auth.user$, { initialValue: null });

  // UI state
  selectedFile = signal<File | null>(null);
  parsing = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);

  // Modal
  showUploadDialog = signal(false);

  // Parsed & editable paper
  paperTitle = signal('');
  courseCode = signal('');
  courseName = signal('');
  examDate = signal('');
  examYear = signal('');
  questions = signal<ParsedQuestion[]>([]);
  selectedQuestionIndex = signal(0);

  get hasParsedPaper() {
    return this.questions().length > 0;
  }

  openUploadDialog() {
    this.showUploadDialog.set(true);
    this.error.set(null);
  }

  closeUploadDialog() {
    this.showUploadDialog.set(false);
    this.selectedFile.set(null);
    this.error.set(null);
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedFile.set(file);
    this.error.set(null);
  }

  async parseWithGemini() {
    const file = this.selectedFile();
    if (!file) {
      this.error.set('Please select a PDF exam paper first.');
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
        (parsed.course_code && parsed.exam_year)
          ? `${parsed.course_code} ${parsed.exam_year} Exam`
          : file.name.replace(/\.pdf$/i, '')
      );

      this.questions.set(parsed.questions ?? []);
      this.selectedQuestionIndex.set(0);
      this.showUploadDialog.set(false);
    } catch (e: any) {
      console.error('Error parsing paper', e);
      this.error.set('Failed to parse the exam paper. Please try again.');
    } finally {
      this.parsing.set(false);
    }
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

  async savePaper() {
    if (!this.hasParsedPaper) return;

    const user = this.userSig();
    if (!user) {
      this.error.set('You must be logged in to save a paper.');
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    try {
      const colRef = collection(this.firestore, 'papers');
      await addDoc(colRef, {
        title: this.paperTitle(),
        courseCode: this.courseCode(),
        courseName: this.courseName(),
        examDate: this.examDate(),
        examYear: this.examYear(),
        questions: this.questions(),
        ownerUid: user.uid,
        createdAt: serverTimestamp(),
      });

      // Reset UI
      this.selectedFile.set(null);
      this.paperTitle.set('');
      this.courseCode.set('');
      this.courseName.set('');
      this.examDate.set('');
      this.examYear.set('');
      this.questions.set([]);
      this.selectedQuestionIndex.set(0);
    } catch (e: any) {
      console.error('Error saving paper', e);
      this.error.set('Failed to save paper to Firestore.');
    } finally {
      this.saving.set(false);
    }
  }
}
