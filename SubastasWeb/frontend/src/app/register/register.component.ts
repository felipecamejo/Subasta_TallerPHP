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
import { HttpClient, HttpClientModule, HttpErrorResponse } from '@angular/common/http'; // Importa HttpErrorResponse

// Validador personalizado para confirmar contraseñas
export function passwordsMatchValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const password = control.get('contrasenia');
    const confirmPassword = control.get('confirmarContrasenia');

    // Solo validamos si ambos campos existen y tienen valores, y si no coinciden
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
  // Si tienes estilos específicos para este componente, puedes descomentar y añadir:
  // styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit, AfterViewInit {

  form!: FormGroup;
  submissionError: string = '';
  // NUEVA PROPIEDAD: Para almacenar errores por campo del backend
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
      tipo: ['cliente', Validators.required], // Valor por defecto
      matricula: [''], // Inicialmente vacío
      latitud: [null, Validators.required],
      longitud: [null, Validators.required],
    }, {
      // Aplicamos el validador personalizado a nivel de FormGroup
      validator: passwordsMatchValidator()
    });

    // Lógica para validar 'matricula' condicionalmente
    this.form.get('tipo')?.valueChanges.subscribe(tipo => {
      const matriculaControl = this.form.get('matricula');
      if (tipo === 'rematador') {
        matriculaControl?.setValidators(Validators.required);
      } else {
        matriculaControl?.clearValidators();
      }
      // Forzar la revalidación del control 'matricula' y del formulario padre
      matriculaControl?.updateValueAndValidity();
      this.form.updateValueAndValidity(); // Asegurarse de que el formulario se revalide
    });
  }

  async ngAfterViewInit() {
    // Si la aplicación se está ejecutando en un navegador (no en SSR)
    if (isPlatformBrowser(this.platformId)) {
      try {
        const L = await import('leaflet'); // Importa Leaflet dinámicamente

        // FIX CRUCIAL PARA LOS ÍCONOS DE LEAFLET:
        // Elimina el método interno de Leaflet que intenta adivinar las URLs de los íconos,
        // y luego define explícitamente las URLs correctas.
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
          iconUrl: 'assets/leaflet/marker-icon.png',
          shadowUrl: 'assets/leaflet/marker-shadow.png',
        });
        // Fin del fix del marcador

        const map = L.map('map').setView([-34.9011, -56.1645], 13); // Centrado en Montevideo, Uruguay
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: 'Map data © OpenStreetMap contributors',
        }).addTo(map);

        let marker: L.Marker | undefined; // Para almacenar el marcador actual

        map.on('click', (e: any) => {
          const { lat, lng } = e.latlng;
          this.form.patchValue({
            latitud: lat,
            longitud: lng,
          });

          // Si ya existe un marcador, lo removemos antes de añadir el nuevo
          if (marker) {
            map.removeLayer(marker);
          }
          // Añadimos un nuevo marcador en la ubicación del clic
          marker = L.marker([lat, lng]).addTo(map);

          // Marcar los campos de latitud y longitud como 'touched' después de la selección
          this.form.get('latitud')?.markAsTouched();
          this.form.get('longitud')?.markAsTouched();
        });

      } catch (e) {
        console.error('Error cargando Leaflet o inicializando el mapa:', e);
      }
    }
  }

  onSubmit() {
    this.submissionError = ''; // Limpia cualquier error general anterior
    this.fieldErrors = {}; // NUEVO: Limpia los errores de campo del backend antes de un nuevo envío
    this.form.markAllAsTouched(); // Marca todos los campos como 'touched' para mostrar errores de validación del cliente

    if (this.form.valid) {
      const formData = { ...this.form.value };
      delete formData.confirmarContrasenia; // No enviar 'confirmarContrasenia' al backend

      this.http
        .post('http://localhost:8000/api/register', formData)
        .subscribe({
          next: (res) => {
            console.log('Registro exitoso:', res);
            alert('Registro exitoso. Serás redirigido al inicio de sesión.'); // Considera reemplazar esto con un modal o notificación más elegante
            this.router.navigate(['/login']); // Redirige al login
          },
          error: (err: HttpErrorResponse) => { // Importante: tipar 'err' como HttpErrorResponse
            console.error('Error al registrar:', err);

            // Manejo de errores detallado del backend (ej. Laravel 422 Unprocessable Entity)
            if (err.status === 422 && err.error && err.error.errors) {
                // Almacena los errores de validación del backend en fieldErrors
                this.fieldErrors = err.error.errors;

                // Puedes construir un mensaje general si aún quieres el alert,
                // pero la idea es que el HTML muestre los errores específicos.
                let generalMessage = 'Por favor, corrige los siguientes errores: \n';
                for (const key in this.fieldErrors) {
                    if (this.fieldErrors.hasOwnProperty(key)) {
                        // Unir todos los mensajes de error para ese campo en una línea
                        generalMessage += `- ${this.fieldErrors[key].join(', ')}\n`;
                    }
                }
                this.submissionError = generalMessage; // Puedes usar esta variable para mostrar un mensaje general en el HTML
                alert(generalMessage); // Si aún deseas el alert, que muestra los errores combinados
            } else if (err.error && err.error.message) {
                // Mensaje de error general del backend (si no es un 422 con errores de campo)
                this.submissionError = err.error.message;
                alert(`Error: ${err.error.message}`);
            } else {
                // Mensaje de error genérico para errores de red o desconocidos
                this.submissionError = 'Ocurrió un error inesperado al registrarse. Por favor, intenta de nuevo.';
                alert('Error en el registro');
            }
          },
        });
    } else {
      // Si el formulario no es válido por validaciones del lado del cliente
      this.submissionError = 'Por favor, completa todos los campos requeridos correctamente.';
      // No necesitas un alert aquí, ya que los errores se mostrarán con markAllAsTouched y las validaciones de Angular en el HTML.
    }
  }

  // Métodos getter para fácil acceso a los controles del formulario en el template
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
