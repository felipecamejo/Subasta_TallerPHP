import { Component, AfterViewInit, Inject, PLATFORM_ID, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
import { UserTimezonePipe } from '../shared/pipes/user-timezone.pipe';
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
    UserTimezonePipe,
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
    private cdr: ChangeDetectorRef,
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
      
      // IMPORTANTE: Forzar actualización de la vista cuando cambie la zona horaria
      // Esto hace que Angular vuelva a ejecutar los métodos de formateo
      this.forceViewUpdate();
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
    const timezone = this.timezoneService.getUserTimezone();
    
    try {
      let fechaInicioEnZonaUsuario: Date;
      
      if (timezone === 'America/Montevideo') {
        // Si estamos en Montevideo (zona original), usar la fecha tal como está
        fechaInicioEnZonaUsuario = new Date(subasta.fecha);
      } else {
        // Si cambiamos de zona, convertir desde UTC-3 a la nueva zona
        const fechaLocal = new Date(subasta.fecha);
        const fechaUTC = new Date(fechaLocal.getTime() + (3 * 60 * 60 * 1000)); // UTC-3 a UTC
        const offsetMinutos = this.getTimezoneOffset(timezone);
        fechaInicioEnZonaUsuario = new Date(fechaUTC.getTime() + (offsetMinutos * 60 * 1000));
      }
      
      const fechaFinEnZonaUsuario = new Date(fechaInicioEnZonaUsuario.getTime() + (subasta.duracionMinutos * 60000));
      
      if (ahora < fechaInicioEnZonaUsuario) {
        return 'pendiente';
      } else if (ahora > fechaFinEnZonaUsuario) {
        return 'finalizada';
      } else {
        return 'activa';
      }
    } catch (error) {
      console.error('Error al obtener estado de subasta:', error);
      return 'pendiente'; // Valor por defecto
    }
  }
  
  /**
   * Obtiene un mensaje sobre el tiempo restante - VERSIÓN SIMPLIFICADA
   */
  obtenerTiempoRestante(subasta: subastaDto): string {
    const ahora = new Date();
    const timezone = this.timezoneService.getUserTimezone();
    
    try {
      // NUEVA LÓGICA: La fecha de la BD ya está en la zona horaria correcta (UTC-3)
      // Solo necesitamos convertir si cambiamos de zona horaria
      
      let fechaInicioEnZonaUsuario: Date;
      
      if (timezone === 'America/Montevideo') {
        // Si estamos en Montevideo (zona original), usar la fecha tal como está
        fechaInicioEnZonaUsuario = new Date(subasta.fecha);
      } else {
        // Si cambiamos de zona, convertir desde UTC-3 a la nueva zona
        const fechaLocal = new Date(subasta.fecha);
        const fechaUTC = new Date(fechaLocal.getTime() + (3 * 60 * 60 * 1000)); // UTC-3 a UTC
        const offsetMinutos = this.getTimezoneOffset(timezone);
        // El offset está en minutos negativos, así que lo aplicamos directamente
        fechaInicioEnZonaUsuario = new Date(fechaUTC.getTime() + (offsetMinutos * 60 * 1000));
        
        console.log('=== DEBUG CONVERSIÓN ZONA HORARIA ===');
        console.log('Timezone destino:', timezone);
        console.log('Fecha original (UTC-3):', subasta.fecha);
        console.log('Fecha convertida a UTC:', fechaUTC.toISOString());
        console.log('Offset en minutos:', offsetMinutos);
        console.log('Offset en horas:', offsetMinutos / 60);
        console.log('Fecha final en zona destino:', fechaInicioEnZonaUsuario.toString());
        console.log('Hora final que debería mostrar:', fechaInicioEnZonaUsuario.getHours() + ':' + fechaInicioEnZonaUsuario.getMinutes().toString().padStart(2, '0'));
        console.log('===================================');
      }
      
      const fechaFinEnZonaUsuario = new Date(fechaInicioEnZonaUsuario.getTime() + (subasta.duracionMinutos * 60000));
      
      console.log('=== DEBUG TIEMPO RESTANTE SIMPLIFICADO ===');
      console.log('Zona horaria actual:', timezone);
      console.log('Fecha BD original:', subasta.fecha);
      console.log('Fecha inicio calculada:', fechaInicioEnZonaUsuario.toString());
      console.log('Hora que muestra:', fechaInicioEnZonaUsuario.getHours() + ':' + fechaInicioEnZonaUsuario.getMinutes().toString().padStart(2, '0'));
      console.log('Ahora:', ahora.toString());
      console.log('Diferencia (min):', (fechaInicioEnZonaUsuario.getTime() - ahora.getTime()) / 60000);
      console.log('========================================');
      
      if (ahora < fechaInicioEnZonaUsuario) {
        // Calcular tiempo hasta el inicio
        const diffMs = fechaInicioEnZonaUsuario.getTime() - ahora.getTime();
        return this.formatearTiempoRestante(diffMs, 'Comienza en');
      } else if (ahora < fechaFinEnZonaUsuario) {
        // Calcular tiempo hasta el fin
        const diffMs = fechaFinEnZonaUsuario.getTime() - ahora.getTime();
        return this.formatearTiempoRestante(diffMs, 'Finaliza en');
      } else {
        // Ya finalizó
        return 'Finalizada';
      }
    } catch (error) {
      console.error('Error al calcular tiempo restante:', error);
      return 'Error de cálculo';
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
   * Formatea la fecha de una subasta para mostrarla en la tarjeta - VERSIÓN DINÁMICA
   * @param fecha Fecha de la subasta
   * @returns Fecha formateada según la zona horaria actual
   */
  formatearFechaSubasta(fecha: Date | string): string {
    if (!fecha) return 'Fecha no disponible';
    
    try {
      const timezone = this.timezoneService.getUserTimezone();
      let fechaEnZonaUsuario: Date;
      
      if (timezone === 'America/Montevideo') {
        // Si estamos en Montevideo (zona original), usar la fecha tal como está
        fechaEnZonaUsuario = new Date(fecha);
      } else {
        // Si cambiamos de zona, convertir desde UTC-3 a la nueva zona
        const fechaLocal = new Date(fecha);
        const fechaUTC = new Date(fechaLocal.getTime() + (3 * 60 * 60 * 1000)); // UTC-3 a UTC
        const offsetMinutos = this.getTimezoneOffset(timezone);
        fechaEnZonaUsuario = new Date(fechaUTC.getTime() + (offsetMinutos * 60 * 1000));
      }
      
      // Formatear la fecha
      return fechaEnZonaUsuario.toLocaleString('es-UY', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return 'Error de formato';
    }
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

  /**
   * Fuerza la actualización de la vista cuando cambia la zona horaria
   */
  private forceViewUpdate(): void {
    // Forzar detección de cambios para actualizar las fechas mostradas
    this.cdr.detectChanges();
  }

  /**
   * Obtiene el offset en minutos para una zona horaria específica
   */
  private getTimezoneOffset(timezone: string): number {
    // Mapa de offsets en minutos desde UTC (negativos = atrás de UTC)
    // Referencia: Montevideo es UTC-3, por lo que Lima (UTC-5) está 2 horas atrás
    const offsets: { [key: string]: number } = {
      // América del Sur
      'America/Montevideo': -180,        // UTC-3 (Uruguay) - BASE
      'America/Santiago': -240,          // UTC-4 (Chile) - 1 hora atrás de Montevideo  
      'America/Lima': -300,              // UTC-5 (Perú) - 2 horas atrás de Montevideo
      'America/Bogota': -300,            // UTC-5 (Colombia) - 2 horas atrás de Montevideo
      'America/Caracas': -240,           // UTC-4 (Venezuela) - 1 hora atrás de Montevideo
      'America/La_Paz': -240,            // UTC-4 (Bolivia) - 1 hora atrás de Montevideo
      'America/Asuncion': -180,          // UTC-3 (Paraguay) - igual que Montevideo
      'America/Sao_Paulo': -180,         // UTC-3 (Brasil) - igual que Montevideo
      'America/Argentina/Buenos_Aires': -180, // UTC-3 (Argentina) - igual que Montevideo
      'America/Guayaquil': -300,         // UTC-5 (Ecuador) - 2 horas atrás de Montevideo
      
      // América Central y del Norte
      'America/Panama': -300,            // UTC-5 (Panamá) - 2 horas atrás de Montevideo
      'America/Costa_Rica': -360,        // UTC-6 (Costa Rica) - 3 horas atrás de Montevideo
      'America/Guatemala': -360,         // UTC-6 (Guatemala) - 3 horas atrás de Montevideo
      'America/Mexico_City': -360,       // UTC-6 (México) - 3 horas atrás de Montevideo
      'America/New_York': -300,          // UTC-5 (EST) - 2 horas atrás de Montevideo
      'America/Chicago': -360,           // UTC-6 (CST) - 3 horas atrás de Montevideo
      'America/Denver': -420,            // UTC-7 (MST) - 4 horas atrás de Montevideo
      'America/Los_Angeles': -480,       // UTC-8 (PST) - 5 horas atrás de Montevideo
      'America/Havana': -300,            // UTC-5 (Cuba) - 2 horas atrás de Montevideo
      
      // Europa
      'Europe/London': 0,                // UTC+0 (Reino Unido) - 3 horas adelante de Montevideo
      'Europe/Madrid': 60,               // UTC+1 (España) - 4 horas adelante de Montevideo
      'Europe/Paris': 60,                // UTC+1 (Francia) - 4 horas adelante de Montevideo
      'Europe/Berlin': 60,               // UTC+1 (Alemania) - 4 horas adelante de Montevideo
      'Europe/Rome': 60,                 // UTC+1 (Italia) - 4 horas adelante de Montevideo
      'Europe/Lisbon': 0,                // UTC+0 (Portugal) - 3 horas adelante de Montevideo
      
      // Otras zonas comunes
      'UTC': 0,                          // UTC+0 - 3 horas adelante de Montevideo
      'GMT': 0                           // GMT - 3 horas adelante de Montevideo
    };
    
    const offset = offsets[timezone];
    if (offset !== undefined) {
      console.log(`Offset para ${timezone}: ${offset} minutos (${offset/60} horas desde UTC)`);
      return offset;
    }
    
    console.warn(`Timezone ${timezone} no encontrado en el mapa, usando UTC-3 por defecto`);
    return -180; // Default a UTC-3 si no se encuentra
  }
}