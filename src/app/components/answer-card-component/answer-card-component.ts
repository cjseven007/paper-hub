import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnswerDoc } from '../../services/paper.service';


@Component({
  selector: 'app-answer-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './answer-card-component.html',
  styleUrl: './answer-card-component.css',
})
export class AnswerCardComponent {
  @Input({ required: true }) answer!: AnswerDoc;
  @Output() cardClick = new EventEmitter<void>();

  onClick() {
    this.cardClick.emit();
  }
}
