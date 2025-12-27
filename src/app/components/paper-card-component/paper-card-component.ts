import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaperDoc } from '../../services/paper.service';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-paper-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './paper-card-component.html',
  styleUrl: './paper-card-component.css',
})
export class PaperCardComponent {
  @Input({ required: true }) paper!: PaperDoc;
  @Output() paperClick = new EventEmitter<void>();
}
