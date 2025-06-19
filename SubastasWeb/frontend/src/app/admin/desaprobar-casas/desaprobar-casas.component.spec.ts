import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DesaprobarCasasComponent } from './desaprobar-casas.component';

describe('DesaprobarCasasComponent', () => {
  let component: DesaprobarCasasComponent;
  let fixture: ComponentFixture<DesaprobarCasasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DesaprobarCasasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DesaprobarCasasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
