import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { PLATFORM_ID } from '@angular/core';
import * as L from 'leaflet';

function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const pass = group.get('contrasenia')?.value;
  const confirm = group.get('confirmarContrasenia')?.value;
  return pass === confirm ? null : { mismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  form!: FormGroup;
  map: any;    
  marker: any;

  defaultLatLng: [number, number] = [10.0, -84.0];

  constructor(
    private fb: FormBuilder,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      cedula: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', Validators.required],
      imagen: [null],
      contraseniaGroup: this.fb.group({
        contrasenia: ['', [Validators.required, Validators.minLength(6)]],
        confirmarContrasenia: ['', Validators.required]
      }, { validators: passwordMatchValidator }),
      rol: ['', Validators.required],
      matricula: [''],
      latitud: [null, Validators.required],
      longitud: [null, Validators.required]
    });

    this.form.get('rol')?.valueChanges.subscribe(rol => {
      const matricula = this.form.get('matricula');
      if (rol === 'rematador') {
        matricula?.setValidators([Validators.required]);
      } else {
        matricula?.clearValidators();
        matricula?.setValue('');
      }
      matricula?.updateValueAndValidity();
    });

    this.initMap();
  }

  async initMap(): Promise<void> {
    if (isPlatformBrowser(this.platformId)) {
      const L = (await import('leaflet')).default;

(() => {
  // Borra _getIconUrl ignorando TS
  delete (L.Icon.Default.prototype as any)._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
    iconUrl: 'assets/leaflet/marker-icon.png',
    shadowUrl: 'assets/leaflet/marker-shadow.png',
  });
})();
      this.map = L.map('map').setView(this.defaultLatLng, 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.map);

      this.marker = L.marker(this.defaultLatLng, { draggable: true }).addTo(this.map);

      this.form.patchValue({
        latitud: this.defaultLatLng[0],
        longitud: this.defaultLatLng[1]
      });

      this.marker.on('dragend', () => {
        const pos = this.marker.getLatLng();
        this.form.patchValue({
          latitud: pos.lat,
          longitud: pos.lng
        });
      });
    }
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];
      this.form.patchValue({ imagen: file });
    }
  }

  onSubmit(): void {
    if (this.form.valid) {
      const formValue = {
        nombre: this.form.value.nombre,
        cedula: this.form.value.cedula,
        email: this.form.value.email,
        telefono: this.form.value.telefono,
        imagen: this.form.value.imagen,
        contrasenia: this.form.value.contraseniaGroup.contrasenia,
        rol: this.form.value.rol,
        matricula: this.form.value.matricula,
        latitud: this.form.value.latitud,
        longitud: this.form.value.longitud
      };

      console.log('Enviar al backend:', formValue);
      // Aquí llamas a tu servicio para enviar datos
    } else {
      this.form.markAllAsTouched();
    }
  }
}