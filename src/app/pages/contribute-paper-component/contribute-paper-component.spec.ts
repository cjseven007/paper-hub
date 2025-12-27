import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContributePaperComponent } from './contribute-paper-component';

describe('ContributePaperComponent', () => {
  let component: ContributePaperComponent;
  let fixture: ComponentFixture<ContributePaperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContributePaperComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContributePaperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
