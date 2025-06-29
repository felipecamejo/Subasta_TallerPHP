import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PerfilEditarModalComponent } from './perfil-editar-modal.component';

describe('PerfilEditarModalComponent', () => {
  let component: PerfilEditarModalComponent;
  let fixture: ComponentFixture<PerfilEditarModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerfilEditarModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PerfilEditarModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
