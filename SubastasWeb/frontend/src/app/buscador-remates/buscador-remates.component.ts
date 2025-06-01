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
    { name: 'Todos', value: 0 },
    { name: 'Mas Reciente', value: 1 },
    { name: 'Mas Antiguo', value: 2 },
  ];

  Estado = [
    { name: 'Santiago'},
    { name: 'Valparaíso'},
    { name: 'Concepción'},
  ];

  constructor(
    private route: ActivatedRoute,
    private subastaService: SubastaService,
    private categoriaService: CategoriaService,
    private router: Router
  ) {}

  categoriaDefault: categoriaDto = {
    id: 0,
    nombre: 'Todas las categorías',
    articulos: { id: 0, nombre: 'Todos los artículos' },
    categoria_hijas: [],    
    categoria_padre: null
  }

  subastas: subastaDto[] = [];
  categorias: categoriaDto[] = [];
  categoriasLoading: boolean = true;
  
  selectedCategory: number = 0;
  selectedFiltro: number = 0;
  selectedEstado: number = 0;

  subastasPorFiltro(subastas: subastaDto[]): subastaDto[] {
    
    if (!subastas || subastas.length === 0) {
      return subastas;
    }

    if (this.selectedFiltro === 0) {
      return subastas; 
    } else if (this.selectedFiltro === 1) {
      return [...subastas].sort((a, b) => {
        const fechaA = new Date(a.fecha).getTime();
        const fechaB = new Date(b.fecha).getTime();
        return fechaB - fechaA;
      }); 
    } else if (this.selectedFiltro === 2) {

      return [...subastas].sort((a, b) => {
        const fechaA = new Date(a.fecha).getTime();
        const fechaB = new Date(b.fecha).getTime();
        return fechaA - fechaB;
      }); 
    }
    return subastas;
  }

  get subastasPorGrupo(): any[][] {
    let subastasFiltradas = this.getSubastasPorCategoria();
    subastasFiltradas = this.subastasPorFiltro(subastasFiltradas);

    if (!subastasFiltradas || subastasFiltradas.length === 0) {
      return [];
    }
    
    const grupos = [];
    for (let i = 0; i < subastasFiltradas.length; i += 3) {
      grupos.push(subastasFiltradas.slice(i, i + 3));
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

  getCategoriasRelacionadas(categoriaSeleccionada: number): number[] {
    if (categoriaSeleccionada === 0) return [0];
    
    const categoriasRelacionadas = new Set<number>();
    categoriasRelacionadas.add(categoriaSeleccionada);

    const categoriaActual = this.categorias.find(cat => cat.id === categoriaSeleccionada);
    
    if (categoriaActual) {
      if (categoriaActual.categoria_hijas && categoriaActual.categoria_hijas.length > 0) {
        categoriaActual.categoria_hijas.forEach(hija => {
          if (hija.id) categoriasRelacionadas.add(hija.id);
        });
      }
      
      if (categoriaActual.categoria_padre && categoriaActual.categoria_padre.id && categoriaActual.categoria_padre.id !== 0) {
        this.categorias.forEach(cat => {
          if (cat.categoria_padre && 
              cat.categoria_padre.id === categoriaActual.categoria_padre!.id && 
              cat.id && cat.id !== 0) {
            categoriasRelacionadas.add(cat.id);
          }
        });
      }
    }
    
    return Array.from(categoriasRelacionadas);
  }

  getSubastasPorCategoria(): subastaDto[] {
    if (this.selectedCategory === 0) {
      return this.subastas;
    }
    
    const categoriasValidas = this.getCategoriasRelacionadas(this.selectedCategory);

    const subastasFiltradas = this.subastas.filter(subasta =>
      subasta.lotes?.some(lote =>
        lote.articulos?.some(articulo =>
          articulo.categorias?.some(categoria => 
            categoria.id && categoriasValidas.includes(categoria.id)
          )
        )
      )
    );

    return subastasFiltradas;
  }

  ngOnInit() {
    this.subastaService.getSubastas().subscribe({
      next: (data) => {
        this.subastas = data;
      }
      , error: (error) => {
        console.error('Error al cargar las subastas:', error);
      }
    });
    
    this.categoriaService.getCategorias().subscribe({
      next: (data) => {
        
        this.categorias = data.map(categoria => ({
          ...categoria,
          id: categoria.id,
          nombre: categoria.nombre,
          categoria_padre: categoria.categoria_padre,
          categoria_hijas: (categoria as any).categoriasHijas || []
        }));

        // Configurar la categoría por defecto
        this.categoriaDefault.categoria_hijas = this.categorias.map(categoria => ({
          id: categoria.id,
          nombre: categoria.nombre,
          categoria_padre: { id: 0, nombre: 'Todas las categorías', categoria_padre: null }
        }));

        this.categorias.unshift(this.categoriaDefault);
        
        this.categoriasLoading = false;
      }
      , error: (error) => {
        console.error('Error al cargar las categorías:', error);
        this.categoriasLoading = false;
      }
    });
  }
}
