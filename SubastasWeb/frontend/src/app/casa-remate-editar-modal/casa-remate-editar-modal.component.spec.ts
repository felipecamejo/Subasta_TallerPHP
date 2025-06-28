import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CasaRemateEditarModalComponent } from './casa-remate-editar-modal.component';

describe('CasaRemateEditarModalComponent', () => {
  let component: CasaRemateEditarModalComponent;
  let fixture: ComponentFixture<CasaRemateEditarModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CasaRemateEditarModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CasaRemateEditarModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
