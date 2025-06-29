import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearLoteModalComponent } from './crear-lote-modal.component';

describe('CrearLoteModalComponent', () => {
  let component: CrearLoteModalComponent;
  let fixture: ComponentFixture<CrearLoteModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearLoteModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrearLoteModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
