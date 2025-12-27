import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection,importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { environment } from '../environment/environment';

import {
  LucideAngularModule,
  House,
  AppWindow,
  Settings,
  BookOpenText,
  University,
  User,
  File,
  NotebookPen
} from 'lucide-angular';
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes), provideClientHydration(withEventReplay()),
    // Firebase
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    importProvidersFrom(
      LucideAngularModule.pick({
        House,
        AppWindow,
        Settings,
        BookOpenText,
        University,
        User,
        File,
        NotebookPen
      })
    ),
  ]
};
