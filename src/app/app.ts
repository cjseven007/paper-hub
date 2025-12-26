import { Component, computed, signal, inject } from '@angular/core';
import { RouterOutlet, Router, RouterLink } from '@angular/router';
import { SidebarComponent } from './sidebar-component/sidebar-component';
import { AuthService } from './auth/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';

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

  private auth = inject(AuthService);

  // Firebase auth (user$) as a signal
  // undefined = still restoring; null/User after first emission
  private userSig = toSignal(this.auth.user$, {
    initialValue: undefined as any, // undefined => "loading"
  });

  // Admin flag as a signal (boolean | null)
  // null = not resolved yet
  private isAdminSig = toSignal<boolean | null>(this.auth.isAdmin$, {
    initialValue: null,
  });

  // Global loading: wait until both auth and admin status are known
  appLoading = computed(() => {
    const user = this.userSig();
    const isAdmin = this.isAdminSig();

    // still restoring auth
    if (user === undefined) return true;

    // once we know user (null or User), wait until isAdmin is resolved
    if (isAdmin === null) return true;

    return false;
  });

  // Expose a clean boolean for templates / children
  isAdmin = computed(() => this.isAdminSig() === true);


  showShell() {
    const url = this.router.url;
    return !url.startsWith('/login') && !url.startsWith('/complete-profile');
  }
}
