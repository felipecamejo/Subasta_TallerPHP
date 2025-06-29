import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminAprobarCasasComponent } from './aprobar-casas.component';

describe('AdminAprobarCasasComponent', () => {
  let component: AdminAprobarCasasComponent;
  let fixture: ComponentFixture<AdminAprobarCasasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminAprobarCasasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminAprobarCasasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
