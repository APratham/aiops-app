import { TestBed } from '@angular/core/testing';

import { TimeManagementService } from './time-management.service';

describe('TimeManagementService', () => {
  let service: TimeManagementService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TimeManagementService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
