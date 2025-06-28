import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearArticuloModalComponent } from './crear-articulo-modal.component';

describe('CrearArticuloModalComponent', () => {
  let component: CrearArticuloModalComponent;
  let fixture: ComponentFixture<CrearArticuloModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearArticuloModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrearArticuloModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
