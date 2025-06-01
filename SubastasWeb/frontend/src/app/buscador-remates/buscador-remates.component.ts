import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SubastaService } from '../../services/subasta.service';
import { subastaDto } from '../../models/subastaDto';

@Component({
  selector: 'app-buscador-remates',
  standalone: true,
  imports: [CommonModule, ButtonModule, DropdownModule, FormsModule],
  templateUrl: './buscador-remates.component.html',
  styleUrl: './buscador-remates.component.scss'
})
export class BuscadorRematesComponent {
  
  categorias = [
    { name: 'Santiago', code: 'STG' },
    { name: 'Valparaíso', code: 'VLP' },
    { name: 'Concepción', code: 'CCP' }
  ];

  filtros = [
    { name: 'Mas Reciente',},
    { name: 'Mas Antiguo', },
  ];

  Estado = [
    { name: 'Santiago', code: 'STG' },
    { name: 'Valparaíso', code: 'VLP' },
    { name: 'Concepción', code: 'CCP' }
  ];

  subastas! : subastaDto[];
  
  selectedCity: any = null;
  selectedCategory: any = null;
  selectedFiltro: any = null;
  selectedEstado: any = null;

  get subastasPorGrupo(): any[][] {
    const grupos = [];
    for (let i = 0; i < this.subastas.length; i += 3) {
      grupos.push(this.subastas.slice(i, i + 3));
    }
    return grupos;
  }

  getImagenSubasta(subasta: any): string {
    if (subasta.lotes && 
        subasta.lotes.length > 0 && 
        subasta.lotes[0].articulos && 
        subasta.lotes[0].articulos.length > 0 && 
        subasta.lotes[0].articulos[0].imagen) {
      return subasta.lotes[0].articulos[0].imagen;
    }
    return '/images/img.webp';
  }

  getNombreSubasta(subasta: any): string {
    return subasta.nombre || 'Subasta sin nombre';
  }

  irASubasta(subasta: any): void {
    if (subasta.id) {
      this.router.navigate(['/stream', subasta.id]);
    }
  }

  constructor(
    private route: ActivatedRoute,
    private subastaService: SubastaService,
    private router: Router
  ) {}

  ngOnInit() {
    this.subastaService.getSubastas().subscribe({
      next: (data) => {
        this.subastas = data;
      }
      , error: (error) => {
        console.error('Error al cargar las subastas:', error);
      }
    });
  }
}
