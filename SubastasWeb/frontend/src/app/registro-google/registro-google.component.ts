import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  standalone: true,
  selector: 'app-registro-google',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './registro-google.component.html',
})
export class RegistroGoogleComponent implements OnInit {
  form!: FormGroup;
  rol: string = 'cliente';
  imagenUrl: string = '';
  latitud: number = 0;
  longitud: number = 0;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    const queryParams = this.route.snapshot.queryParams;
    const nombre = queryParams['nombre'] || '';
    const email = queryParams['email'] || '';
    this.rol = queryParams['rol'] || 'cliente';
    this.imagenUrl = queryParams['imagen'] || '';

    this.form = this.fb.group({
      nombre: [nombre, Validators.required],
      email: [email, [Validators.required, Validators.email]],
      cedula: ['', Validators.required],
      telefono: ['', Validators.required],
      matricula: [this.rol === 'rematador' ? '' : null],
      latitud: [0],
      longitud: [0],
    });

    if (this.rol !== 'rematador') {
      this.form.get('matricula')?.disable();
    }
  }

  onUbicacionSeleccionada(lat: number, lng: number) {
    this.latitud = lat;
    this.longitud = lng;
    this.form.patchValue({ latitud: lat, longitud: lng });
  }

  enviar() {
    if (this.form.invalid) return;

    const payload = {
      ...this.form.getRawValue(),
      rol: this.rol,
    };

    this.http.post('http://localhost:8000/api/registro/google', payload).subscribe({
      next: (res: any) => {
        localStorage.setItem('token', res.access_token);
        this.router.navigate(['/dashboard']);
      },
      error: err => {
        console.error('Error al registrar con Google:', err);
      },
    });
  }
}