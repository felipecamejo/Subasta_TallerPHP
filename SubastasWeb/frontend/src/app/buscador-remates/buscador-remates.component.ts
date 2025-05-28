import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-buscador-remates',
  standalone: true,
  imports: [CommonModule, ButtonModule, DropdownModule, FormsModule],
  templateUrl: './buscador-remates.component.html',
  styleUrl: './buscador-remates.component.scss'
})
export class BuscadorRematesComponent {
  
  cities = [
    { name: 'Santiago', code: 'STG' },
    { name: 'Valparaíso', code: 'VLP' },
    { name: 'Concepción', code: 'CCP' }
  ];

  subastas = [
    { name: 'Subasta 1', informacions: 'S1', imagen: 'images/img.webp' },
    { name: 'Subasta 2', informacion: 'S2', imagen: '' },
    { name: 'Subasta 3', informacion: 'S3', imagen: '' },
    { name: 'Subasta 4', informacion: 'S4', imagen: '' },
    { name: 'Subasta 5', informacion: 'S5', imagen: '' },
    { name: 'Subasta 6', informacion: 'S6', imagen: '' },
  ]
  
  selectedCity: any = null;

  get subastasPorGrupo(): any[][] {
    const grupos = [];
    for (let i = 0; i < this.subastas.length; i += 3) {
      grupos.push(this.subastas.slice(i, i + 3));
    }
    return grupos;
  }
}
