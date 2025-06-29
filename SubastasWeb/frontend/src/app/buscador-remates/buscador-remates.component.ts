import { Component, AfterViewInit, Inject, PLATFORM_ID, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SubastaService } from '../../services/subasta.service';
import { subastaDto } from '../../models/subastaDto';
import { categoriaDto } from '../../models/categoriaDto';
import { CategoriaService } from '../../services/categoria.service';
import { DialogModule } from 'primeng/dialog';
import { TimezoneService } from '../../services/timezone.service';
import { TimezoneSelectorComponent } from '../shared/timezone-selector/timezone-selector.component';
import { TooltipModule } from 'primeng/tooltip';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-buscador-remates',
  standalone: true,
  imports: [
    CommonModule, 
    ButtonModule, 
    SelectModule, 
    FormsModule, 
    DialogModule,
    TimezoneSelectorComponent,
    TooltipModule
  ],
  templateUrl: './buscador-remates.component.html',
  styleUrl: './buscador-remates.component.scss'
})
export class BuscadorRematesComponent implements AfterViewInit, OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  private cargandoSubastas: boolean = false;

  mostrandoMapa: boolean = false;
  showTimezoneSelector: boolean = false;
  currentTimezone: string = '';

  mostrarMapa() {
    this.mostrandoMapa = true;
  }

  filtros = [
    { name: 'Todos', value: 0 },
    { name: 'Mas Reciente', value: 1 },
    { name: 'Mas Antiguo', value: 2 },
  ];

  Estado = [
    { name: 'Todos', value: -1},
    { name: 'Excelente', value: 0},
    { name: 'Usado', value: 1},
  ];

  constructor(
    private route: ActivatedRoute,
    private subastaService: SubastaService,
    private categoriaService: CategoriaService,
    private router: Router,
    private timezoneService: TimezoneService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Obtener la zona horaria actual
    this.currentTimezone = this.timezoneService.getUserTimezone();
  }

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
  mapaLoading: boolean = true;
  
  selectedCategory: number = 0;
  selectedFiltro: number = 0;
  selectedEstado: number = -1;

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

  subastasPorEstado(subastas: subastaDto[]): subastaDto[] {
    if (!subastas || subastas.length === 0) {
      return subastas;
    }

    if (this.selectedEstado === -1) {
      // Mostrar todas las subastas (opción "Todos")
      return subastas;
    } else if (this.selectedEstado === 0) {
      // Filtrar por EXCELENTE - solo mostrar subastas que tengan al menos un artículo con estado EXCELENTE
      return subastas.filter(subasta =>
        subasta.lotes?.some(lote =>
          lote.articulos?.some(articulo =>
            articulo.estado === 'EXCELENTE'
          )
        )
      );
    } else if (this.selectedEstado === 1) {
      // Filtrar por USADO - solo mostrar subastas que tengan al menos un artículo con estado USADO
      return subastas.filter(subasta =>
        subasta.lotes?.some(lote =>
          lote.articulos?.some(articulo =>
            articulo.estado === 'USADO'
          )
        )
      );
    }

    // Fallback: devolver todas las subastas si el valor no es reconocido
    return subastas;
  }

  get subastasPorGrupo(): any[][] {
    let subastasFiltradas = this.getSubastasPorCategoria();
    subastasFiltradas = this.subastasPorFiltro(subastasFiltradas);
    subastasFiltradas = this.subastasPorEstado(subastasFiltradas);

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
          articulo.categoria && 
          articulo.categoria.id && 
          categoriasValidas.includes(articulo.categoria.id)
        )
      )
    );

    return subastasFiltradas;
  }

  ngOnInit() {
    // Suscribirse a los cambios de zona horaria
    const timezoneSub = this.timezoneService.userTimezone$.subscribe(timezone => {
      this.currentTimezone = timezone;
      // Solo actualizamos la UI, no recargamos datos
    });
    this.subscriptions.push(timezoneSub);

    // Cargar datos solo una vez al inicializar
    this.cargarSubastas();
  }
  
  cargarSubastas() {
    // Evitar múltiples cargas simultáneas
    if (this.cargandoSubastas) return;
    this.cargandoSubastas = true;
    
    const subastasSub = this.subastaService.getSubastas().subscribe({
      next: (data) => {
        this.subastas = data;
        
        // Convertir fechas a la zona horaria del usuario
        this.convertirFechasSubastas();
        
        // Actualizar marcadores del mapa si ya está inicializado
        if (this.map) {
          this.addSubastaMarkers();
        }
        
        this.mapaLoading = false;
        this.cargandoSubastas = false;
        console.log('Carga de subastas completada');
      }
      , error: (error) => {
        console.error('Error al cargar las subastas:', error);
        this.mapaLoading = false;
        this.cargandoSubastas = false;
      }
    });
    this.subscriptions.push(subastasSub);
    
    const categoriasSub = this.categoriaService.getCategorias().subscribe({
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
    this.subscriptions.push(categoriasSub);
  }

  /**
   * Establece la zona horaria basada en la primera subasta disponible
   */
  convertirFechasSubastas() {
    if (!this.subastas || this.subastas.length === 0) return;
    
    // Solo establecer la zona horaria una vez durante la carga inicial
    if (!this.zonaHorariaEstablecida) {
      const primeraSubasta = this.subastas[0];
      if (primeraSubasta.latitud && primeraSubasta.longitud && !this.hasManuallySetTimezone) {
        this.timezoneService.setTimezoneFromLocation(primeraSubasta.latitud, primeraSubasta.longitud);
        this.zonaHorariaEstablecida = true;
      }
    }
    
    // No necesitamos modificar las subastas, solo actualizar la zona horaria
  }
  
  // Variables para control de zona horaria
  private hasManuallySetTimezone: boolean = false;
  private zonaHorariaEstablecida: boolean = false;
  
  /**
   * Abre el selector de zona horaria
   */
  abrirSelectorZonaHoraria() {
    this.showTimezoneSelector = true;
    // Indicar que el usuario ha establecido manualmente la zona horaria
    this.hasManuallySetTimezone = true;
  }
  
  /**
   * Formatea una fecha para mostrarla al usuario
   */
  formatearFecha(fecha: Date | string, formato: string = 'datetime'): string {
    return this.timezoneService.formatDate(fecha, formato);
  }
  
  /**
   * Obtiene el estado de una subasta (pendiente, activa, finalizada)
   */
  obtenerEstadoSubasta(subasta: subastaDto): 'pendiente' | 'activa' | 'finalizada' {
    const ahora = new Date();
    const fechaInicio = new Date(subasta.fecha);
    
    // Calcular fecha fin basada en duración
    const fechaFin = new Date(subasta.fecha);
    fechaFin.setMinutes(fechaFin.getMinutes() + subasta.duracionMinutos);
    
    // Opción 1: Convertir fechas de subasta a zona horaria del usuario
    const inicio = this.timezoneService.convertFromBaseToUserTimezone(fechaInicio);
    const fin = this.timezoneService.convertFromBaseToUserTimezone(fechaFin);
    
    // También convertir "ahora" a la zona horaria del usuario para comparar correctamente
    const ahoraEnZonaUsuario = this.timezoneService.getCurrentUserTime();
    
    if (ahoraEnZonaUsuario < inicio) {
      return 'pendiente';
    } else if (ahoraEnZonaUsuario > fin) {
      return 'finalizada';
    } else {
      return 'activa';
    }
  }
  
  /**
   * Obtiene un mensaje sobre el tiempo restante
   */
  obtenerTiempoRestante(subasta: subastaDto): string {
    const ahora = new Date();
    const fechaInicio = new Date(subasta.fecha);
    
    // Calcular fecha fin basada en duración
    const fechaFin = new Date(subasta.fecha);
    fechaFin.setMinutes(fechaFin.getMinutes() + subasta.duracionMinutos);
    
    // Convertir fechas a zona horaria del usuario
    const inicio = this.timezoneService.convertFromBaseToUserTimezone(fechaInicio);
    const fin = this.timezoneService.convertFromBaseToUserTimezone(fechaFin);
    
    // También convertir "ahora" a la zona horaria del usuario para comparar correctamente
    const ahoraEnZonaUsuario = this.timezoneService.getCurrentUserTime();
    
    if (ahoraEnZonaUsuario < inicio) {
      // Calcular tiempo hasta el inicio
      const diffMs = inicio.getTime() - ahoraEnZonaUsuario.getTime();
      return this.formatearTiempoRestante(diffMs, 'Comienza en');
    } else if (ahoraEnZonaUsuario < fin) {
      // Calcular tiempo hasta el fin
      const diffMs = fin.getTime() - ahoraEnZonaUsuario.getTime();
      return this.formatearTiempoRestante(diffMs, 'Finaliza en');
    } else {
      // Ya finalizó
      return 'Finalizada';
    }
  }
  
  /**
   * Formatea el tiempo restante en un formato legible
   */
  private formatearTiempoRestante(diffMs: number, prefijo: string): string {
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHrs = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffDays > 0) {
      return `${prefijo} ${diffDays}d ${diffHrs}h`;
    } else if (diffHrs > 0) {
      return `${prefijo} ${diffHrs}h ${diffMins}m`;
    } else {
      return `${prefijo} ${diffMins}m`;
    }
  }
  //-------------------------mapa-----------------------

  clientelatLng = { lat: -33.4489, lng: -70.6693 }; 

  map: any;
  clienteMarker: any;
  subastaMarkers: any[] = [];
  L: any;

  clienteIcon: any;
  subastaIcon: any;

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        if (this.mostrandoMapa && !this.map) {
          this.loadLeafletAndInitialize();
        }
      }, 100);
    }
  }

  async loadLeafletAndInitialize(): Promise<void> {
    if (!this.L) {
      this.L = await import('leaflet');
      
      this.clienteIcon = this.L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
      });

      this.subastaIcon = this.L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
      });
    }
    
    this.initializeMap();
  }

  initializeMap(): void {
    if (!this.L || !isPlatformBrowser(this.platformId)) return;

    if (this.map) {
      this.map.remove();
    }

    this.map = this.L.map('mapaContainer').setView([this.clientelatLng.lat, this.clientelatLng.lng], 13);

    this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.clienteMarker = this.L.marker([this.clientelatLng.lat, this.clientelatLng.lng], { icon: this.clienteIcon })
      .addTo(this.map)
      .bindPopup('Tu ubicación')
      .openPopup();

    this.addSubastaMarkers();
  }

  addSubastaMarkers(): void {
    if (!this.map) return;

    this.subastaMarkers.forEach(marker => {
      this.map!.removeLayer(marker);
    });
    this.subastaMarkers = [];

    this.subastas.forEach(subasta => {
      if (subasta.latitud && subasta.longitud) {
        const marker = this.L.marker([subasta.latitud, subasta.longitud], { icon: this.subastaIcon })
          .addTo(this.map!)
          .bindTooltip(this.getNombreSubasta(subasta), { 
            permanent: false, 
            direction: 'top',
            offset: [0, -30]
          })
          .on('click', () => {
            this.irStreamSubasta(subasta);
          });
        
        this.subastaMarkers.push(marker);
      }
    });
  }

  irStreamSubasta(subasta: subastaDto): void {
    this.router.navigate(['/stream', subasta.id]);
  }

  onMapDialogShow(): void {
    setTimeout(() => {
      if (this.mostrandoMapa) {
        this.loadLeafletAndInitialize();
      }
    }, 200);
  }

  onMapDialogHide(): void {
    this.mostrandoMapa = false;
    if (this.map) {
      this.map.remove();
      this.map = undefined;
    }
  }

  /**
   * Formatea la fecha de una subasta para mostrarla en la tarjeta
   * @param fecha Fecha de la subasta
   * @returns Fecha formateada
   */
  formatearFechaSubasta(fecha: Date | string): string {
    if (!fecha) return 'Fecha no disponible';
    
    // La fecha viene del backend (UTC-3), usar el método formatDate que ya hace la conversión
    return this.timezoneService.formatDate(fecha, 'datetime');
  }
  
  /**
   * Obtiene el estado CSS de una subasta para aplicar estilos
   * @param subasta La subasta a evaluar
   * @returns Clase CSS correspondiente al estado
   */
  getEstadoSubasta(subasta: subastaDto): string {
    const estado = this.obtenerEstadoSubasta(subasta);
    return estado;
  }
  
  /**
   * Obtiene el ícono correspondiente al estado de la subasta
   * @param subasta La subasta a evaluar
   * @returns Clase del ícono de PrimeNG
   */
  getIconoEstado(subasta: subastaDto): string {
    const estado = this.obtenerEstadoSubasta(subasta);
    
    switch (estado) {
      case 'pendiente':
        return 'pi-clock';
      case 'activa':
        return 'pi-play';
      case 'finalizada':
        return 'pi-check';
      default:
        return 'pi-info-circle';
    }
  }
  
  /**
   * Obtiene un mensaje descriptivo del tiempo restante
   * @param subasta La subasta a evaluar
   * @returns Mensaje de tiempo restante
   */
  getTiempoRestanteSubasta(subasta: subastaDto): string {
    const tiempo = this.obtenerTiempoRestante(subasta);
    return tiempo;
  }
  
  ngOnDestroy() {
    // Cancelar todas las suscripciones para evitar fugas de memoria
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}