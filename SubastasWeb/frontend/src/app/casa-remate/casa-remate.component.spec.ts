import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CasaRemateComponent } from './casa-remate.component';

describe('CasaRemateComponent', () => {
  let component: CasaRemateComponent;
  let fixture: ComponentFixture<CasaRemateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CasaRemateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CasaRemateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
