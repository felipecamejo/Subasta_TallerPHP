import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SubastaService } from '../../services/subasta.service';
import { subastaDto } from '../../models/subastaDto';
import { categoriaDto } from '../../models/categoriaDto';
import { CategoriaService } from '../../services/categoria.service';

@Component({
  selector: 'app-buscador-remates',
  standalone: true,
  imports: [CommonModule, ButtonModule, SelectModule, FormsModule],
  templateUrl: './buscador-remates.component.html',
  styleUrl: './buscador-remates.component.scss'
})
export class BuscadorRematesComponent {

  filtros = [
    { name: 'Mas Reciente',},
    { name: 'Mas Antiguo', },
  ];

  Estado = [
    { name: 'Santiago'},
    { name: 'Valparaíso'},
    { name: 'Concepción'},
  ];

  categoriaDefault: categoriaDto = {
    id: 0,
    nombre: 'Todas las categorías',
    articulos: { id: 0, nombre: 'Todos los artículos' },
    categoria_hija: [],    
    categoria_padre: null
  }

  subastas: subastaDto[] = [];
  categorias: categoriaDto[] = [];
  categoriasLoading: boolean = true;
  
  selectedCategory: any = 0;
  selectedFiltro: any = null;
  selectedEstado: any = null;

  get subastasPorGrupo(): any[][] {
    if (!this.subastas || this.subastas.length === 0) {
      return [];
    }
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
    private categoriaService: CategoriaService,
    private router: Router
  ) {}

  ngOnInit() {
    this.subastaService.getSubastas().subscribe({
      next: (data) => {
        this.subastas = data;
        console.log('Subastas cargadas:', this.subastas);
      }
      , error: (error) => {
        console.error('Error al cargar las subastas:', error);
      }
    });
    
    this.categoriaService.getCategorias().subscribe({
      next: (data) => {
        console.log('Datos crudos del backend:', data);
        
        this.categorias = data.map(categoria => ({
          ...categoria,
          id: categoria.id,
          nombre: categoria.nombre
        }));

        this.categoriaDefault.categoria_hija = this.categorias.map(categoria => ({
          id: categoria.id,
          nombre: categoria.nombre,
          categoria_padre: { id: 0, nombre: 'Todas las categorías', categoria_padre: null }
        }));

        this.categorias.unshift(this.categoriaDefault);
        
        this.categoriasLoading = false;
        console.log('Categorias cargadas y transformadas:', this.categorias);
        console.log('Categoria default con hijas:', this.categoriaDefault);
      }
      , error: (error) => {
        console.error('Error al cargar las categorías:', error);
        this.categoriasLoading = false;
      }
    });
  }
}
