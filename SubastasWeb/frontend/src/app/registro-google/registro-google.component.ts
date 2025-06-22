import { Component, OnInit, AfterViewInit } from '@angular/core';
import {
  FormGroup,
  FormControl,
  Validators,
  AbstractControl,
  ValidationErrors,
  ReactiveFormsModule
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import * as L from 'leaflet';

import { RegistroGoogleService } from '../../services/registro-google.service';
import { RegistroGooglePayload } from '../../models/registro-google-payload';

@Component({
  selector: 'app-registro-google',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, RouterModule],
  templateUrl: './registro-google.component.html',
  styleUrls: ['./registro-google.component.scss']
})
export class RegistroGoogleComponent implements OnInit, AfterViewInit {
  form!: FormGroup;
  map!: L.Map;
  marker!: L.Marker;

  constructor(
    private registroGoogleService: RegistroGoogleService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      nombre: new FormControl('', Validators.required),
      email: new FormControl('', [Validators.required, Validators.email]),
      cedula: new FormControl('', Validators.required),
      telefono: new FormControl('', Validators.required),
      contrasenia: new FormControl('', [Validators.required, Validators.minLength(8)]),
      contrasenia_confirmation: new FormControl('', Validators.required),
      rol: new FormControl('', Validators.required),
      idFiscal: new FormControl(''),
      matricula: new FormControl(''),
      latitud: new FormControl(null, Validators.required),
      longitud: new FormControl(null, Validators.required),
      google_id: new FormControl('', Validators.required),
    }, { validators: this.matchPasswords });

    this.route.queryParams.subscribe(params => {
      this.form.patchValue({
        nombre: params['nombre'] || '',
        email: params['email'] || '',
        rol: params['rol'] || '',
        google_id: params['google_id'] || ''
      });

      this.onRolChange();
    });
  }

  ngAfterViewInit(): void {
    const existingMap = L.DomUtil.get('map-registro-google');
    if (existingMap != null) {
      (existingMap as any)._leaflet_id = null;
    }

    this.map = L.map('map-registro-google').setView([-34.9011, -56.1645], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      if (this.marker) {
        this.marker.setLatLng([lat, lng]);
      } else {
        this.marker = L.marker([lat, lng]).addTo(this.map);
      }

      this.form.patchValue({ latitud: lat, longitud: lng });
    });
  }

  matchPasswords(group: AbstractControl): ValidationErrors | null {
    const pass = group.get('contrasenia')?.value;
    const confirm = group.get('contrasenia_confirmation')?.value;
    return pass === confirm ? null : { passwordMismatch: true };
  }

  onRolChange() {
    const rol = this.form.get('rol')?.value;
    const idFiscal = this.form.get('idFiscal');
    const matricula = this.form.get('matricula');

    if (rol === 'casa_remate') {
      idFiscal?.setValidators([Validators.required]);
      matricula?.clearValidators();
    } else if (rol === 'rematador') {
      matricula?.setValidators([Validators.required]);
      idFiscal?.clearValidators();
    } else {
      idFiscal?.clearValidators();
      matricula?.clearValidators();
    }

    idFiscal?.updateValueAndValidity();
    matricula?.updateValueAndValidity();
  }

  enviar() {
  this.form.markAllAsTouched();
  if (this.form.invalid) {
    console.warn('Formulario inválido.');
    return;
  }

  const rol = this.form.get('rol')?.value;

  const rutasPorRol: Record<'cliente' | 'rematador' | 'casa_remate', string> = {
    cliente: '/dashboard-cliente',
    rematador: '/dashboard-rematador',
    casa_remate: '/dashboard-casa-remate'
  };

  const url = rol === 'casa_remate'
    ? 'http://localhost:8000/api/register-google-casa-remate'
    : 'http://localhost:8000/api/register-google-user';

  const payload: RegistroGooglePayload = {
    nombre: this.form.value.nombre,
    email: this.form.value.email,
    cedula: this.form.value.cedula,
    telefono: this.form.value.telefono,
    contrasenia: this.form.value.contrasenia,
    contrasenia_confirmation: this.form.value.contrasenia_confirmation,
    rol: rol,
    latitud: this.form.value.latitud,
    longitud: this.form.value.longitud,
    google_id: this.form.value.google_id,
    ...(rol === 'rematador' && { matricula: this.form.value.matricula }),
    ...(rol === 'casa_remate' && { idFiscal: this.form.value.idFiscal })
  };

  this.registroGoogleService.registrarUsuario(url, payload).subscribe({
    next: (res: any) => {
      console.log('Registro exitoso', res);
      localStorage.setItem('token', res.access_token);
      localStorage.setItem('usuario_id', res.usuario_id);
      localStorage.setItem('rol', res.rol);

      const destino = rutasPorRol[rol as keyof typeof rutasPorRol] || '/';
      this.router.navigate([destino]);
    },
    error: err => {
      console.error('Error al registrar con Google:', err);
      alert('Error: ' + JSON.stringify(err.error.details || err.error));
    }
  });
}

}
