import {
  Component,
  AfterViewInit,
  ElementRef,
  ViewChild,
  Output,
  EventEmitter,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

@Component({
  standalone: true,
  selector: 'app-leaflet-map',
  imports: [CommonModule],
  templateUrl: './leaflet-map.component.html',
})
export class LeafletMapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('map') mapElement!: ElementRef;
  @Output() ubicacionSeleccionada = new EventEmitter<{ lat: number; lng: number }>();

  map!: L.Map;
  marker!: L.Marker;

  ngAfterViewInit(): void {
    // Fix de íconos
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
      iconUrl: 'assets/leaflet/marker-icon.png',
      shadowUrl: 'assets/leaflet/marker-shadow.png',
    });

    setTimeout(() => this.inicializarMapa());
  }

  inicializarMapa(): void {
    this.map = L.map(this.mapElement.nativeElement).setView([-34.9, -56.2], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      if (this.marker) {
        this.marker.setLatLng([lat, lng]);
      } else {
        this.marker = L.marker([lat, lng]).addTo(this.map);
      }

      this.ubicacionSeleccionada.emit({ lat, lng });
    });
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }
}
