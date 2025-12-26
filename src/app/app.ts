import { Component, computed, signal, inject } from '@angular/core';
import { RouterOutlet, Router, RouterLink } from '@angular/router';
import { SidebarComponent } from './sidebar-component/sidebar-component';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [RouterOutlet,SidebarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('paper-hub');
  private router = inject(Router);
  showShell() {
    const url = this.router.url;
    return !url.startsWith('/login') && !url.startsWith('/complete-profile');
  }
}
