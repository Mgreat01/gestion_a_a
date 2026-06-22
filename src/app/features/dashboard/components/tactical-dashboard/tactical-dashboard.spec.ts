import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TacticalDashboard } from './tactical-dashboard';

describe('TacticalDashboard', () => {
  let component: TacticalDashboard;
  let fixture: ComponentFixture<TacticalDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TacticalDashboard],
    }).compileComponents();

    fixture = TestBed.createComponent(TacticalDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
