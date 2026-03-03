import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlbaListener } from './alba-listener';

describe('AlbaListener', () => {
  let component: AlbaListener;
  let fixture: ComponentFixture<AlbaListener>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlbaListener],
    }).compileComponents();

    fixture = TestBed.createComponent(AlbaListener);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
