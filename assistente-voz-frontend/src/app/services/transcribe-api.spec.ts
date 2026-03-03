import { TestBed } from '@angular/core/testing';

import { TranscribeApi } from './transcribe-api';

describe('TranscribeApi', () => {
  let service: TranscribeApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TranscribeApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
