import { Component, EventEmitter, Output, Input, AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import * as L from 'leaflet';
import { CalendarModule } from 'primeng/calendar';
import { CommonModule } from '@angular/common';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { RematadorService } from '../../services/rematador.service';
import { SubastaService } from '../../services/subasta.service';
import { MessageService } from 'primeng/api';
import { rematadorDto } from '../../models/rematadorDto';

// Configurar iconos por defecto de Leaflet para evitar iconos rotos
const iconDefault = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = iconDefault;

@Component({
  selector: 'crear-subasta-modal',
  templateUrl: './crear-subasta-modal.component.html',
  standalone: true,
  imports: [
    CalendarModule,
    CommonModule,
    CheckboxModule,
    DialogModule,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    DropdownModule,
    ToastModule,
  ],
  providers: [MessageService]
})
export class CrearSubastaModalComponent implements AfterViewInit, OnDestroy, OnInit {
  @Input() casaRemateId!: number;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  visible: boolean = false;
  form: FormGroup;
  rematadores: rematadorDto[] = [];

  private map!: L.Map;
  private marker!: L.Marker;

  constructor(
    private fb: FormBuilder,
    private rematadorService: RematadorService,
    private subastaService: SubastaService,
    private messageService: MessageService
  ) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      duracionMinutos: [0, [Validators.required, Validators.min(1)]],
      activa: [true],
      fecha: [null, Validators.required],
      rematador_id: [null, Validators.required],
      latitud: [null, Validators.required],
      longitud: [null, Validators.required],
      videoId: [''],
    });

    // Corregir los íconos de Leaflet
    this.fixLeafletIcons();
  }

  ngOnInit(): void {
    this.cargarRematadores();
  }

  cargarRematadores(): void {
    this.rematadorService.obtenerRematadores().subscribe({
      next: (rematadores) => {
        this.rematadores = rematadores;
        console.log('Rematadores cargados:', this.rematadores);
      },
      error: (error) => {
        console.error('Error al cargar rematadores:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los rematadores'
        });
      }
    });
  }

  private fixLeafletIcons() {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }

  ngAfterViewInit(): void {
    // Inicializar mapa solo cuando el modal esté visible
  }

  abrir() {
    this.visible = true;
    // Inicializar mapa después de que el modal se abra
    setTimeout(() => {
      this.initMap();
    }, 300);
  }

  cerrar() {
    this.visible = false;
    this.close.emit();
    this.destroyMap();
  }

  private destroyMap(): void {
    if (this.map) {
      try {
        this.map.off();
        this.map.remove();
      } catch (error) {
        console.warn('Error al destruir el mapa:', error);
      }
      this.map = null as any;
    }
    if (this.marker) {
      this.marker = null as any;
    }
    
    // Limpiar el contenedor del mapa
    const mapElement = document.getElementById('map');
    if (mapElement) {
      mapElement.innerHTML = '';
    }
  }

  private initMap(): void {
    // Verificar que el elemento del mapa existe
    const mapElement = document.getElementById('map');
    if (!mapElement) {
      console.error('Elemento del mapa no encontrado');
      return;
    }

    // Destruir el mapa anterior si existe
    this.destroyMap();

    try {
      // Configurar el mapa con z-index bajo para no interferir con el calendario
      this.map = L.map('map', {
        zoomControl: true,
        attributionControl: true
      }).setView([-34.9011, -56.1645], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.map);

      this.map.on('click', (e: any) => {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;

        if (this.marker) {
          this.map.removeLayer(this.marker);
        }

        this.marker = L.marker([lat, lng]).addTo(this.map);

        this.form.patchValue({
          latitud: lat,
          longitud: lng
        });
      });

      // Forzar redimensionamiento del mapa
      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
        }
      }, 100);

    } catch (error) {
      console.error('Error al inicializar el mapa:', error);
    }
  }

  onSubmit() {
    if (this.form.valid) {
      // Obtener casa_remate_id del localStorage
      const casaRemateId = localStorage.getItem('usuario_id');
      
      if (!casaRemateId) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se encontró el ID de la casa de remate en el localStorage'
        });
        return;
      }

      // SOLUCIÓN SIMPLE: Convertir fecha local a UTC manualmente
      const fechaLocal = this.form.value.fecha;
      const fechaUTC = new Date(fechaLocal.getTime() - (fechaLocal.getTimezoneOffset() * 60000));

      console.log('=== DEBUG SIMPLE ===');
      console.log('Fecha seleccionada (local):', fechaLocal.toString());
      console.log('Fecha a enviar (UTC):', fechaUTC.toISOString());
      console.log('Offset timezone (min):', fechaLocal.getTimezoneOffset());
      console.log('===================');

      // Preparar los datos para la API
      const subastaData = {
        nombre: this.form.value.nombre,
        duracionMinutos: this.form.value.duracionMinutos,
        activa: this.form.value.activa,
        fecha: fechaUTC, // Enviar fecha ya convertida a UTC
        casa_remate_id: parseInt(casaRemateId),
        rematador_id: this.form.value.rematador_id,
        latitud: this.form.value.latitud,
        longitud: this.form.value.longitud,
        videoId: this.form.value.videoId || ''
      };

      console.log('Datos de subasta a enviar:', subastaData);

      // Hacer la petición POST a /api/subastas
      this.subastaService.crearSubasta(subastaData).subscribe({
        next: (response) => {
          console.log('Subasta creada exitosamente:', response);
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Subasta creada correctamente'
          });
          this.save.emit(response);
          this.cerrar();
        },
        error: (error) => {
          console.error('Error al crear subasta:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Error al crear la subasta: ${error.message || 'Error desconocido'}`
          });
        }
      });
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });
    }
  }

  ngOnDestroy(): void {
    this.destroyMap();
  }
}