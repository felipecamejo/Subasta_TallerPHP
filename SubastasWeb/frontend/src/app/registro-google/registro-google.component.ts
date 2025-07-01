import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AuthService } from '../../services/auth.service';
import { Component, OnInit, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import {
  FormGroup,
  FormControl,
  Validators,
  AbstractControl,
  ValidationErrors,
  ReactiveFormsModule
} from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';


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
  private http: HttpClient,
  private router: Router,
  private route: ActivatedRoute,
  private authService: AuthService,
  @Inject(PLATFORM_ID) private platformId: Object
) {}

  ngOnInit(): void {
  this.form = new FormGroup({
    nombre: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    cedula: new FormControl(null, Validators.required),
    telefono: new FormControl('', Validators.required),
    contrasenia: new FormControl('', [Validators.required, Validators.minLength(8)]),
    contrasenia_confirmation: new FormControl('', Validators.required),
    rol: new FormControl('', Validators.required),
    imagen: new FormControl(''),
    idFiscal: new FormControl(null),
    matricula: new FormControl(null),
    latitud: new FormControl(null, Validators.required),
    longitud: new FormControl(null, Validators.required),
    google_id: new FormControl('', Validators.required),
});

    this.route.queryParams.subscribe(params => {
      const imagen = params['imagen'] || this.obtenerImagenAleatoria();
      this.form.patchValue({
        nombre: params['nombre'] || '',
        email: params['email'] || '',
        rol: params['rol'] || '',
        google_id: params['google_id'] || '',
        imagen: params['imagen'] || ''
      });

      this.onRolChange();
    });
  }

ngAfterViewInit() {
  if (isPlatformBrowser(this.platformId)) {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
      iconUrl: 'assets/leaflet/marker-icon.png',
      shadowUrl: 'assets/leaflet/marker-shadow.png',
    });

    const map = L.map('map-registro-google').setView([-34.9011, -56.1645], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'Map data © OpenStreetMap contributors',
    }).addTo(map);

    let marker: L.Marker;

    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      this.form.patchValue({ latitud: lat, longitud: lng });

      if (marker) map.removeLayer(marker);
      marker = L.marker([lat, lng]).addTo(map);

      this.form.get('latitud')?.markAsTouched();
      this.form.get('longitud')?.markAsTouched();
    });
  }
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

 const cedula = this.form.get('cedula');

if (rol === 'casa_remate') {
  idFiscal?.setValidators([Validators.required]);
  matricula?.clearValidators();
  cedula?.clearValidators(); // <- importante
} else if (rol === 'rematador') {
  matricula?.setValidators([Validators.required]);
  idFiscal?.clearValidators();
  cedula?.setValidators([Validators.required]);
} else {
  idFiscal?.clearValidators();
  matricula?.clearValidators();
  cedula?.setValidators([Validators.required]);
}

if (rol === 'casa_remate') {
  cedula?.clearValidators();
  cedula?.setValue(null);
  cedula?.updateValueAndValidity();
}
  
}

enviar() {
  this.form.markAllAsTouched();

  if (this.form.invalid) {
    console.log('Formulario inválido.');
    Object.entries(this.form.controls).forEach(([key, control]) => {
      if (control.invalid) {
        console.warn(`Campo inválido: ${key}`, control.errors);
      }
    });
    return;
  }

  console.log('Formulario válido.');
  console.log(this.form.value)

  this.authService.registrarConGoogle(this.form.value).subscribe({
    next: (res: any) => {
      console.log('Registro exitoso', res);
      localStorage.setItem('token', res.access_token);
      localStorage.setItem('usuario_id', res.usuario_id);
      localStorage.setItem('rol', res.rol);

      const rol = res.rol;
      if (rol === 'cliente') this.router.navigate(['/dashboard-cliente']);
      else if (rol === 'rematador') this.router.navigate(['/dashboard-rematador']);
      else if (rol === 'casa_remate') this.router.navigate(['/dashboard-casa']);
    },
    error: err => {
      console.error('Error al registrar con Google:', err);
      alert('Error: ' + JSON.stringify(err.error.details || err.error));
    }
  });
}

obtenerImagenAleatoria(): string {
  const imagenes = [
    'avatars/default1.png',
    'avatars/default2.png',
    'avatars/default3.png',
    'avatars/default4.png',
  ];
  const indice = Math.floor(Math.random() * imagenes.length);
  return imagenes[indice];
}

}
