import { Routes } from '@angular/router';

import { HomeComponent } from './home-component/home-component';
import { WorkspaceComponent } from './workspace-component/workspace-component';
import { ProfileComponent } from './profile-component/profile-component';
import { SettingsComponent } from './settings-component/settings-component';
import { ContributePaperComponent } from './contribute-paper-component/contribute-paper-component';

import { LoginComponent } from './auth/login-component/login-component';
import { CompleteProfileComponent } from './auth/complete-profile-component/complete-profile-component';
import { authGuard } from './auth/auth.guard';
import { profileGuard } from './auth/profile.guard';
import { adminGuard } from './auth/admin.guard';
import { ManageUniversitiesComponent } from '../app/admin/manage-universities-component/manage-universities-component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },

  {
    path: 'complete-profile',
    component: CompleteProfileComponent,
    canActivate: [authGuard],
  },

  {
    path: 'home',
    component: HomeComponent,
    canActivate: [authGuard, profileGuard],
  },
  {
    path: 'workspace',
    component: WorkspaceComponent,
    canActivate: [authGuard, profileGuard],
  },
  {
    path:'contribute-paper',
    component: ContributePaperComponent,
    canActivate: [authGuard, profileGuard],
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [authGuard, profileGuard],
  },
  // {
  //   path: 'settings',
  //   component: SettingsComponent,
  //   canActivate: [authGuard, profileGuard],
  // },
  {
    path: 'manage-universities',
    component: ManageUniversitiesComponent,
    canActivate: [authGuard, profileGuard, adminGuard],
  },

  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: '**', redirectTo: 'home' },
];