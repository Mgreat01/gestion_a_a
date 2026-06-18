import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IncidentItem } from './incident-item';

describe('IncidentItem', () => {
  let component: IncidentItem;
  let fixture: ComponentFixture<IncidentItem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncidentItem],
    }).compileComponents();

    fixture = TestBed.createComponent(IncidentItem);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
