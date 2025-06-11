import { Component, Inject, PLATFORM_ID, OnInit, AfterViewInit } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidatorFn,
} from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClient, HttpClientModule, HttpErrorResponse } from '@angular/common/http';

// Validador personalizado para confirmar contraseñas
export function passwordsMatchValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const password = control.get('contrasenia');
    const confirmPassword = control.get('confirmarContrasenia');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordsMismatch: true };
    }
    return null;
  };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule],
  templateUrl: './register.component.html',
})
export class RegisterComponent implements OnInit, AfterViewInit {

  form!: FormGroup;
  submissionError: string = '';
  fieldErrors: { [key: string]: string[] } = {};

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      cedula: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', Validators.required],
      contrasenia: ['', [Validators.required, Validators.minLength(6)]],
      confirmarContrasenia: ['', Validators.required],
      tipo: ['cliente', Validators.required],
      matricula: [''],
      latitud: [null, Validators.required],
      longitud: [null, Validators.required],
    }, {
      validator: passwordsMatchValidator()
    });

    this.form.get('tipo')?.valueChanges.subscribe(tipo => {
      const matriculaControl = this.form.get('matricula');
      if (tipo === 'rematador') {
        matriculaControl?.setValidators(Validators.required);
      } else {
        matriculaControl?.clearValidators();
      }
      matriculaControl?.updateValueAndValidity();
      this.form.updateValueAndValidity();
    });
  }

  async ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const L = await import('leaflet');

        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
          iconUrl: 'assets/leaflet/marker-icon.png',
          shadowUrl: 'assets/leaflet/marker-shadow.png',
        });

        const map = L.map('map').setView([-34.9011, -56.1645], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: 'Map data © OpenStreetMap contributors',
        }).addTo(map);

        let marker: L.Marker | undefined;

        map.on('click', (e: any) => {
          const { lat, lng } = e.latlng;
          this.form.patchValue({
            latitud: lat,
            longitud: lng,
          });

          if (marker) {
            map.removeLayer(marker);
          }
          marker = L.marker([lat, lng]).addTo(map);

          this.form.get('latitud')?.markAsTouched();
          this.form.get('longitud')?.markAsTouched();
        });

      } catch (e) {
        console.error('Error cargando Leaflet o inicializando el mapa:', e);
      }
    }
  }

  onSubmit() {
    this.submissionError = '';
    this.fieldErrors = {};
    this.form.markAllAsTouched();

    if (this.form.valid) {
      const formData = { ...this.form.value };
      delete formData.confirmarContrasenia;

      this.http
        .post('http://localhost:8000/api/register', formData)
        .subscribe({
          next: (res) => {
            console.log('Registro exitoso:', res);
            alert('Registro exitoso. Serás redirigido al inicio de sesión.');
            this.router.navigate(['/login']);
          },
          error: (err: HttpErrorResponse) => {
            console.error('Error al registrar:', err);

            if (err.status === 422 && err.error && err.error.errors) {
              this.fieldErrors = err.error.errors;

              let generalMessage = 'Por favor, corrige los siguientes errores: \n';
              for (const key in this.fieldErrors) {
                if (this.fieldErrors.hasOwnProperty(key)) {
                  generalMessage += `- ${this.fieldErrors[key].join(', ')}\n`;
                }
              }
              this.submissionError = generalMessage;
              alert(generalMessage);
            } else if (err.error && err.error.message) {
              this.submissionError = err.error.message;
              alert(`Error: ${err.error.message}`);
            } else {
              this.submissionError = 'Ocurrió un error inesperado al registrarse. Por favor, intenta de nuevo.';
              alert('Error en el registro');
            }
          },
        });
    } else {
      this.submissionError = 'Por favor, completa todos los campos requeridos correctamente.';
    }
  }

  get nombre() { return this.form.get('nombre'); }
  get cedula() { return this.form.get('cedula'); }
  get email() { return this.form.get('email'); }
  get telefono() { return this.form.get('telefono'); }
  get contrasenia() { return this.form.get('contrasenia'); }
  get confirmarContrasenia() { return this.form.get('confirmarContrasenia'); }
  get tipo() { return this.form.get('tipo'); }
  get matricula() { return this.form.get('matricula'); }
  get latitud() { return this.form.get('latitud'); }
  get longitud() { return this.form.get('longitud'); }
}
