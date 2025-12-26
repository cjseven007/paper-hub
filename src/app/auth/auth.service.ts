import { Injectable, inject } from '@angular/core';
import {
  Auth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User,
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  docData,
  setDoc,
} from '@angular/fire/firestore';
import { Observable, of, switchMap,map } from 'rxjs';
import { user as authUser$ } from '@angular/fire/auth';
import { getDoc } from '@angular/fire/firestore';

export interface UserProfile {
  uid: string;
  name: string;
  university: string;
  course: string;
  email?: string | null;
  photoURL?: string | null;
  completed?:boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  /** Firebase auth user observable */
  user$ = authUser$(this.auth); // Observable<User | null>

  /** User profile from Firestore */
  profile$: Observable<UserProfile | null> = this.user$.pipe(
    switchMap((user: User | null) => {
      if (!user) return of(null);

      const ref = doc(this.firestore, 'users', user.uid);
      return docData(ref).pipe(
        map((data: any | undefined) => {
          if (!data) return null;

          const profile: UserProfile = {
            uid: data.uid ?? user.uid,
            name: data.name ?? '',
            university: data.university ?? '',
            course: data.course ?? '',
            email: data.email ?? user.email ?? null,
            photoURL: data.photoURL ?? user.photoURL ?? null,
            completed: data.completed ?? false,
          };

          return profile;
        })
      );
    })
  );

  async signInWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    const credential = await signInWithPopup(this.auth, provider);
    const user = credential.user;

    const ref = doc(this.firestore, 'users', user.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
        // new user
        await setDoc(ref, {
        uid: user.uid,
        email: user.email,
        photoURL: user.photoURL,
        completed: false,
        });
    } else {
        // existing user -> don't change completed
        await setDoc(
        ref,
        {
            uid: user.uid,
            email: user.email,
            photoURL: user.photoURL,
        },
        { merge: true }
        );
    }
    }

  async signOut(): Promise<void> {
    await signOut(this.auth);
  }

  async saveProfile(data: { name: string; university: string; course: string }) {
    const currentUser = this.auth.currentUser;
    if (!currentUser) throw new Error('Not authenticated');

    const ref = doc(this.firestore, 'users', currentUser.uid);
    await setDoc(
      ref,
      {
        uid: currentUser.uid,
        email: currentUser.email,
        photoURL: currentUser.photoURL,
        ...data,
        completed: true,
      },
      { merge: true }
    );
  }
}
