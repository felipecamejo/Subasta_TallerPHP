import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerificacionPendienteComponent } from './verificacion-pendiente.component';

describe('VerificacionPendienteComponent', () => {
  let component: VerificacionPendienteComponent;
  let fixture: ComponentFixture<VerificacionPendienteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerificacionPendienteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VerificacionPendienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
