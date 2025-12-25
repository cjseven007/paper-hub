import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
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
}
