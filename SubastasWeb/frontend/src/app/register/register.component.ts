import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { PLATFORM_ID } from '@angular/core';
import { GoogleLoginComponent } from '../google-login/google-login.component';  // <-- Importa tu componente GoogleLogin
import * as L from 'leaflet';
import { AuthService, RegistroData } from '../services/auth.service';

function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const pass = group.get('contrasenia')?.value;
  const confirm = group.get('confirmarContrasenia')?.value;
  return pass === confirm ? null : { mismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,  GoogleLoginComponent],
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
    @Inject(PLATFORM_ID) private platformId: Object,
    private authService: AuthService
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
      tipo: ['', Validators.required],  // Aquí es "tipo"
      matricula: [''],
      latitud: [null, Validators.required],
      longitud: [null, Validators.required]
    });

    this.form.get('tipo')?.valueChanges.subscribe(tipo => {
      const matricula = this.form.get('matricula');
      if (tipo === 'rematador') {
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

      // Configurar iconos leaflet
      delete (L.Icon.Default.prototype as any)._getIconUrl;

      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
        iconUrl: 'assets/leaflet/marker-icon.png',
        shadowUrl: 'assets/leaflet/marker-shadow.png',
      });

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
      const formValue: RegistroData = {
        nombre: this.form.value.nombre,
        cedula: this.form.value.cedula,
        email: this.form.value.email,
        telefono: this.form.value.telefono,
        imagen: this.form.value.imagen,
        contrasenia: this.form.value.contraseniaGroup.contrasenia,
        tipo: this.form.value.tipo,  // Aquí "tipo" coincide con el backend
        matricula: this.form.value.matricula,
        latitud: this.form.value.latitud,
        longitud: this.form.value.longitud
      };

      console.log('Enviar al backend:', formValue);

      this.authService.register(formValue).subscribe({
        next: (response) => {
          console.log('Registro exitoso:', response);
          alert('Registro completado con éxito');
          this.form.reset();
        },
        error: (error) => {
          console.error('Error en el registro:', error);
          alert('Error al registrar: ' + (error.error?.message || error.message));
        }
      });
    } else {
      this.form.markAllAsTouched();
    }
  }
}