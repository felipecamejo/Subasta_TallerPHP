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
  loading = false;

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
      contrasenia: ['', [Validators.required, Validators.minLength(8)]],
      confirmarContrasenia: ['', Validators.required],
      tipo: ['cliente', Validators.required],
      matricula: [''],
      idFiscal: [''],
      latitud: [null, Validators.required],
      longitud: [null, Validators.required],
    }, { validator: passwordsMatchValidator() });

    this.form.get('tipo')?.valueChanges.subscribe(() => this.onRolChange());
  }

  onRolChange() {
    const tipo = this.form.get('tipo')?.value;
    const matriculaControl = this.form.get('matricula');
    const idFiscalControl = this.form.get('idFiscal');

    if (tipo === 'rematador') {
      matriculaControl?.setValidators(Validators.required);
      idFiscalControl?.clearValidators();
      idFiscalControl?.setValue('');
    } else if (tipo === 'casa_remate') {
      idFiscalControl?.setValidators(Validators.required);
      matriculaControl?.clearValidators();
      matriculaControl?.setValue('');
    } else {
      matriculaControl?.clearValidators();
      idFiscalControl?.clearValidators();
      matriculaControl?.setValue('');
      idFiscalControl?.setValue('');
    }

    matriculaControl?.updateValueAndValidity();
    idFiscalControl?.updateValueAndValidity();
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
          this.form.patchValue({ latitud: lat, longitud: lng });

          if (marker) map.removeLayer(marker);
          marker = L.marker([lat, lng]).addTo(map);

          this.form.get('latitud')?.markAsTouched();
          this.form.get('longitud')?.markAsTouched();
        });
      } catch (e) {
        console.error('Error cargando Leaflet:', e);
      }
    }
  }

  onSubmit() {
    if (this.loading) return;

    this.submissionError = '';
    this.fieldErrors = {};
    this.form.markAllAsTouched();

    if (this.form.valid) {
      this.loading = true;

      const formData = {
        ...this.form.value,
        contrasenia_confirmation: this.form.value.confirmarContrasenia,
        rol: this.form.value.tipo
      };

      // Limpieza
      delete formData.confirmarContrasenia;
      delete formData.tipo;

      if (formData.rol !== 'rematador') delete formData.matricula;
      if (formData.rol !== 'casa_remate') delete formData.idFiscal;

      const url = formData.rol === 'casa_remate'
        ? 'http://localhost:8000/api/register-casa-remate'
        : 'http://localhost:8000/api/register';

      this.http.post(url, formData).subscribe({
        next: () => {
          alert('Registro exitoso. Verificá tu correo.');
          this.router.navigate(['/verificar-email']);
          this.loading = false;
        },
        error: (err: HttpErrorResponse) => {
          this.loading = false;

          if (err.status === 422 && err.error?.errors) {
            this.fieldErrors = err.error.errors;
            let generalMessage = 'Por favor, corrige los siguientes errores:\n';
            for (const key in this.fieldErrors) {
              generalMessage += `- ${this.fieldErrors[key].join(', ')}\n`;
            }
            this.submissionError = generalMessage;
            alert(generalMessage);
          } else if (err.error?.message) {
            this.submissionError = err.error.message;
            alert(`Error: ${err.error.message}`);
          } else {
            this.submissionError = 'Error inesperado. Intenta de nuevo.';
            alert('Error en el registro');
          }
        },
      });
    } else {
      this.submissionError = 'Completá todos los campos correctamente.';
    }
  }

  // Getters para acceder desde el HTML
  get nombre() { return this.form.get('nombre'); }
  get cedula() { return this.form.get('cedula'); }
  get email() { return this.form.get('email'); }
  get telefono() { return this.form.get('telefono'); }
  get contrasenia() { return this.form.get('contrasenia'); }
  get confirmarContrasenia() { return this.form.get('confirmarContrasenia'); }
  get tipo() { return this.form.get('tipo'); }
  get matricula() { return this.form.get('matricula'); }
  get idFiscal() { return this.form.get('idFiscal'); }
  get latitud() { return this.form.get('latitud'); }
  get longitud() { return this.form.get('longitud'); }
  get esRematador() { return this.tipo?.value === 'rematador'; }
  get esCasaRemate() { return this.tipo?.value === 'casa_remate'; }
}
