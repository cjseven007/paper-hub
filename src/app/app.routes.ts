import { Routes } from '@angular/router';

import { HomeComponent } from './home-component/home-component';
import { WorkspaceComponent } from './workspace-component/workspace-component';
import { ProfileComponent } from './profile-component/profile-component';
import { SettingsComponent } from './settings-component/settings-component';

export const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'workspace', component: WorkspaceComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'settings', component: SettingsComponent },
  { path: '', pathMatch: 'full', redirectTo: 'home' },
];
