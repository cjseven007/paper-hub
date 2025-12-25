import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

type NavItem = {
  label: string;
  path: string;
  icon: 'home' | 'workspace' | 'profile' | 'settings';
};

@Component({
  standalone:true,
  selector: 'app-sidebar-component',
  imports: [ RouterLink,
    RouterLinkActive],
  templateUrl: './sidebar-component.html',
  styleUrl: './sidebar-component.css',
})
export class SidebarComponent {
  appName = 'PaperHub';
    nav: NavItem[] = [
      { label: 'Home',         path: '/home',      icon: 'home' },
      { label: 'My Workspace', path: '/workspace', icon: 'workspace' },
      { label: 'Profile',      path: '/profile',   icon: 'profile' },
      { label: 'Settings',     path: '/settings',  icon: 'settings' },
    ];

    trackByPath = (_: number, item: NavItem) => item.path
}
