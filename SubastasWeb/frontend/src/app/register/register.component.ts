import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { AuthService } from '../../services/auth.service';
import { environment } from '../../environments/environment';
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
import { HttpClientModule, HttpErrorResponse } from '@angular/common/http';

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
  styleUrls: ['./register.component.scss'],
  templateUrl: './register.component.html',
})
export class RegisterComponent implements OnInit, AfterViewInit {
  form!: FormGroup;
  submissionError = '';
  fieldErrors: { [key: string]: string[] } = {};
  loading = false;
  selectedImage: File | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      cedula: [{ value: '', disabled: false }, Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', Validators.required],
      contrasenia: ['', [Validators.required, Validators.minLength(8)]],
      confirmarContrasenia: ['', Validators.required],
      tipo: ['cliente', Validators.required],
      matricula: [{ value: '', disabled: true }],
      idFiscal: [{ value: '', disabled: true }],
      latitud: [null, Validators.required],
      longitud: [null, Validators.required],
    }, { validator: passwordsMatchValidator() });

    this.form.get('tipo')?.valueChanges.subscribe(() => this.onRolChange());
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
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

      let marker: L.Marker;
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        this.form.patchValue({ latitud: lat, longitud: lng });

        if (marker) map.removeLayer(marker);
        marker = L.marker([lat, lng]).addTo(map);

        this.latitud?.markAsTouched();
        this.longitud?.markAsTouched();
      });
    }
  }

onRolChange() {
  const tipo = this.form.get('tipo')?.value;
  const matriculaControl = this.form.get('matricula');
  const idFiscalControl = this.form.get('idFiscal');
  const cedulaControl = this.form.get('cedula');

  if (tipo === 'casa_remate') {
    // Casa de remate: requiere idFiscal, no usa matrícula ni cédula
    idFiscalControl?.setValidators(Validators.required);
    idFiscalControl?.enable();

    matriculaControl?.clearValidators();
    matriculaControl?.setValue('');
    matriculaControl?.disable();

    cedulaControl?.clearValidators();
    cedulaControl?.setValue(null);
    cedulaControl?.disable();
  } else if (tipo === 'rematador') {
    // Rematador: requiere matrícula y cédula
    matriculaControl?.setValidators(Validators.required);
    matriculaControl?.enable();

    idFiscalControl?.clearValidators();
    idFiscalControl?.setValue('');
    idFiscalControl?.disable();

    cedulaControl?.setValidators(Validators.required);
    cedulaControl?.enable();
  } else {
    // Cliente: no requiere matrícula ni idFiscal, pero sí cédula
    matriculaControl?.clearValidators();
    matriculaControl?.setValue('');
    matriculaControl?.disable();

    idFiscalControl?.clearValidators();
    idFiscalControl?.setValue('');
    idFiscalControl?.disable();

    cedulaControl?.setValidators(Validators.required);
    cedulaControl?.enable();
  }

  // Actualizar estado de los campos
  matriculaControl?.updateValueAndValidity();
  idFiscalControl?.updateValueAndValidity();
  cedulaControl?.updateValueAndValidity();
}
  onSubmit() {
    if (this.loading) return;

    this.submissionError = '';
    this.fieldErrors = {};
    this.form.markAllAsTouched();

    if (this.form.valid) {
      this.loading = true;
      const tipo = this.form.value.tipo;

      const data = new FormData();
      data.append('nombre', this.form.value.nombre);
      data.append('email', this.form.value.email);
      data.append('telefono', this.form.value.telefono);
      data.append('latitud', this.form.value.latitud);
      data.append('longitud', this.form.value.longitud);
      data.append('rol', tipo);
      data.append('contrasenia', this.form.value.contrasenia);
      data.append('contrasenia_confirmation', this.form.value.confirmarContrasenia);

      if (tipo !== 'casa_remate') {
        data.append('cedula', this.form.value.cedula);
      }

      if (tipo === 'rematador') {
        data.append('matricula', this.form.value.matricula);
      }

      if (this.selectedImage) {
        data.append('imagen', this.selectedImage);
      }

      const request$ = tipo === 'casa_remate'
        ? this.authService.registerCasaRemate(data)
        : this.authService.registerUsuario(data);

      request$.subscribe({
        next: () => {
          alert('Registro exitoso. Verificá tu correo.');
          this.router.navigate(['/verificar-email']);
          this.loading = false;
        },
        error: (err: HttpErrorResponse) => this.handleError(err),
      });
    } else {
      this.submissionError = 'Completá todos los campos correctamente.';
    }
  }

  private handleError(err: HttpErrorResponse) {
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
  }

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

  onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    this.selectedImage = input.files[0];
  } else {
    this.selectedImage = null;
  }
}
}
