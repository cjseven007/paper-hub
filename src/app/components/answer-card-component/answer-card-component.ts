import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnswerDoc } from '../../services/paper.service';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-answer-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './answer-card-component.html',
  styleUrl: './answer-card-component.css',
})
export class AnswerCardComponent {
  @Input({ required: true }) answer!: AnswerDoc;
  @Input() deleting = false;

  @Output() cardClick = new EventEmitter<void>();
  @Output() deleteClick = new EventEmitter<void>();

  onCardClick() {
    if (!this.deleting) {
      this.cardClick.emit();
    }
  }

  onDeleteClick(event: MouseEvent) {
    event.stopPropagation(); // don't trigger cardClick
    if (!this.deleting) {
      this.deleteClick.emit();
    }
  }
}
