import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearSubastaModalComponent } from './crear-subasta-modal.component';

describe('CrearSubastaModalComponent', () => {
  let component: CrearSubastaModalComponent;
  let fixture: ComponentFixture<CrearSubastaModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearSubastaModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrearSubastaModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
