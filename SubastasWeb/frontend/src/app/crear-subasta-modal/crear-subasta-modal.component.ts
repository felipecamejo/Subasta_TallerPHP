import { Component, EventEmitter, Output, Input, AfterViewInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import * as L from 'leaflet';
import { CalendarModule } from 'primeng/calendar';
import { CommonModule } from '@angular/common';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';

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
  ],
})
export class CrearSubastaModalComponent implements AfterViewInit, OnDestroy {
  @Input() casaRemateId!: number;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  visible: boolean = false;
  form: FormGroup;

  private map!: L.Map;
  private marker!: L.Marker;

  constructor(private fb: FormBuilder) {
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
      this.map.off();
      this.map.remove();
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
      this.map = L.map('map').setView([-34.9011, -56.1645], 13);

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
      const formData = {
        ...this.form.value,
        casa_remate_id: this.casaRemateId
      };
      this.save.emit(formData);
      this.cerrar();
    } else {
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });
    }
  }

  ngOnDestroy(): void {
    this.destroyMap();
  }
}