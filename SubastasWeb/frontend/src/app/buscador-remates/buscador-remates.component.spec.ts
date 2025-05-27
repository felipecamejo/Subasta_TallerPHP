import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuscadorRematesComponent } from './buscador-remates.component';

describe('BuscadorRematesComponent', () => {
  let component: BuscadorRematesComponent;
  let fixture: ComponentFixture<BuscadorRematesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuscadorRematesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BuscadorRematesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
