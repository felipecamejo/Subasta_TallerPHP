import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailVerificadoComponent } from './email-verificado.component';

describe('EmailVerificadoComponent', () => {
  let component: EmailVerificadoComponent;
  let fixture: ComponentFixture<EmailVerificadoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmailVerificadoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmailVerificadoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
