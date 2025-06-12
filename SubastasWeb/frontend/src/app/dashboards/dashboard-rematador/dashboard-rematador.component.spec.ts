import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardRematadorComponent } from './dashboard-rematador.component';

describe('DashboardRematadorComponent', () => {
  let component: DashboardRematadorComponent;
  let fixture: ComponentFixture<DashboardRematadorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardRematadorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardRematadorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
