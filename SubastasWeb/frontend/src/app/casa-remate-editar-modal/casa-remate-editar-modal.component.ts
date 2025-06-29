import { Component, EventEmitter, Output, Input, AfterViewInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import * as L from 'leaflet';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-casa-remate-editar-modal',
  imports: [
    DialogModule,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    CommonModule
  ],
  templateUrl: './casa-remate-editar-modal.component.html',
  styleUrl: './casa-remate-editar-modal.component.scss'
})
export class CasaRemateEditarModalComponent implements AfterViewInit, OnDestroy {
  @Input() casaRemateData: any = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  visible: boolean = false;
  form: FormGroup;
  
  private map!: L.Map;
  private marker!: L.Marker;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', Validators.required],
      imagen: [''],
      latitud: [null, Validators.required],
      longitud: [null, Validators.required],
      idFiscal: [null, [Validators.required, Validators.min(1)]]
    });
  }

  private createMarkerIcon(): L.Icon {
    return L.icon({
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });
  }

  ngAfterViewInit(): void {
    // La inicialización del mapa se hará cuando se abra el modal
  }

  ngOnDestroy(): void {
    this.destroyMap();
  }

  private initMap(): void {
    // Verificar que el elemento del mapa existe
    const mapElement = document.getElementById('editMap');
    if (!mapElement) {
      console.error('Elemento del mapa no encontrado');
      return;
    }

    // Destruir el mapa anterior si existe
    this.destroyMap();

    // Esperar un poco para asegurar que el DOM esté limpio
    setTimeout(() => {
      try {
        this.map = L.map('editMap').setView([-34.9011, -56.1645], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        this.map.on('click', (e: any) => {
          const lat = e.latlng.lat;
          const lng = e.latlng.lng;

          if (this.marker) {
            this.map.removeLayer(this.marker);
          }

          // Crear marcador con icono personalizado
          this.marker = L.marker([lat, lng], {
            icon: this.createMarkerIcon()
          }).addTo(this.map);

          this.form.patchValue({
            latitud: lat,
            longitud: lng
          });
        });

        // Si hay datos existentes, mostrar el marcador
        const lat = this.form.get('latitud')?.value;
        const lng = this.form.get('longitud')?.value;
        
        if (lat && lng) {
          this.marker = L.marker([lat, lng], {
            icon: this.createMarkerIcon()
          }).addTo(this.map);
          this.map.setView([lat, lng], 15);
        }

        // Forzar redimensionamiento del mapa
        setTimeout(() => {
          if (this.map) {
            this.map.invalidateSize();
          }
        }, 100);

      } catch (error) {
        console.error('Error al inicializar el mapa:', error);
      }
    }, 50);
  }

  private destroyMap(): void {
    if (this.map) {
      try {
        // Remover todos los eventos
        this.map.off();
        // Remover todos los layers
        this.map.eachLayer((layer) => {
          this.map.removeLayer(layer);
        });
        // Remover el mapa
        this.map.remove();
        this.map = null as any;
      } catch (error) {
        console.error('Error al destruir el mapa:', error);
      }
    }
    // Limpiar el contenedor del mapa
    const mapElement = document.getElementById('editMap');
    if (mapElement) {
      mapElement.innerHTML = '';
    }
  }

  abrir() {
    this.visible = true;
    // Pre-llenar el formulario si hay datos
    if (this.casaRemateData) {
      this.form.patchValue({
        nombre: this.casaRemateData.usuario?.nombre || '',
        email: this.casaRemateData.usuario?.email || '',
        telefono: this.casaRemateData.usuario?.telefono || '',
        imagen: this.casaRemateData.usuario?.imagen || '',
        calificacion: this.casaRemateData.valoracion?.total_puntaje || 0,
        latitud: this.casaRemateData.usuario?.latitud || null,
        longitud: this.casaRemateData.usuario?.longitud || null,
        idFiscal: this.casaRemateData.idFiscal || null
      });
    }

    // Inicializar el mapa después de que el modal esté visible
    setTimeout(() => {
      this.initMap();
    }, 200);
  }

  cerrar() {
    this.visible = false;
    this.destroyMap();
    this.close.emit();
    this.form.reset();
  }

  onSubmit() {
    if (this.form.valid) {
      const formData = this.form.value;
      this.save.emit(formData);
      this.cerrar();
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });
    }
  }
}
