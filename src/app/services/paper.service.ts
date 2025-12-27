// paper.service.ts
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
  getDoc,
  limit,
  startAt,
  endAt,
  deleteDoc,
  getDocs
} from '@angular/fire/firestore';
import { Observable, combineLatest, map } from 'rxjs';

import { ParsedQuestion } from './paper-parser.service';
import { University } from './university.service';

export type PaperStatus = 'draft' | 'published';

export interface PaperDoc {
  id: string;
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
  createdAt?: any;
  updatedAt?: any;
  // NEW
  universityId?: string | null;
  universityName?: string | null;
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
  universityId?: string | null;
  universityName?: string | null;
}

// ANSWER TYPES
export interface AnswerSubQuestion {
  sub_number: string;
  answer: string;
}

export interface AnswerQuestion {
  question_number: string;
  answer: string;
  sub_questions: AnswerSubQuestion[];
}

export interface AnswerDoc {
  id: string;
  paperId: string;
  ownerUid: string;
  ownerName?: string | null;
  ownerPhotoURL?: string | null;

  title: string;
  courseCode: string;
  courseName: string;
  examDate: string;
  examYear: string;

  createdAt?: any;
  updatedAt?: any;
  answers: AnswerQuestion[];

  universityId?: string | null;
  universityName?: string | null;
}

@Injectable({ providedIn: 'root' })
export class PaperService {
  private firestore = inject(Firestore);

  private papersCol = collection(this.firestore, 'papers');
  private answersCol = collection(this.firestore, 'paperAnswers');

  // ===== PAPERS (questions) =====

  getUserPapers(uid: string): Observable<PaperDoc[]> {
    const q = query(
      this.papersCol,
      where('ownerUid', '==', uid),
      orderBy('createdAt', 'desc') // make sure you have the composite index
    );

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

  async getPaperById(paperId: string): Promise<PaperDoc | null> {
    const ref = doc(this.papersCol, paperId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as Omit<PaperDoc, 'id'>) };
  }

  // ===== ANSWER DOCS (workspace) =====

  getUserAnswerDocs(uid: string): Observable<AnswerDoc[]> {
    const q = query(
      this.answersCol,
      where('ownerUid', '==', uid),
      orderBy('createdAt', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<AnswerDoc[]>;
  }

  async getAnswerDocById(answerId: string): Promise<AnswerDoc | null> {
    const ref = doc(this.answersCol, answerId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as Omit<AnswerDoc, 'id'>) };
  }

  async updateAnswerDoc(
    answerId: string,
    data: Partial<Pick<AnswerDoc, 'answers' | 'title'>>
  ) {
    const ref = doc(this.answersCol, answerId);

    const clean: any = { updatedAt: serverTimestamp() };
    if (data.answers !== undefined) clean.answers = data.answers;
    if (data.title !== undefined) clean.title = data.title;

    return updateDoc(ref, clean);
  }

  async createAnswerDoc(
    paper: PaperDoc,
    ownerUid: string,
    ownerName?: string | null,
    ownerPhotoURL?: string | null
  ) {
    const now = serverTimestamp();

    // Build empty answer structure mirroring questions + sub_questions
    const emptyAnswers: AnswerQuestion[] = paper.questions.map((q) => ({
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
      ownerPhotoURL: ownerPhotoURL ?? null,

      // exam metadata copied from paper
      title: paper.title,
      courseCode: paper.courseCode,
      courseName: paper.courseName,
      examDate: paper.examDate,
      examYear: paper.examYear,

      universityId: paper.universityId ?? null,
      universityName: paper.universityName ?? null,

      createdAt: now,
      updatedAt: now,
      answers: emptyAnswers,
    });
  }
  async deleteAnswerDoc(answerId: string) {
    const ref = doc(this.answersCol, answerId);
    return deleteDoc(ref);
    }

  async savePaperToWorkspace(
    paper: PaperDoc,
    opts: { ownerUid: string; ownerName?: string | null; ownerPhotoURL?: string | null }
  ) {
    const { ownerUid, ownerName, ownerPhotoURL } = opts;

    return this.createAnswerDoc(
      paper,
      ownerUid,
      ownerName ?? null,
      ownerPhotoURL ?? null
    );
  }
  getPublishedPapers(limitCount = 100): Observable<PaperDoc[]> {
    const q = query(
        this.papersCol,
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
    );

    return collectionData(q, { idField: 'id' }) as Observable<PaperDoc[]>;
    }
    searchPublishedPapers(term: string, limitCount = 12): Observable<PaperDoc[]> {
        const trimmed = term.trim();
        if (!trimmed) {
            return this.getPublishedPapers(limitCount);
        }

        const termUpper = trimmed.toUpperCase();
        const termLower = trimmed.toLowerCase();

        const baseStatus = where('status', '==', 'published');

        const byCode = query(
            this.papersCol,
            baseStatus,
            orderBy('courseCode'),
            startAt(termUpper),
            endAt(termUpper + '\uf8ff'),
            limit(limitCount)
        );

        const byName = query(
            this.papersCol,
            baseStatus,
            orderBy('courseName'),
            startAt(termLower),
            endAt(termLower + '\uf8ff'),
            limit(limitCount)
        );

        const byUni = query(
            this.papersCol,
            baseStatus,
            orderBy('universityName'),
            startAt(termLower),
            endAt(termLower + '\uf8ff'),
            limit(limitCount)
        );

        return combineLatest([
            collectionData(byCode, { idField: 'id' }) as Observable<PaperDoc[]>,
            collectionData(byName, { idField: 'id' }) as Observable<PaperDoc[]>,
            collectionData(byUni, { idField: 'id' }) as Observable<PaperDoc[]>,
        ]).pipe(
            map(([codeList, nameList, uniList]) => {
            const mapById = new Map<string, PaperDoc>();
            for (const list of [codeList, nameList, uniList]) {
                for (const p of list) {
                mapById.set(p.id, p as PaperDoc);
                }
            }
            return Array.from(mapById.values()).slice(0, limitCount);
            })
        );
        }
    async userHasAnswerForPaper(ownerUid: string, paperId: string): Promise<boolean> {
    const qref = query(
        this.answersCol,
        where('ownerUid', '==', ownerUid),
        where('paperId', '==', paperId),
        limit(1)
    );

    const snap = await getDocs(qref);
    return !snap.empty;
    }
}
