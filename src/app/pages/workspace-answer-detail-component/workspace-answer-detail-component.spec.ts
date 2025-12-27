import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkspaceAnswerDetailComponent } from './workspace-answer-detail-component';

describe('WorkspaceAnswerDetailComponent', () => {
  let component: WorkspaceAnswerDetailComponent;
  let fixture: ComponentFixture<WorkspaceAnswerDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkspaceAnswerDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkspaceAnswerDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
