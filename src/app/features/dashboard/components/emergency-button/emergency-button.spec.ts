import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmergencyButton } from './emergency-button';

describe('EmergencyButton', () => {
  let component: EmergencyButton;
  let fixture: ComponentFixture<EmergencyButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmergencyButton],
    }).compileComponents();

    fixture = TestBed.createComponent(EmergencyButton);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
