import { environment } from '../../environments/environment';
import {
  Component,
  OnInit,
  AfterViewInit,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidatorFn,
} from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule, HttpErrorResponse } from '@angular/common/http';

export const passwordMatchValidator: ValidatorFn = (control: AbstractControl): { [key: string]: boolean } | null => {
  const password = control.get('contrasenia');
  const confirmPassword = control.get('contrasenia_confirmation');
  return password && confirmPassword && password.value !== confirmPassword.value
    ? { passwordMismatch: true }
    : null;
};

@Component({
  selector: 'app-registro-google',
  standalone: true,
  templateUrl: './registro-google.component.html',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule],
})
export class RegistroGoogleComponent implements OnInit, AfterViewInit {
  form!: FormGroup;
  imagenUrl: string = '';
  googleId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    const queryParams = this.route.snapshot.queryParams;
    const nombre = queryParams['nombre'] || '';
    const email = queryParams['email'] || '';
    this.imagenUrl = queryParams['imagen'] || '';
    this.googleId = queryParams['google_id'] || null;

    this.form = this.fb.group({
      nombre: [nombre, Validators.required],
      email: [{ value: email, disabled: true }, [Validators.required, Validators.email]],
      cedula: ['', Validators.required],
      telefono: ['', Validators.required],
      contrasenia: ['', [Validators.required, Validators.minLength(8)]],
      contrasenia_confirmation: ['', Validators.required],
      rol: ['', Validators.required],
      matricula: [''],
      idFiscal: [''],
      latitud: [null, Validators.required],
      longitud: [null, Validators.required],
    }, { validators: passwordMatchValidator });
  }

  onRolChange() {
    const rol = this.form.get('rol')?.value;

    if (rol === 'rematador') {
      this.form.get('matricula')?.setValidators(Validators.required);
      this.form.get('idFiscal')?.clearValidators();
    } else if (rol === 'casa_remate') {
      this.form.get('idFiscal')?.setValidators(Validators.required);
      this.form.get('matricula')?.clearValidators();
    } else {
      this.form.get('matricula')?.clearValidators();
      this.form.get('idFiscal')?.clearValidators();
    }

    this.form.get('matricula')?.updateValueAndValidity();
    this.form.get('idFiscal')?.updateValueAndValidity();
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

        const map = L.map('map-registro-google').setView([-34.9011, -56.1645], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: 'Map data © OpenStreetMap contributors',
        }).addTo(map);

        let marker: L.Marker | undefined;

        map.on('click', (e: any) => {
          const { lat, lng } = e.latlng;

          this.form.patchValue({ latitud: lat, longitud: lng });
          this.form.get('latitud')?.markAsTouched();
          this.form.get('longitud')?.markAsTouched();

          if (marker) {
            marker.setLatLng([lat, lng]);
          } else {
            marker = L.marker([lat, lng]).addTo(map);
          }
        });
      } catch (e) {
        console.error('Error cargando Leaflet:', e);
      }
    }
  }

  enviar() {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      console.error('Formulario inválido.');
      return;
    }

    if (!this.googleId) {
      console.error('google_id no está presente.');
      this.router.navigate(['/login']);
      return;
    }

    const payload = {
      ...this.form.getRawValue(),
      imagen: this.imagenUrl,
      google_id: this.googleId,
    };

    delete payload.contrasenia_confirmation;
    if (payload.rol !== 'rematador') delete payload.matricula;
    if (payload.rol !== 'casa_remate') delete payload.idFiscal;

    const url = payload.rol === 'casa_remate'
      ? `${environment.apiUrl}/api/register-casa-remate`
      : `${environment.apiUrl}/api/register-google-user`;

    this.http.post(url, payload).subscribe({
      next: (res: any) => {
        localStorage.setItem('token', res.access_token);
        localStorage.setItem('usuario_id', res.usuario_id);
        localStorage.setItem('rol', res.rol);

        if (res.rol === 'casa_remate') {
          alert('Registro exitoso. Tu cuenta está pendiente de aprobación por el administrador.');
          this.router.navigate(['/verificacion-pendiente']);
        } else if (res.rol === 'rematador') {
          this.router.navigate(['/dashboard-rematador']);
        } else {
          this.router.navigate(['/dashboard-cliente']);
        }
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 403 && err.error?.error?.includes('no fue aprobada')) {
          alert('Tu casa de remate aún no fue aprobada por el administrador.');
        } else {
          console.error('Error al registrar con Google:', err);
          alert('Ocurrió un error al registrar. Verificá los datos e intentá de nuevo.');
        }
      },
    });
  }
}
