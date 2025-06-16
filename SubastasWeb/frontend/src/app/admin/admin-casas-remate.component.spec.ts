import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminCasasRemateComponent } from './admin-casas-remate.component';

describe('AdminCasasRemateComponent', () => {
  let component: AdminCasasRemateComponent;
  let fixture: ComponentFixture<AdminCasasRemateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCasasRemateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminCasasRemateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
