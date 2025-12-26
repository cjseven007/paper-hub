import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
} from '@angular/fire/firestore';
import { collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface University {
  id: string;
  name: string;
  courses: string[];
}

@Injectable({ providedIn: 'root' })
export class UniversityService {
  private firestore = inject(Firestore);

  getUniversities(): Observable<University[]> {
    const ref = collection(this.firestore, 'universities');
    return collectionData(ref, { idField: 'id' }) as Observable<University[]>;
  }
}
