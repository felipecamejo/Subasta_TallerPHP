import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CasaRemateDashboardComponent } from './casa-remate-dashboard.component';

describe('CasaRemateDashboardComponent', () => {
  let component: CasaRemateDashboardComponent;
  let fixture: ComponentFixture<CasaRemateDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CasaRemateDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CasaRemateDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
