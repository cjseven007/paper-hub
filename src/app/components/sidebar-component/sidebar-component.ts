import { Component, inject, Input } from '@angular/core';
import { Router } from '@angular/router';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { AsyncPipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { toSignal } from '@angular/core/rxjs-interop';

type LucideIconName = 'house' | 'app-window' | 'settings' | 'university' | 'book-open-text';

type NavItem = {
  label: string;
  path: string;
  icon: LucideIconName;
};

@Component({
  standalone:true,
  selector: 'app-sidebar-component',
  imports: [ RouterLink,RouterLinkActive,AsyncPipe,LucideAngularModule],
  templateUrl: './sidebar-component.html',
  styleUrl: './sidebar-component.css',
})
export class SidebarComponent {
  private router = inject(Router);
  auth = inject(AuthService);

  appName = 'PaperHub';
  
  @Input() isAdmin = false;   // <-- comes from AppComponent now

  nav: NavItem[] = [
    { label: 'Home',         path: '/home',      icon: 'house' },
    { label: 'My Workspace', path: '/workspace', icon: 'app-window' },
    { label: 'Contribute Paper', path: '/contribute-paper', icon: 'book-open-text' },
    // { label: 'Settings',     path: '/settings',  icon: 'settings' },
  ];

  showProfileMenu = false;

  trackByPath = (_: number, item: NavItem) => item.path

  toggleProfileMenu() {
    this.showProfileMenu = !this.showProfileMenu;
  }

  closeProfileMenu() {
    this.showProfileMenu = false;
  }

  async goToProfile() {
    this.closeProfileMenu();
    try {
      await this.router.navigateByUrl('/profile');
    } catch (err) {
      console.error('Error navigating to profile', err);
    }
  }

  async logout() {
    try {
      await this.auth.signOut();
      await this.router.navigateByUrl('/login');
    } catch (err) {
      console.error('Error during logout', err);
    }
  }
}
