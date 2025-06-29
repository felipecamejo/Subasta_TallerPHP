import { Component, OnInit, AfterViewInit, Input, Output, EventEmitter, Inject, PLATFORM_ID, ViewChild, ElementRef, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { FileUploadModule } from 'primeng/fileupload';
import { ClienteService } from '../../services/cliente.service';
import { RematadorService } from '../../services/rematador.service';
import { clienteDto } from '../../models/clienteDto';
import { rematadorDto } from '../../models/rematadorDto';
import * as L from 'leaflet';

@Component({
  selector: 'app-perfil-editar-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    MessageModule,
    ProgressSpinnerModule,
    FileUploadModule
  ],
  templateUrl: './perfil-editar-modal.component.html',
  styleUrls: ['./perfil-editar-modal.component.scss']
})
export class PerfilEditarModalComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() visible: boolean = false;
  @Input() cliente?: clienteDto;
  @Input() rematador?: rematadorDto;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() perfilActualizado = new EventEmitter<void>();
  @Output() imagenActualizada = new EventEmitter<string>();
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  form!: FormGroup;
  map!: L.Map;
  marker!: L.Marker;
  cargando: boolean = false;
  error: string = '';
  mapInitialized: boolean = false;
  imagenSeleccionada: string | null = null;
  private formInitialized: boolean = false;

  constructor(
    private fb: FormBuilder,
    private clienteService: ClienteService,
    private rematadorService: RematadorService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges) {
    // Recargar datos cuando cambian los inputs
    if ((changes['cliente'] && changes['cliente'].currentValue) || 
        (changes['rematador'] && changes['rematador'].currentValue)) {
      this.loadFormData();
    }
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Esperar un poco para que el modal esté completamente renderizado
      setTimeout(() => {
        if (this.visible && !this.mapInitialized) {
          this.initMap();
        }
      }, 300);
    }
  }

  initForm() {
    // Crear formulario básico primero
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(255)]],
      cedula: ['', [Validators.required, this.cedulaValidator]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', []],
      imagen: ['', []],
      latitud: [null, []],
      longitud: [null, []],
      matricula: ['', []]
    });
    
    this.formInitialized = true;
    this.loadFormData();
  }

  /**
   * Carga los datos en el formulario cuando están disponibles
   */
  private loadFormData() {
    if (!this.formInitialized) return;
    
    const usuario = this.cliente?.usuario || this.rematador?.usuario;
    
    if (usuario) {
      console.log('Cargando datos en el formulario:', usuario);
      
      // Actualizar validaciones de matrícula según el tipo de usuario
      const matriculaControl = this.form.get('matricula');
      if (this.rematador) {
        matriculaControl?.setValidators([Validators.required]);
      } else {
        matriculaControl?.clearValidators();
      }
      matriculaControl?.updateValueAndValidity();
      
      // Establecer valores en el formulario
      this.form.patchValue({
        nombre: usuario.nombre || '',
        cedula: usuario.cedula || '',
        email: usuario.email || '',
        telefono: usuario.telefono || '',
        imagen: usuario.imagen || '',
        latitud: usuario.latitud || null,
        longitud: usuario.longitud || null,
        matricula: this.rematador?.matricula || ''
      });
      
      // Establecer imagen seleccionada inicial
      this.imagenSeleccionada = usuario.imagen || null;
    }
  }

  onVisibleChange() {
    this.visibleChange.emit(this.visible);
    
    if (this.visible) {
      // Recargar datos del formulario cuando el modal se abre
      this.loadFormData();
      
      if (isPlatformBrowser(this.platformId) && !this.mapInitialized) {
        // Esperar a que el modal esté completamente abierto
        setTimeout(() => {
          this.initMap();
        }, 300);
      }
    }
  }

  initMap() {
    if (this.mapInitialized) return;

    try {
      // Configurar iconos de Leaflet
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
        iconUrl: 'assets/leaflet/marker-icon.png',
        shadowUrl: 'assets/leaflet/marker-shadow.png',
      });

      // Obtener coordenadas iniciales
      const lat = this.form.get('latitud')?.value || -34.9011;
      const lng = this.form.get('longitud')?.value || -56.1645;

      // Crear el mapa
      this.map = L.map('map-perfil-editar').setView([lat, lng], 13);

      // Agregar tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data © OpenStreetMap contributors',
      }).addTo(this.map);

      // Agregar marcador inicial si hay coordenadas
      if (this.form.get('latitud')?.value && this.form.get('longitud')?.value) {
        this.marker = L.marker([lat, lng]).addTo(this.map);
      }

      // Manejar clics en el mapa
      this.map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        this.form.patchValue({ latitud: lat, longitud: lng });

        // Remover marcador anterior si existe
        if (this.marker) {
          this.map.removeLayer(this.marker);
        }
        
        // Agregar nuevo marcador
        this.marker = L.marker([lat, lng]).addTo(this.map);

        // Marcar campos como tocados para validación
        this.form.get('latitud')?.markAsTouched();
        this.form.get('longitud')?.markAsTouched();
      });

      this.mapInitialized = true;
      console.log('Mapa inicializado correctamente');
      
    } catch (error) {
      console.error('Error al inicializar el mapa:', error);
    }
  }

  onGuardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error = 'Por favor, complete todos los campos requeridos.';
      return;
    }

    this.cargando = true;
    this.error = '';

    const formData = this.form.value;
    const usuarioId = this.cliente?.usuario_id || this.rematador?.usuario_id;

    if (!usuarioId) {
      this.error = 'Error: No se pudo identificar el usuario.';
      this.cargando = false;
      return;
    }

    // Preparar datos para enviar
    const updateData = {
      nombre: formData.nombre,
      cedula: formData.cedula,
      email: formData.email,
      telefono: formData.telefono || null,
      imagen: formData.imagen || null,
      latitud: formData.latitud,
      longitud: formData.longitud
    };

    // Agregar matrícula si es rematador
    if (this.rematador) {
      (updateData as any).matricula = formData.matricula;
    }

    // Determinar qué servicio usar y hacer la llamada
    if (this.cliente) {
      this.clienteService.actualizarPerfil(usuarioId, updateData).subscribe({
        next: (response: any) => {
          console.log('Perfil de cliente actualizado:', response);
          this.handleUpdateSuccess(formData);
        },
        error: (error: any) => {
          this.handleUpdateError(error);
        }
      });
    } else if (this.rematador) {
      this.rematadorService.actualizarPerfil(usuarioId, updateData).subscribe({
        next: (response: any) => {
          console.log('Perfil de rematador actualizado:', response);
          this.handleUpdateSuccess(formData);
        },
        error: (error: any) => {
          this.handleUpdateError(error);
        }
      });
    }
  }

  onCancelar() {
    this.cerrarModal();
  }

  cerrarModal() {
    this.visible = false;
    this.visibleChange.emit(false);
    this.error = '';
    this.cargando = false;
    
    // Resetear el formulario a los valores originales
    this.loadFormData();
  }

  // Método para limpiar la imagen (usar la por defecto)
  limpiarImagen() {
    this.form.patchValue({ imagen: '' });
    this.imagenSeleccionada = null;
  }

  /**
   * Validador personalizado para cédula uruguaya
   */
  cedulaValidator(control: any) {
    if (!control.value) return null;
    
    const cedula = control.value.toString().replace(/[^\d]/g, ''); // Solo números
    
    // Debe tener máximo 8 dígitos
    if (cedula.length > 8) {
      return { cedulaInvalida: { message: 'La cédula debe tener máximo 8 dígitos' } };
    }
    
    // Debe tener al menos 6 dígitos
    if (cedula.length < 6) {
      return { cedulaInvalida: { message: 'La cédula debe tener al menos 6 dígitos' } };
    }
    
    return null;
  }

  /**
   * Abre el selector de archivos para seleccionar imagen
   */
  seleccionarImagen() {
    this.fileInput.nativeElement.click();
  }

  /**
   * Maneja la selección de archivo de imagen
   */
  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (!file) return;
    
    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      this.error = 'Por favor seleccione un archivo de imagen válido.';
      return;
    }
    
    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.error = 'La imagen debe ser menor a 5MB.';
      return;
    }
    
    // Convertir a base64 para previsualización
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      this.imagenSeleccionada = result;
      this.form.patchValue({ imagen: result });
      this.error = ''; // Limpiar errores
    };
    reader.readAsDataURL(file);
  }

  /**
   * Obtiene la URL de la imagen para mostrar en la previsualización
   */
  getImagenPreview(): string {
    if (this.imagenSeleccionada) {
      return this.imagenSeleccionada;
    }
    return 'assets/img/default.jpg';
  }

  // Getters para validación
  get nombreInvalido() {
    const control = this.form.get('nombre');
    return control && control.invalid && control.touched;
  }

  get cedulaInvalida() {
    const control = this.form.get('cedula');
    return control && control.invalid && control.touched;
  }

  get cedulaErrorMessage() {
    const control = this.form.get('cedula');
    if (control?.errors?.['required']) {
      return 'La cédula es requerida';
    }
    if (control?.errors?.['cedulaInvalida']) {
      return control.errors['cedulaInvalida'].message;
    }
    return '';
  }

  get emailInvalido() {
    const control = this.form.get('email');
    return control && control.invalid && control.touched;
  }

  get matriculaInvalida() {
    const control = this.form.get('matricula');
    return this.rematador && control && control.invalid && control.touched;
  }

  /**
   * Procesa el input de cédula para permitir solo números
   */
  onCedulaInput(event: Event) {
    const target = event.target as HTMLInputElement;
    let value = target.value.replace(/[^\d]/g, ''); // Solo números
    
    // Limitar a 8 dígitos
    if (value.length > 8) {
      value = value.substring(0, 8);
    }
    
    // Actualizar el valor en el formulario
    this.form.patchValue({ cedula: value });
    
    // Actualizar el valor en el input
    target.value = value;
  }

  /**
   * Maneja el éxito de la actualización del perfil
   */
  private handleUpdateSuccess(formData: any): void {
    // Emitir evento de imagen actualizada si cambió
    if (formData.imagen !== (this.cliente?.usuario?.imagen || this.rematador?.usuario?.imagen)) {
      this.imagenActualizada.emit(formData.imagen);
    }
    
    // Emitir evento de perfil actualizado
    this.perfilActualizado.emit();
    
    // Cerrar modal
    this.cerrarModal();
  }

  /**
   * Maneja los errores de la actualización del perfil
   */
  private handleUpdateError(error: any): void {
    console.error('Error al actualizar perfil:', error);
    this.error = error.error?.message || 'Error al actualizar el perfil. Intente nuevamente.';
    this.cargando = false;
  }
}
