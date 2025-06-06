// src/app/register/register.component.ts
import { Component, Inject, PLATFORM_ID } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule],
  template: `
    <h2>Registro</h2>
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <label>Nombre:</label>
      <input formControlName="nombre" type="text" />
      <br />

      <label>Cédula:</label>
      <input formControlName="cedula" type="text" />
      <br />

      <label>Email:</label>
      <input formControlName="email" type="email" />
      <br />

      <label>Teléfono:</label>
      <input formControlName="telefono" type="text" />
      <br />

      <label>Contraseña:</label>
      <input formControlName="contrasenia" type="password" />
      <br />

      <label>Tipo:</label>
      <select formControlName="tipo">
        <option value="cliente">Cliente</option>
        <option value="rematador">Rematador</option>
      </select>
      <br />

      <div *ngIf="form.value.tipo === 'rematador'">
        <label>Matrícula:</label>
        <input formControlName="matricula" type="text" />
        <br />
      </div>

      <div id="map" style="height: 300px; margin-top: 1rem;"></div>
      <p *ngIf="form.value.latitud && form.value.longitud">
        Ubicación seleccionada: {{ form.value.latitud }},
        {{ form.value.longitud }}
      </p>

      <button type="submit">Registrarse</button>
    </form>

    <br />
    <a routerLink="/login">¿Ya tenés cuenta? Iniciar sesión</a>
  `,
})
export class RegisterComponent {
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      cedula: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', Validators.required],
      contrasenia: ['', Validators.required],
      tipo: ['cliente', Validators.required],
      matricula: [''],
      latitud: [null],
      longitud: [null],
    });
  }

  async ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      const L = await import('leaflet');

      const map = L.map('map').setView([-34.9011, -56.1645], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data © OpenStreetMap contributors',
      }).addTo(map);

      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        this.form.patchValue({
          latitud: lat,
          longitud: lng,
        });
      });

      // Fix para íconos de Leaflet si no aparecen
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
        iconUrl: 'assets/leaflet/marker-icon.png',
        shadowUrl: 'assets/leaflet/marker-shadow.png',
      });
    }
  }

  onSubmit() {
    if (this.form.valid) {
      this.http
        .post('http://localhost:8000/api/register', this.form.value)
        .subscribe({
          next: (res) => {
            console.log('Registrado:', res);
            alert('Registro exitoso');
          },
          error: (err) => {
            console.error('Error al registrar:', err);
            alert('Error en el registro');
          },
        });
    }
  }
}
