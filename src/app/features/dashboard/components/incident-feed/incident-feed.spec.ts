import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IncidentFeed } from './incident-feed';

describe('IncidentFeed', () => {
  let component: IncidentFeed;
  let fixture: ComponentFixture<IncidentFeed>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncidentFeed],
    }).compileComponents();

    fixture = TestBed.createComponent(IncidentFeed);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
