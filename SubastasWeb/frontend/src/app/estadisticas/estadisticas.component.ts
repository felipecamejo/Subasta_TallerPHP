import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms'; 
import { CalendarModule } from 'primeng/calendar';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { CasaRematesService } from '../../services/casa-remates.service';
import { SubastaService } from '../../services/subasta.service';
import { LoteService } from '../../services/lote.service';
import { CategoriaService } from '../../services/categoria.service';
import { casaRemateDto } from '../../models/casaRemateDto';
import { subastaDto } from '../../models/subastaDto';
import { loteDto } from '../../models/loteDto';
import { categoriaDto } from '../../models/categoriaDto';

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [
    CommonModule, 
    DropdownModule, 
    TableModule, 
    CheckboxModule, 
    FormsModule, 
    CalendarModule,
    ButtonModule,
    CardModule,
    ChartModule,
    ToastModule
  ],
  templateUrl: './estadisticas.component.html',
  styleUrls: ['./estadisticas.component.scss'],
  providers: [MessageService]
})
export class EstadisticasComponent implements OnInit {
  // Datos de la casa de remate
  casaRemate: casaRemateDto | null = null;
  
  // Datos para estadísticas
  subastas: subastaDto[] = [];
  lotes: loteDto[] = [];
  categorias: categoriaDto[] = [];
  
  // Filtros
  selectedCategoria: categoriaDto | null = null;
  selectedEstado: string | null = null;
  rangoFechas: Date[] = [];
  
  // Opciones para dropdowns
  estadosOptions = [
    { label: 'Todas', value: null },
    { label: 'Activas', value: 'activa' },
    { label: 'Finalizadas', value: 'inactiva' }
  ];
  
  // Datos estadísticos calculados
  estadisticas = {
    totalSubastas: 0,
    subastasMes: 0,
    totalVentas: 0,
    ventasMes: 0,
    totalLotes: 0,
    lotesPagados: 0,
    participacionTotal: 0
  };
  
  // Datos para gráficos
  chartVentasPorCategoria: any = {
    labels: [],
    datasets: [{
      label: 'Ventas por Categoría ($)',
      data: [],
      backgroundColor: []
    }]
  };
  chartSubastasPorMes: any = {
    labels: [],
    datasets: [{
      label: 'Subastas por Mes',
      data: [],
      backgroundColor: '#36A2EB',
      borderColor: '#36A2EB',
      tension: 0.4
    }]
  };
  chartLotesPorEstado: any = {
    labels: ['Pagados', 'Pendientes'],
    datasets: [{
      data: [0, 0],
      backgroundColor: ['#4CAF50', '#FF5722']
    }]
  };
  chartOptions = {
    plugins: {
      legend: {
        position: 'top'
      }
    }
  };
  
  // Loading states
  cargandoDatos = false;

  constructor(
    private casaRematesService: CasaRematesService,
    private subastaService: SubastaService,
    private loteService: LoteService,
    private categoriaService: CategoriaService,
    private messageService: MessageService
  ) { }

  ngOnInit() {
    this.cargarDatos();
    this.cargarCategorias();
  }
  
  cargarDatos() {
    this.cargandoDatos = true;
    // Obtener la casa de remate actual (usar ID fijo o del localStorage)
    const casaRemateId = 2; // O localStorage.getItem('usuario_id')
    
    this.casaRematesService.getCasaRematesPorId(casaRemateId).subscribe({
      next: (casa: any) => {
        this.casaRemate = casa;
        this.cargarSubastas();
      },
      error: (error) => {
        console.error('Error al cargar casa de remate:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar la información de la casa de remate'
        });
        this.cargandoDatos = false;
      }
    });
  }
  
  cargarSubastas() {
    this.subastaService.getSubastas().subscribe({
      next: (subastas) => {
        // Filtrar subastas de esta casa de remate
        const casaRemateId = this.casaRemate?.usuario_id || 2;
        this.subastas = subastas.filter(subasta => 
          subasta.casa_remate?.usuario_id === casaRemateId
        );
        this.cargarLotes();
      },
      error: (error) => {
        console.error('Error al cargar subastas:', error);
        this.cargandoDatos = false;
      }
    });
  }
  
  cargarLotes() {
    this.loteService.getLotes().subscribe({
      next: (lotes) => {
        // Filtrar lotes de las subastas de esta casa
        const idsSubastas = this.subastas.map(s => s.id);
        this.lotes = lotes.filter(lote => 
          idsSubastas.includes(lote.subasta?.id || 0)
        );
        
        this.calcularEstadisticas();
        this.generarGraficos();
        this.cargandoDatos = false;
      },
      error: (error) => {
        console.error('Error al cargar lotes:', error);
        this.cargandoDatos = false;
      }
    });
  }
  
  cargarCategorias() {
    this.categoriaService.getCategorias().subscribe({
      next: (categorias) => {
        this.categorias = categorias;
      },
      error: (error) => {
        console.error('Error al cargar categorías:', error);
      }
    });
  }
  
  calcularEstadisticas() {
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    
    this.estadisticas.totalSubastas = this.subastas.length;
    this.estadisticas.subastasMes = this.subastas.filter(s => 
      new Date(s.fecha) >= inicioMes
    ).length;
    
    this.estadisticas.totalLotes = this.lotes.length;
    this.estadisticas.lotesPagados = this.lotes.filter(l => l.pago).length;
    
    // Calcular ventas (lotes pagados)
    const lotesVendidos = this.lotes.filter(l => l.pago);
    this.estadisticas.totalVentas = lotesVendidos.reduce((sum, lote) => 
      sum + (lote.valorBase || 0), 0
    );
    
    this.estadisticas.ventasMes = this.lotes
      .filter(l => l.pago && l.subasta && new Date(l.subasta.fecha || '') >= inicioMes)
      .reduce((sum, lote) => sum + (lote.valorBase || 0), 0);
    
    // Calcular participación total (número de pujas)
    this.estadisticas.participacionTotal = this.lotes.reduce((sum, lote) => 
      sum + (lote.pujas?.length || 0), 0
    );
  }
  
  generarGraficos() {
    this.generarGraficoVentasPorCategoria();
    this.generarGraficoSubastasPorMes();
    this.generarGraficoLotesPorEstado();
  }
  
  generarGraficoVentasPorCategoria() {
    // Agrupar ventas por categoría
    const ventasPorCategoria: { [key: string]: number } = {};
    
    this.lotes.filter(l => l.pago).forEach(lote => {
      if (lote.articulos && lote.articulos.length > 0) {
        lote.articulos.forEach(articulo => {
          const categoria = articulo.categoria?.nombre || 'Sin categoría';
          ventasPorCategoria[categoria] = (ventasPorCategoria[categoria] || 0) + (lote.valorBase || 0);
        });
      } else {
        // Si no hay artículos, agregar a "Sin categoría"
        ventasPorCategoria['Sin categoría'] = (ventasPorCategoria['Sin categoría'] || 0) + (lote.valorBase || 0);
      }
    });
    
    this.chartVentasPorCategoria = {
      labels: Object.keys(ventasPorCategoria),
      datasets: [{
        label: 'Ventas por Categoría ($)',
        data: Object.values(ventasPorCategoria),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40'
        ]
      }]
    };
  }
  
  generarGraficoSubastasPorMes() {
    // Agrupar subastas por mes
    const subastasPorMes: { [key: string]: number } = {};
    
    this.subastas.forEach(subasta => {
      const fecha = new Date(subasta.fecha);
      const mes = fecha.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
      subastasPorMes[mes] = (subastasPorMes[mes] || 0) + 1;
    });
    
    this.chartSubastasPorMes = {
      labels: Object.keys(subastasPorMes),
      datasets: [{
        label: 'Subastas por Mes',
        data: Object.values(subastasPorMes),
        backgroundColor: '#36A2EB',
        borderColor: '#36A2EB',
        tension: 0.4
      }]
    };
  }
  
  generarGraficoLotesPorEstado() {
    const lotesPagados = this.lotes.filter(l => l.pago).length;
    const lotesPendientes = this.lotes.length - lotesPagados;
    
    this.chartLotesPorEstado = {
      labels: ['Pagados', 'Pendientes'],
      datasets: [{
        data: [lotesPagados, lotesPendientes],
        backgroundColor: ['#4CAF50', '#FF5722']
      }]
    };
  }
  
  aplicarFiltros() {
    this.cargandoDatos = true;
    
    // Filtrar subastas según los criterios
    let subastasFiltradas = [...this.subastas];
    
    // Filtro por estado
    if (this.selectedEstado) {
      const esActiva = this.selectedEstado === 'activa';
      subastasFiltradas = subastasFiltradas.filter(s => s.activa === esActiva);
    }
    
    // Filtro por rango de fechas
    if (this.rangoFechas && this.rangoFechas.length === 2) {
      const fechaInicio = this.rangoFechas[0];
      const fechaFin = this.rangoFechas[1];
      subastasFiltradas = subastasFiltradas.filter(s => {
        const fechaSubasta = new Date(s.fecha);
        return fechaSubasta >= fechaInicio && fechaSubasta <= fechaFin;
      });
    }
    
    // Filtrar lotes según subastas filtradas
    const idsSubastasFiltradas = subastasFiltradas.map(s => s.id);
    let lotesFiltrados = this.lotes.filter(lote => 
      idsSubastasFiltradas.includes(lote.subasta?.id || 0)
    );
    
    // Filtro por categoría
    if (this.selectedCategoria) {
      lotesFiltrados = lotesFiltrados.filter(lote => 
        lote.articulos?.some(articulo => 
          articulo.categoria?.id === this.selectedCategoria?.id
        )
      );
    }
    
    // Recalcular estadísticas con datos filtrados
    this.recalcularEstadisticasFiltradas(subastasFiltradas, lotesFiltrados);
    
    this.cargandoDatos = false;
    
    this.messageService.add({
      severity: 'success',
      summary: 'Filtros aplicados',
      detail: `Mostrando ${subastasFiltradas.length} subastas y ${lotesFiltrados.length} lotes`
    });
  }
  
  recalcularEstadisticasFiltradas(subastas: subastaDto[], lotes: loteDto[]) {
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    
    this.estadisticas.totalSubastas = subastas.length;
    this.estadisticas.subastasMes = subastas.filter(s => 
      new Date(s.fecha) >= inicioMes
    ).length;
    
    this.estadisticas.totalLotes = lotes.length;
    this.estadisticas.lotesPagados = lotes.filter(l => l.pago).length;
    
    // Calcular ventas (lotes pagados)
    const lotesVendidos = lotes.filter(l => l.pago);
    this.estadisticas.totalVentas = lotesVendidos.reduce((sum, lote) => 
      sum + (lote.valorBase || 0), 0
    );
    
    this.estadisticas.ventasMes = lotes
      .filter(l => l.pago && l.subasta && new Date(l.subasta.fecha || '') >= inicioMes)
      .reduce((sum, lote) => sum + (lote.valorBase || 0), 0);
    
    // Calcular participación total (número de pujas)
    this.estadisticas.participacionTotal = lotes.reduce((sum, lote) => 
      sum + (lote.pujas?.length || 0), 0
    );
    
    // Regenerar gráficos con datos filtrados
    this.generarGraficosFiltrados(lotes);
  }
  
  generarGraficosFiltrados(lotes: loteDto[]) {
    // Regenerar gráfico de ventas por categoría con datos filtrados
    const ventasPorCategoria: { [key: string]: number } = {};
    
    lotes.filter(l => l.pago).forEach(lote => {
      lote.articulos?.forEach(articulo => {
        const categoria = articulo.categoria?.nombre || 'Sin categoría';
        ventasPorCategoria[categoria] = (ventasPorCategoria[categoria] || 0) + (lote.valorBase || 0);
      });
    });
    
    this.chartVentasPorCategoria = {
      labels: Object.keys(ventasPorCategoria),
      datasets: [{
        label: 'Ventas por Categoría ($)',
        data: Object.values(ventasPorCategoria),
        backgroundColor: [
          '#FF6384',
          '#36A2EB', 
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40'
        ]
      }]
    };
    
    // Regenerar gráfico de estado de lotes
    const lotesPagados = lotes.filter(l => l.pago).length;
    const lotesPendientes = lotes.length - lotesPagados;
    
    this.chartLotesPorEstado = {
      labels: ['Pagados', 'Pendientes'],
      datasets: [{
        data: [lotesPagados, lotesPendientes],
        backgroundColor: ['#4CAF50', '#FF5722']
      }]
    };
  }
  
  limpiarFiltros() {
    this.selectedCategoria = null;
    this.selectedEstado = null;
    this.rangoFechas = [];
    
    // Recalcular con todos los datos
    this.calcularEstadisticas();
    this.generarGraficos();
    
    this.messageService.add({
      severity: 'info',
      summary: 'Filtros limpiados',
      detail: 'Mostrando todos los datos'
    });
  }

  // Métodos helper para la tabla
  getParticipacionSubasta(subasta: subastaDto): number {
    if (!subasta.lotes) return 0;
    return subasta.lotes.reduce((total, lote) => {
      return total + (lote.pujas?.length || 0);
    }, 0);
  }

  getVentasSubasta(subasta: subastaDto): number {
    if (!subasta.lotes) return 0;
    return subasta.lotes
      .filter(lote => lote.pago)
      .reduce((total, lote) => {
        return total + (lote.valorBase || 0);
      }, 0);
  }

}
