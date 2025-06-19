import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AprobarCasasComponent } from './aprobar-casas.component';

describe('AprobarCasasComponent', () => {
  let component: AprobarCasasComponent;
  let fixture: ComponentFixture<AprobarCasasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AprobarCasasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AprobarCasasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
