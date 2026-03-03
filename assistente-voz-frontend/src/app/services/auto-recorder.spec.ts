import { TestBed } from '@angular/core/testing';

import { AutoRecorder } from './auto-recorder';

describe('AutoRecorder', () => {
  let service: AutoRecorder;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AutoRecorder);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
