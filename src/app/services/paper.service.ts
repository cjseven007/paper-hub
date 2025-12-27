import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  collectionData,
  serverTimestamp,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { ParsedQuestion } from './paper-parser.service';

export type PaperStatus = 'draft' | 'published';

export interface PaperDoc {
  id: string;
  title: string;
  courseCode: string;
  courseName: string;
  examDate: string; // "YYYY-MM-DD" or ""
  examYear: string; // "2024" or ""
  status: PaperStatus;
  ownerUid: string;
  ownerName?: string | null;
  ownerPhotoURL?: string | null;
  questions: ParsedQuestion[];
  createdAt?: any;
  updatedAt?: any;
}

export interface CreatePaperPayload {
  title: string;
  courseCode: string;
  courseName: string;
  examDate: string;
  examYear: string;
  status: PaperStatus;
  ownerUid: string;
  ownerName?: string | null;
  ownerPhotoURL?: string | null;
  questions: ParsedQuestion[];
}

export interface AnswerDoc {
  id?: string;
  paperId: string;
  ownerUid: string;
  ownerName?: string | null;
  createdAt?: any;
  // You can refine this later – for now it mirrors questions but holds answers
  answers: any;
}

@Injectable({ providedIn: 'root' })
export class PaperService {
  private firestore = inject(Firestore);

  private papersCol = collection(this.firestore, 'papers');
  private answersCol = collection(this.firestore, 'paperAnswers');

  getUserPapers(uid: string): Observable<PaperDoc[]> {
    const q = query(
      this.papersCol,
      where('ownerUid', '==', uid),
      orderBy('createdAt', 'desc')
    );

    // collectionData will include the Firestore document ID
    return collectionData(q, { idField: 'id' }) as Observable<PaperDoc[]>;
  }

  async createPaper(payload: CreatePaperPayload) {
    const now = serverTimestamp();
    return addDoc(this.papersCol, {
      ...payload,
      createdAt: now,
      updatedAt: now,
    });
  }

  async updatePaper(paperId: string, data: Partial<CreatePaperPayload>) {
    const ref = doc(this.papersCol, paperId);
    return updateDoc(ref, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }

  async createAnswerDoc(paper: PaperDoc, ownerUid: string, ownerName?: string | null) {
    const now = serverTimestamp();

    // For now, just clone the question structure – you can convert this into a
    // dedicated answer schema later (e.g. answerText, subAnswers, etc.)
    const emptyAnswers = paper.questions.map((q) => ({
      question_number: q.question_number,
      answer: '',
      sub_questions: (q.sub_questions ?? []).map((sq) => ({
        sub_number: sq.sub_number,
        answer: '',
      })),
    }));

    return addDoc(this.answersCol, {
      paperId: paper.id,
      ownerUid,
      ownerName: ownerName ?? null,
      createdAt: now,
      answers: emptyAnswers,
    });
  }
}
