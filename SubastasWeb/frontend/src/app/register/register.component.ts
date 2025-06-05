import {
  Component,
  OnInit,
  AfterViewInit,
  Input,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './register.component.html',
  styleUrls: []
})
export class RegisterComponent implements OnInit, AfterViewInit {
  form!: FormGroup;
  mostrarFormularioExtra = false;

  // Se inyecta PLATFORMID para saber si estamos en navegador o SSR
  constructor(
    private fb: FormBuilder,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  @Input()
  datosGoogle: { nombre?: string; email?: string; imagen?: string } | null = null;

  // Variables para el mapa (se inicializarán solo en navegador)
  private map: any;
  private marker: any;

  ngOnInit(): void {
    // Configuro el formulario reactivo con los campos necesarios
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      cedula: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', Validators.required],
      imagen: [''],
      contrasenia: ['', [Validators.required, Validators.minLength(6)]],
      latitud: [''],
      longitud: [''],
      tipo: ['', Validators.required],
      matricula: ['']
    });

    // Si el componente recibe datos desde Google, prelleno el formulario y muestro extra
    if (this.datosGoogle) {
      this.form.patchValue({
        nombre: this.datosGoogle.nombre || '',
        email: this.datosGoogle.email || '',
        imagen: this.datosGoogle.imagen || ''
      });
      this.mostrarFormularioExtra = true;
    }
  }

  ngAfterViewInit(): void {
    // Solo si estamos en navegador, importamos y usamos Leaflet
    if (isPlatformBrowser(this.platformId)) {
      // Import dinámico de Leaflet para evitar SSR
      import('leaflet').then((L) => {
        this.initMap(L);
      }).catch(err => {
        console.error('Error cargando Leaflet:', err);
      });
    }
  }

  // Recibe la librería Leaflet como parámetro para inicializar el mapa
  private initMap(L: any): void {
    const defaultLat = -34.6037;
    const defaultLng = -58.3816;

    // Asegurarse de que exista el div#map en el template
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
      return;
    }

    // Configuro el mapa centrado en defaultLat/defaultLng
    this.map = L.map('map').setView([defaultLat, defaultLng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Agrego marcador draggable en la posición inicial
    this.marker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(this.map);
    this.marker.on('moveend', () => {
      const latlng = this.marker.getLatLng();
      this.form.patchValue({
        latitud: latlng.lat,
        longitud: latlng.lng
      });
    });

    // Seteo valores iniciales de lat y lng en el formulario
    this.form.patchValue({
      latitud: defaultLat,
      longitud: defaultLng
    });
  }

  onTipoChange(): void {
    // Si el usuario escoge “rematador”, la matrícula se vuelve requerida
    if (this.form.value.tipo === 'rematador') {
      this.form.get('matricula')?.setValidators([Validators.required]);
    } else {
      this.form.get('matricula')?.clearValidators();
    }
    this.form.get('matricula')?.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    // Aquí enviás al backend: ej. this.http.post('/api/register', this.form.value)…
    console.log('Formulario válido, datos a enviar:', this.form.value);
  }
}