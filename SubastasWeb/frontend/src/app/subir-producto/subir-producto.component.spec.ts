import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubirProductoComponent } from './subir-producto.component';

describe('SubirProductoComponent', () => {
  let component: SubirProductoComponent;
  let fixture: ComponentFixture<SubirProductoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubirProductoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubirProductoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
