import { Component, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SubastaService } from '../../services/subasta.service';
import { subastaDto } from '../../models/subastaDto';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OnInit } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { loteDto } from '../../models/loteDto';
import { PujaService } from '../../services/puja.service'
import { pujaDto } from '../../models/pujaDto';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DialogModule } from 'primeng/dialog';
import { mailDto } from '../../models/mailDto';
import { WebsocketService } from '../../services/webSocketService';
import { PayPalComponent } from '../pay-pal/pay-pal.component';
import { NotificacionService } from '../../services/notificacion.service';
import { ChatService } from '../../services/chat.service';

interface PujaRequest {
  fechaHora: string;
  monto: number;
  cliente_id: number | null;
  lote_id: number;
}

interface TimerState {
  timer: string;
  timerActivo: boolean;
  tiempoRestanteSegundos?: number;
}

interface ganadorDto {
  numeroLote: number;
  clienteId: number;
  monto: number;
}

const TIMER_CONSTANTS = {
  INTERVAL_MS: 1000,
  SECONDS_PER_MINUTE: 60,
  MINUTES_PER_HOUR: 60,
  SECONDS_PER_HOUR: 3600,
  FINISHED_MESSAGE: 'Finalizada'
} as const;

@Component({
  selector: 'app-stream',
  standalone: true,
  imports: [CommonModule, InputTextModule, FormsModule, ButtonModule, DialogModule, PayPalComponent],
  templateUrl: './stream.component.html',
  styleUrls: ['./stream.component.scss']
})
export class StreamComponent implements OnInit, OnDestroy {

  subasta: subastaDto | null = null;
  lotes: loteDto[] = [];
  pujas: pujaDto[] = [];
  
  indexLotes: number = 0;
  umbralSuperado: boolean = false;
  videoUrl: SafeResourceUrl | null = null;
  
  ganadores: ganadorDto[] = []; // Lista de ganadores por lote

  // Propiedades para el chat
  chatCreado: boolean = false;
  chatRoomId: string = '';
  
  public timerState: TimerState = {
    timer: "Sin iniciar",
    timerActivo: false,
    tiempoRestanteSegundos: 0
  };
  
  private subastaSubscription?: Subscription;
  private timerInitialized: boolean = false;  private websocketSubscriptions: Subscription[] = [];
  boton: boolean = false;

  pujaActual: number = 0;
  pujaRapida: number | null = null;
  pujaComun: number | null = null;
  clienteMail: string | null = null;

  // Variables para control de inicio automático
  private intervalId: any;
  private subastaFechaVerificada: boolean = false;
  
  // Interval para actualizar la UI del timer en tiempo real
  private timerDisplayInterval: any;

  // Variables para modal y pago
  modalVideo: boolean = false;
  video: string = '';
  pagando: boolean = false;
  paypalMonto: number = 0;
  paypalComponentKey: boolean = true; // Para forzar recreación del componente PayPal

  // Getters
  get timer(): string {
    return this.timerState.timer;
  }

  get timerActivo(): boolean {
    return this.timerState.timerActivo;
  }

  get timerDisplayText(): string {
    if (this.timerState.timer === TIMER_CONSTANTS.FINISHED_MESSAGE) {
      return TIMER_CONSTANTS.FINISHED_MESSAGE;
    }
    
    if (this.subasta?.activa && this.timerState.timerActivo) {
      return this.timerState.timer;
    }
    
    if (this.subasta?.activa && !this.timerState.timerActivo) {
      return TIMER_CONSTANTS.FINISHED_MESSAGE;
    }
    
    if (!this.subasta?.activa) {
      if (this.subasta?.fecha) {
        let fechaSubasta: Date;
        
        if (typeof this.subasta.fecha === 'string') {
          const fechaStr = this.subasta.fecha as string;
          const fechaFormateada = fechaStr.includes(' ') && !fechaStr.includes('T') 
            ? fechaStr.replace(' ', 'T') 
            : fechaStr;
          fechaSubasta = new Date(fechaFormateada);
        } else {
          fechaSubasta = new Date(this.subasta.fecha);
        }
        
        if (!isNaN(fechaSubasta.getTime())) {
          const ahora = new Date();
          
          if (fechaSubasta > ahora) {
            return `Inicia: ${this.formatearFechaInicio(fechaSubasta)}`;
          } else {
            return "Lista para iniciar";
          }
        }
      }
      return "Sin iniciar";
    }
    
    return this.timerState.timer;
  }

  get timerCssClass(): string {
    if (this.timerDisplayText === TIMER_CONSTANTS.FINISHED_MESSAGE) {
      return "timer-input finalizada";
    }
    
    if (!this.subasta?.activa && !this.timerState.timerActivo) {
      return "timer-input sin-iniciar";
    } else if (this.timerState.timerActivo) {
      return "timer-input activo";
    }
    
    return "timer-input";
  }

  get puedeNavegerLotes(): boolean {
    // El rematador SIEMPRE puede navegar cuando hay lotes disponibles
    if (this.isRematador()) {
      return !!(this.lotes && this.lotes.length > 1);
    }
    
    // Los usuarios normales solo pueden "navegar" (seguir al rematador) si la subasta está activa
    return !!(this.subasta?.activa && this.timerState.timerActivo);
  }  
  
  get esGanador(): boolean {
    // Verificar si el usuario ganó algún lote
    const usuarioActual = localStorage.getItem('usuario_id');
    if (!usuarioActual) {
      console.log('🎯 esGanador: FALSE - No hay usuario logueado');
      return false;
    }
    
    const usuarioId = Number(usuarioActual);
    
    // MÉTODO 1: Verificar en tiempo real durante la subasta activa
    if (this.subasta?.activa && this.timerState.timerActivo) {
      // Durante la subasta, verificar si es ganador del lote actual
      const ganadorLoteActual = this.ganadores[this.indexLotes];
      if (ganadorLoteActual && ganadorLoteActual.clienteId === usuarioId && ganadorLoteActual.monto > 0) {
        console.log('🎯 esGanador: TRUE - Usuario es ganador del lote actual durante la subasta');
        return true;
      }
    }
    
    // MÉTODO 2: Al final de la subasta, verificar todos los lotes ganados
    if (!this.subasta?.activa || !this.timerState.timerActivo) {
      const lotesGanados = this.lotesGanadosPorUsuario.length;
      if (lotesGanados > 0) {
        console.log(`🎯 esGanador: TRUE - Usuario ganó ${lotesGanados} lote(s) al final de la subasta`);
        return true;
      }
    }
    
    console.log('🎯 esGanador: FALSE - Usuario no es ganador');
    return false;
  }

  /**
   * Getter que devuelve todos los lotes ganados por el usuario actual
   */
  get lotesGanadosPorUsuario(): ganadorDto[] {
    const usuarioActual = localStorage.getItem('usuario_id');
    if (!usuarioActual) return [];
    
    const usuarioId = Number(usuarioActual);
    return this.ganadores.filter(ganador => 
      ganador.clienteId === usuarioId && ganador.monto > 0
    );
  }

  /**
   * Calcula el monto total de todos los lotes ganados por el usuario
   */
  get montoTotalGanador(): number {
    return this.lotesGanadosPorUsuario.reduce((total, ganador) => {
      return total + Number(ganador.monto);
    }, 0);
  }

  /**
   * Obtiene información detallada de los lotes ganados
   */
  get lotesGanadosDetalle(): Array<{lote: loteDto, ganador: ganadorDto}> {
    return this.lotesGanadosPorUsuario.map(ganador => {
      const lote = this.lotes.find(l => l.id === ganador.numeroLote) || this.lotes[ganador.numeroLote - 1];
      return { lote, ganador };
    });
  }

  constructor(
    private subastaService: SubastaService,
    private route: ActivatedRoute,
    private pujaService: PujaService,
    private sanitizer: DomSanitizer,
    private websocketService: WebsocketService,
    private notificacionService: NotificacionService,
    private chatService: ChatService,
    private cdr: ChangeDetectorRef
  ) {
    (window as any).streamComponent = this;
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id || isNaN(id)) {
      console.error('ID de subasta inválido');
      return;
    }

    this.subastaSubscription?.unsubscribe();
    this.subastaSubscription = this.subastaService.getSubasta(id).subscribe({
      next: (data) => {
        this.subasta = data;
        this.indexLotes = this.subasta.loteIndex || 0;
        
        this.lotes = (this.subasta.lotes || []).map(lote => ({
          ...lote,
          subasta: {
            id: this.subasta!.id,
            fecha: this.subasta!.fecha,
            duracionMinutos: this.subasta!.duracionMinutos,
            nombre: this.subasta!.nombre
          }
        }));

        // Inicializar array de ganadores con el tamaño correcto
        this.initializarArrayGanadores();

        // Validar estado de la subasta antes de continuar
        this.validarEstadoSubasta();
        
        if(this.subasta.videoId && this.subasta.videoId.trim() !== '') {
          this.initializeVideo(this.subasta.videoId);
        }
        
        this.cargarPujas(this.indexLotes);
        this.verificarInicioAutomaticoSubasta();
        this.setupWebSocketConnection();
        this.exposeTestingMethods();
      },
      error: (err) => {
        console.error('Error al cargar subasta:', err);
      }
    });
  }
  ngOnDestroy(): void {
    this.detenerTimer();
    this.stopTimerDisplayInterval(); // Limpiar el interval del timer display
    this.subastaSubscription?.unsubscribe();
    this.timerInitialized = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.websocketSubscriptions.forEach(sub => sub.unsubscribe());
    this.websocketSubscriptions = [];

    if (this.subasta?.id) {
      this.websocketService.leaveAuction(
        this.subasta.id,
        Number(localStorage.getItem('usuario_id')) || 0,
        'Usuario'
      );
    }
  }


  /**
   * Parsea la fecha de la subasta a un objeto Date
   */
  private parsearFechaSubasta(fechaInput: any): Date | null {
    if (!fechaInput) return null;
    
    let fecha: Date;
    
    if (fechaInput instanceof Date) {
      fecha = fechaInput;
    } else if (typeof fechaInput === 'string') {
      if (fechaInput.includes(' ') && !fechaInput.includes('T')) {
        fecha = new Date(fechaInput.replace(' ', 'T'));
      } else {
        fecha = new Date(fechaInput);
      }
    } else if (typeof fechaInput === 'number') {
      fecha = new Date(fechaInput);
    } else {
      return null;
    }
    
    if (isNaN(fecha.getTime())) return null;
    return fecha;
  }


  /**
   * Valida si la subasta debe estar activa según la hora actual y la duración.
   * Actualiza automáticamente el estado de la subasta y el timer si es necesario.
   */
  private validarEstadoSubasta(): void {
    if (!this.subasta || !this.subasta.fecha || !this.subasta.duracionMinutos) return;
    
    const fechaSubasta = this.parsearFechaSubasta(this.subasta.fecha);
    if (!fechaSubasta) return;
    
    const ahora = new Date();
    const finSubasta = new Date(fechaSubasta.getTime() + (this.subasta.duracionMinutos || 0) * 60000);
    
    console.log('🔍 Validando estado de subasta:', {
      fechaInicio: fechaSubasta.toLocaleString(),
      fechaFin: finSubasta.toLocaleString(),
      ahora: ahora.toLocaleString(),
      estadoAnterior: this.subasta.activa
    });
    
    if (ahora < fechaSubasta) {
      // Antes de la subasta
      this.subasta.activa = false;
      this.boton = false;
      console.log('⏰ Subasta programada para el futuro');
    } else if (ahora >= fechaSubasta && ahora <= finSubasta) {
      // Durante la subasta - activar automáticamente
      const estadoAnterior = this.subasta.activa;
      this.subasta.activa = true;
      this.boton = true;
      console.log('🔥 Subasta está en curso');
      
      // Si no estaba activa antes, iniciar el timer
      if (!estadoAnterior && !this.timerInitialized) {
        console.log('🚀 Iniciando timer automáticamente porque la subasta debe estar activa');
        const tiempoTranscurridoMs = ahora.getTime() - fechaSubasta.getTime();
        const tiempoTranscurridoSegundos = Math.floor(tiempoTranscurridoMs / 1000);
        const duracionTotalSegundos = this.subasta.duracionMinutos * 60;
        const tiempoRestante = Math.max(0, duracionTotalSegundos - tiempoTranscurridoSegundos);        if (tiempoRestante > 0) {
          this.timerInitialized = true;
          this.timerState.tiempoRestanteSegundos = tiempoRestante;
          this.timerState.timer = this.formatearTiempo(tiempoRestante);
          this.timerState.timerActivo = true;
          
          // Inicializar timer WebSocket para todos los usuarios
          this.inicializarTimerWebSocket(tiempoRestante);
          
          console.log('🎯 Subasta ACTIVA - Los usuarios YA PUEDEN PUJAR');
        } else {
          // La subasta ya debería haber terminado
          console.log('⏰ Tiempo agotado - Finalizando subasta automáticamente');
          this.timerState.timer = TIMER_CONSTANTS.FINISHED_MESSAGE;
          this.timerState.timerActivo = false;
          this.finalizarSubastaPorTiempo();
        }
      }
    } else {      // Después de la subasta
      this.subasta.activa = false;
      this.boton = false;
      this.timerState.timer = TIMER_CONSTANTS.FINISHED_MESSAGE;
      this.timerState.timerActivo = false;
      
      console.log('🏁 Subasta finalizada por tiempo programado');
      this.finalizarSubastaPorTiempo();
    }
  }
  /**
   * Expone métodos de debugging en window para facilitar las pruebas durante el desarrollo
   */  private exposeTestingMethods(): void {    (window as any).streamDebug = {
      getAuctionInfo: () => this.getAuctionInfo(),
      getTimerStatus: () => this.getTimerStatus(),
      forceSyncWithBackend: () => this.forceSyncWithBackend(),
      checkBackendStatus: () => this.checkBackendStatus(),
      validarEstado: () => this.validarEstadoSubasta(),
      checkWinner: () => this.checkWinner(),
      forceStartTimer: () => this.iniciarSubastaAutomaticamente(),
      // Nuevos métodos de debugging para ganador
      esGanador: () => this.esGanador,
      encontrarGanador: () => this.encontrarGanador(),
      pagando: () => this.pagando,
      pujas: () => this.pujas,      simularFinSubasta: () => {
        console.log('🧪 SIMULANDO FIN DE SUBASTA...');
        if (this.subasta) {
          this.subasta.activa = false;
        }
        this.timerState.timerActivo = false;
        this.timerState.tiempoRestanteSegundos = 0;
        console.log('✅ Subasta desactivada, verificando ganador...');
        console.log('🏆 esGanador:', this.esGanador);
        console.log('💰 pagando:', this.pagando);
        this.cdr.detectChanges();
      },
      // Nuevo método para debugging detallado de detección de ganador
      debugDeteccionGanador: () => {
        console.log('🧪 [DEBUG] DETECCIÓN DETALLADA DE GANADOR:');
        console.log('📊 Pujas actuales:', this.pujas.map((p, index) => ({
          index,
          id: p.id,
          monto: p.monto,
          fecha: p.fechaHora,
          cliente: p.cliente,
          clienteUsuario: p.cliente?.usuario,
          clienteUsuarioId: p.cliente?.usuario?.id
        })));
        
        const ganadorId = this.encontrarGanador();
        const esGanador = this.esGanador;

        console.log('🎯 Resultado final:', {
          ganadorId,
          esGanador,
          usuarioActual: localStorage.getItem('usuario_id'),
          clienteID: this.ganadores[this.indexLotes]?.clienteId,
          pujaActual: this.pujaActual,
          subastaActiva: this.subasta?.activa,
          timerActivo: this.timerState.timerActivo
        });
        
        return { ganadorId, esGanador };
      },
      // Nuevo método para verificar ganadores múltiples
      debugGanadoresMultiples: () => {
        console.log('🧪 [DEBUG] ESTADO DE GANADORES MÚLTIPLES:');
        console.log('📊 Array completo de ganadores:', this.ganadores.map((g, index) => ({
          index,
          numeroLote: g.numeroLote,
          clienteId: g.clienteId,
          monto: g.monto,
          loteReal: this.lotes[index]?.id,
          loteNombre: this.lotes[index]?.articulos?.[0]?.nombre || `Lote ${index + 1}`
        })));
        
        const usuarioActual = localStorage.getItem('usuario_id');
        const lotesGanados = this.lotesGanadosPorUsuario;
        const montoTotal = this.montoTotalGanador;
        
        console.log('🏆 Resumen del usuario actual:', {
          usuarioId: usuarioActual,
          lotesGanados: lotesGanados,
          cantidadLotesGanados: lotesGanados.length,
          montoTotal: montoTotal,
          esGanadorGetter: this.esGanador
        });
        
        return {
          ganadores: this.ganadores,
          lotesGanados,
          montoTotal,
          esGanador: this.esGanador
        };
      },
      // Nuevo método para forzar sincronización manual
      sincronizarGanadores: () => {
        console.log('🧪 [DEBUG] FORZANDO SINCRONIZACIÓN MANUAL...');
        this.sincronizarGanadoresCompleto();
        
        // Devolver estado actualizado
        const usuarioActual = localStorage.getItem('usuario_id');
        const lotesGanados = this.lotesGanadosPorUsuario;
        const montoTotal = this.montoTotalGanador;
        
        console.log('✅ Sincronización completada. Estado actual:', {
          ganadores: this.ganadores,
          lotesGanados,
          montoTotal,
          esGanador: this.esGanador
        });
        
        return {
          ganadores: this.ganadores,
          lotesGanados,
          montoTotal,
          esGanador: this.esGanador
        };
      },
      // Método para debugging de tipos de datos
      debugTiposDatos: () => {
        const usuarioActual = localStorage.getItem('usuario_id');
        const lotesGanados = this.lotesGanadosPorUsuario;
        
        console.log('🔍 [DEBUG] TIPOS DE DATOS:');
        lotesGanados.forEach((ganador, index) => {
          console.log(`Lote ${index + 1}:`, {
            numeroLote: ganador.numeroLote,
            clienteId: ganador.clienteId,
            monto: ganador.monto,
            tipoMonto: typeof ganador.monto,
            esNumero: !isNaN(Number(ganador.monto))
          });
        });
        
        const montosIndividuales = lotesGanados.map(g => Number(g.monto));
        const sumaManual = montosIndividuales.reduce((a, b) => a + b, 0);
        
        console.log('💰 CÁLCULO TOTAL:', {
          montosIndividuales,
          sumaManual,
          montoTotalGetter: this.montoTotalGanador,
          coinciden: sumaManual === this.montoTotalGanador
        });
        
        return {
          lotesGanados,
          montosIndividuales,
          sumaManual,
          montoTotal: this.montoTotalGanador
        };
      }
    };
  }

  // Métodos de testing y debugging esenciales
  public getAuctionInfo() {
    return {
      subasta: this.subasta,
      timerState: this.timerState,
      intervalId: this.intervalId,
      fechaSubasta: this.subasta?.fecha,
      fechaParseada: this.subasta?.fecha ? this.parsearFechaSubasta(this.subasta.fecha) : null,
      horaActual: new Date(),
      subastaActiva: this.subasta?.activa
    };
  }
  public getTimerStatus() {
    return {
      timerActivo: this.timerState.timerActivo,
      timer: this.timerState.timer,
      tiempoRestanteSegundos: this.timerState.tiempoRestanteSegundos,
      displayText: this.timerDisplayText,
      cssClass: this.timerCssClass,
      esRematador: this.isRematador(),
      intervalId: this.intervalId,
      modoWebSocket: true // Nuevo modo
    };
  }

  public forceSyncWithBackend() {
    console.log('🧪 [TEST] Forzando sincronización con backend');
    if (this.subasta?.id) {
      this.subastaService.getSubasta(this.subasta.id).subscribe({
        next: (subastaActualizada) => {
          console.log('✅ [TEST] Subasta sincronizada desde backend:', subastaActualizada);
          this.subasta = subastaActualizada;
          
          if (!subastaActualizada.activa && this.timerState.timerActivo) {
            console.log('⚠️ [TEST] Backend indica subasta inactiva, deteniendo timer local');
            this.detenerTimer();
            this.timerState.timer = TIMER_CONSTANTS.FINISHED_MESSAGE;
            this.timerState.timerActivo = false;
          }
        },
        error: (err) => {
          console.error('❌ [TEST] Error al sincronizar con backend:', err);
        }
      });
    }
  }

  public checkBackendStatus() {
    console.log('🧪 [TEST] Verificando estado en backend');
    if (this.subasta?.id) {
      this.subastaService.getSubasta(this.subasta.id).subscribe({
        next: (subastaBackend) => {
          console.log('📊 [TEST] Estado en backend:', {
            id: subastaBackend.id,
            activa: subastaBackend.activa,
            fecha: subastaBackend.fecha,
            duracionMinutos: subastaBackend.duracionMinutos
          });
          console.log('📊 [TEST] Estado en frontend:', {
            id: this.subasta?.id,
            activa: this.subasta?.activa,
            fecha: this.subasta?.fecha,
            duracionMinutos: this.subasta?.duracionMinutos
          });
          
          if (subastaBackend.activa !== this.subasta?.activa) {
            console.warn('⚠️ [TEST] DESINCRONIZACIÓN detectada entre frontend y backend!');
          } else {
            console.log('✅ [TEST] Frontend y backend están sincronizados');
          }
        },
        error: (err) => {
          console.error('❌ [TEST] Error al consultar backend:', err);
        }
      });
    }
  }

  public checkWinner() {
    const ganadorId = this.encontrarGanador();
    const esGanador = ganadorId && this.esUsuarioGanador(ganadorId);

    console.log('🏆 [TEST] Información del ganador:', {
      ganadorId: ganadorId,
      usuarioActual: localStorage.getItem('usuario_id'),
      clienteID: this.ganadores[this.indexLotes]?.clienteId,
      esGanador: esGanador,
      pujaActual: this.pujaActual,
      pujas: this.pujas.map(p => ({ monto: p.monto, id: p.id })),
      getterEsGanador: this.esGanador
    });
    
    return {
      ganadorId,
      esGanador,
      pujaActual: this.pujaActual,
      totalPujas: this.pujas.length
    };
  }

  // Métodos de video
  public initializeVideo(videoId: string | undefined): void {
    this.modalVideo = false;

    if (!videoId || videoId.trim() === '') {
      this.videoUrl = null; 
      return;
    }
    
    const cleanVideoId = videoId.trim();
    const embedUrl = `https://www.youtube.com/embed/${cleanVideoId}?controls=1&rel=0&modestbranding=1&iv_load_policy=3`;
    this.videoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

  // Métodos de navegación de lotes
  anteriorLote(): void {
    // Validación más robusta para el rematador
    if (!this.isRematador()) {
      console.warn('❌ ACCESO DENEGADO: Solo el rematador puede cambiar de lote');
      alert('Solo el rematador puede cambiar de lote');
      return;
    }

    if (!this.subasta) {
      console.warn('❌ No hay subasta cargada');
      return;
    }

    if (this.indexLotes <= 0) {
      console.warn('❌ Ya estás en el primer lote');
      alert('Ya estás en el primer lote');
      return;
    }

    // Marcar que el rematador está navegando activamente
    this.rematadorNavigating = true;
    this.lastNavigationTime = Date.now();

    // Log detallado para debugging
    const estadoAntes = {
      loteActual: this.indexLotes,
      subastaActiva: this.subasta.activa,
      totalLotes: this.lotes.length,
      esRematador: this.isRematador()
    };

    console.log('🎯 REMATADOR: Intentando retroceder al lote anterior:', estadoAntes);

    // Realizar el cambio inmediatamente en el frontend
    const loteAnterior = this.indexLotes;
    this.indexLotes--;
    this.subasta.loteIndex = this.indexLotes;
    this.umbralSuperado = false;
    
    console.log('🚀 REMATADOR: Cambio local realizado a lote', this.indexLotes);
    
    // Cargar pujas del nuevo lote inmediatamente
    this.cargarPujas(this.indexLotes);
    
    // Enviar cambio vía WebSocket inmediatamente
    this.sendLoteChangeToWebSocket();
    
    // Actualizar el backend de forma asíncrona
    this.subastaService.updateSubasta(this.subasta).subscribe({
      next: () => {
        console.log('✅ REMATADOR: Backend actualizado correctamente con lote', this.indexLotes);
        // Desmarcar navegación después de éxito
        setTimeout(() => {
          this.rematadorNavigating = false;
        }, 1000);
      },
      error: (err) => {
        console.error('❌ REMATADOR: Error al actualizar backend:', err);
        console.warn('⚠️ Continuando con el cambio local - la sincronización se reintentará');
        
        // NO revertir el cambio - mantener el control del rematador
        console.log('🎯 REMATADOR: Manteniendo cambio de lote a pesar del error del backend');
        
        // Desmarcar navegación incluso en caso de error
        setTimeout(() => {
          this.rematadorNavigating = false;
        }, 1000);
      }
    });

    console.log('✅ REMATADOR: Navegación completada:', {
      de: loteAnterior,
      a: this.indexLotes,
      estado: 'ACTIVO'
    });
  }

  siguienteLote(): void {
    // Validación más robusta para el rematador
    if (!this.isRematador()) {
      console.warn('❌ ACCESO DENEGADO: Solo el rematador puede cambiar de lote');
      alert('Solo el rematador puede cambiar de lote');
      return;
    }

    if (!this.subasta) {
      console.warn('❌ No hay subasta cargada');
      return;
    }

    if (this.indexLotes >= this.lotes.length - 1) {
      console.warn('❌ Ya estás en el último lote');
      alert('Ya estás en el último lote');
      return;
    }

    // Marcar que el rematador está navegando activamente
    this.rematadorNavigating = true;
    this.lastNavigationTime = Date.now();

    // Log detallado para debugging
    const estadoAntes = {
      loteActual: this.indexLotes,
      subastaActiva: this.subasta.activa,
      totalLotes: this.lotes.length,
      esRematador: this.isRematador()
    };

    console.log('🎯 REMATADOR: Intentando avanzar al siguiente lote:', estadoAntes);

    // Realizar el cambio inmediatamente en el frontend
    const loteAnterior = this.indexLotes;
    this.indexLotes++;
    this.subasta.loteIndex = this.indexLotes;
    this.umbralSuperado = false;
    
    console.log('🚀 REMATADOR: Cambio local realizado a lote', this.indexLotes);
    
    // Cargar pujas del nuevo lote inmediatamente
    this.cargarPujas(this.indexLotes);
    
    // Enviar cambio vía WebSocket inmediatamente
    this.sendLoteChangeToWebSocket();
    
    // Actualizar el backend de forma asíncrona
    this.subastaService.updateSubasta(this.subasta).subscribe({
      next: () => {
        console.log('✅ REMATADOR: Backend actualizado correctamente con lote', this.indexLotes);
        // Desmarcar navegación después de éxito
        setTimeout(() => {
          this.rematadorNavigating = false;
        }, 1000);
      },
      error: (err) => {
        console.error('❌ REMATADOR: Error al actualizar backend:', err);
        console.warn('⚠️ Continuando con el cambio local - la sincronización se reintentará');
        
        // NO revertir el cambio - mantener el control del rematador
        console.log('🎯 REMATADOR: Manteniendo cambio de lote a pesar del error del backend');
        
        // Desmarcar navegación incluso en caso de error
        setTimeout(() => {
          this.rematadorNavigating = false;
        }, 1000);
      }
    });

    console.log('✅ REMATADOR: Navegación completada:', {
      de: loteAnterior,
      a: this.indexLotes,
      estado: 'ACTIVO'
    });
  }
  cargarPujas(loteIndex: number): void {
    if (loteIndex < 0 || loteIndex >= this.lotes.length) {
      console.warn('Índice de lote fuera de rango:', loteIndex);
      return;
    }

    console.log('🔄 Cargando pujas para lote:', loteIndex);
    
    this.pujas = (this.lotes[loteIndex]?.pujas as pujaDto[]) || [];
    
    console.log('📊 Pujas cargadas:', {
      totalPujas: this.pujas.length,
      pujas: this.pujas.map(p => ({ monto: p.monto, fecha: p.fechaHora }))
    });
    
    this.pujaActual = Number(this.pujas.length > 0 ? Math.max(...this.pujas.map(p => p.monto)) : 0);
    if (this.pujaActual === 0) {
      this.pujaActual = Number(this.lotes[loteIndex].pujaMinima);
    }
    this.pujaRapida = Number(this.pujaActual) + 1;
    this.pujaComun = null;
    
    console.log('💰 Estado de pujas actualizado:', {
      pujaActual: this.pujaActual,
      pujaRapida: this.pujaRapida,
      pujaMinima: this.lotes[loteIndex].pujaMinima
    });
  }// Métodos de timer
  /**
   * Inicializa el estado del timer basado en WebSocket.
   * TODOS los usuarios (rematadores y visitantes) solo escuchan las actualizaciones del servidor.
   * El servidor WebSocket maneja el timer maestro y envía actualizaciones a todos los clientes.
   */
  inicializarTimerWebSocket(tiempoInicialSegundos?: number) {
    if (!this.subasta?.duracionMinutos) {
      console.warn('No hay duración de subasta definida');
      return;
    }

    let tiempoRestanteSegundos = tiempoInicialSegundos ?? (this.subasta.duracionMinutos * 60);
    this.timerState.tiempoRestanteSegundos = tiempoRestanteSegundos;
    this.timerState.timer = this.formatearTiempo(tiempoRestanteSegundos);
    this.timerState.timerActivo = true;    console.log('🌐 Inicializando timer WebSocket con tiempo:', tiempoRestanteSegundos, 'segundos');
    console.log('📡 El timer será controlado completamente por el servidor WebSocket');
  }

  /**
   * Detiene el timer local (ya no hay suscripciones locales - todo es WebSocket)
   */
  detenerTimer(): void {
    console.log('🛑 Deteniendo timer (WebSocket)');
    this.timerState.timerActivo = false;
  }

  /**
   * Convierte segundos a formato HH:MM:SS para mostrar en la interfaz
   */
  formatearTiempo(segundos: number): string {
    if (segundos < 0) {
      segundos = 0;
    }
    
    const horas = Math.floor(segundos / TIMER_CONSTANTS.SECONDS_PER_HOUR);
    const minutos = Math.floor((segundos % TIMER_CONSTANTS.SECONDS_PER_HOUR) / TIMER_CONSTANTS.SECONDS_PER_MINUTE);
    const seg = segundos % TIMER_CONSTANTS.SECONDS_PER_MINUTE;
    
    return `${horas.toString().padStart(2, '0')}:` +
          `${minutos.toString().padStart(2, '0')}:` +
          `${seg.toString().padStart(2, '0')}`;
  }

  private formatearFechaInicio(fecha: Date): string {
    return fecha.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });  }
  
  // Métodos de pujas
  /**
   * Valida si se puede realizar una puja.
   * Verifica que la subasta esté activa Y que el timer esté corriendo.
   */
  private validarPuja(monto: number | null): { valida: boolean; error?: string } {
    console.log('🔍 VALIDANDO PUJA:', {
      monto,
      subastaActiva: this.subasta?.activa,
      timerActivo: this.timerState.timerActivo,
      pujaActual: this.pujaActual,
      loteDisponible: !!this.lotes[this.indexLotes]
    });

    // VALIDACIÓN 1: Subasta debe estar activa
    if (!this.subasta?.activa) {
      console.log('❌ VALIDACIÓN FALLIDA: Subasta no está activa');
      return { valida: false, error: 'La subasta no está activa' };
    }
    
    // VALIDACIÓN 2: Timer debe estar corriendo
    if (!this.timerState.timerActivo) {
      console.log('❌ VALIDACIÓN FALLIDA: Timer no está activo');
      return { valida: false, error: 'El tiempo de la subasta ha terminado' };
    }

    // VALIDACIÓN 3: Monto válido
    if (!monto || monto <= 0) {
      console.log('❌ VALIDACIÓN FALLIDA: Monto inválido');
      return { valida: false, error: 'El monto debe ser mayor a 0' };
    }

    // VALIDACIÓN 4: Lote disponible
    const loteActual = this.lotes[this.indexLotes];
    if (!loteActual) {
      console.log('❌ VALIDACIÓN FALLIDA: No hay lote seleccionado');
      return { valida: false, error: 'No hay lote seleccionado' };
    }

    // VALIDACIÓN 5: Puja mínima
    if (monto < loteActual.pujaMinima) {
      console.log('❌ VALIDACIÓN FALLIDA: Monto menor a puja mínima');
      return { valida: false, error: `El monto debe ser mayor a $${loteActual.pujaMinima}` };
    }

    // VALIDACIÓN 6: Superar puja actual
    if (monto <= this.pujaActual) {
      console.log('❌ VALIDACIÓN FALLIDA: Monto no supera puja actual');
      return { valida: false, error: `El monto debe ser mayor a la puja actual de $${this.pujaActual}` };
    }

    console.log('✅ VALIDACIÓN EXITOSA: Puja válida');
    return { valida: true };
  }

  private crearPujaBase(monto: number): PujaRequest {
    return {
      fechaHora: new Date().toISOString(),
      monto: monto,
      cliente_id: localStorage.getItem('usuario_id') !== null ? Number(localStorage.getItem('usuario_id')) : null, 
      lote_id: Number(this.lotes[this.indexLotes].id)
    };
  } 
  
  crearPujaRapida(): void {
    this.pujaRapida = this.pujaActual + 1;

    const validacion = this.validarPuja(this.pujaRapida);
    
    if (!validacion.valida) {
      console.error('❌ Puja rápida rechazada:', validacion.error);
      alert(`No se puede realizar la puja: ${validacion.error}`);
      this.pujaRapida = null; // Limpiar el valor para evitar confusión
      return;
    }

    console.log('🚀 Realizando puja rápida por:', this.pujaRapida);
    const puja = this.crearPujaBase(this.pujaRapida!);
    this.enviarPuja(puja);
  }

  crearPujaComun(): void {
    const validacion = this.validarPuja(this.pujaComun);
    
    if (!validacion.valida) {
      console.error('❌ Puja personalizada rechazada:', validacion.error);
      alert(`No se puede realizar la puja: ${validacion.error}`);
      this.pujaComun = null; // Limpiar el valor para evitar confusión
      return;
    }

    console.log('🎯 Realizando puja personalizada por:', this.pujaComun);
    const puja = this.crearPujaBase(this.pujaComun!);
    this.enviarPuja(puja);
  }

  private enviarPuja(puja: PujaRequest): void {
    console.log('🔍 Enviando puja completa:', puja);

    if (!puja.lote_id || puja.lote_id <= 0) {
      console.error('❌ Error: lote_id inválido:', puja.lote_id);
      alert('Error: ID de lote inválido');
      return;
    }

    const usuarioId = localStorage.getItem('usuario_id');
    if (!usuarioId) {
      console.error('❌ Error: Usuario no está logueado');
      alert('Debe iniciar sesión para realizar una puja');
      return;
    }

    if (puja.cliente_id === null) {
      puja.cliente_id = Number(usuarioId);
    }

    this.subastaService.getClienteMail(puja.cliente_id).subscribe({
      next: (mail) => {
        if (!mail) {
          console.error('No se pudo obtener el email del cliente');
          return;
        }
        this.clienteMail = mail;
        
        const email: mailDto = {
          email: this.clienteMail,
          asunto: `Puja realizada en la subasta ${this.subasta?.nombre || 'desconocida'}`,
          mensaje: `Se ha realizado una puja de $${puja.monto} en el lote ${this.lotes[this.indexLotes].id} de la subasta ${this.subasta?.nombre || 'desconocida'}.`
        };

        this.subastaService.enviarMail(email).subscribe({
          next: (response) => console.log('Email enviado exitosamente:', response),
          error: (error) => console.error('Error al enviar email:', error)
        });

        // Actualizar el ganador del lote actual con información correcta
        if (!this.ganadores[this.indexLotes]) {
          this.ganadores[this.indexLotes] = {
            numeroLote: this.lotes[this.indexLotes].id || (this.indexLotes + 1),
            clienteId: puja.cliente_id || 0,
            monto: Number(puja.monto)
          };
        } else {
          this.ganadores[this.indexLotes].clienteId = puja.cliente_id || 0;
          this.ganadores[this.indexLotes].monto = Number(puja.monto); // IMPORTANTE: Actualizar el monto también
        }

        console.log('🏆 Ganador actualizado para lote', this.indexLotes, ':', this.ganadores[this.indexLotes]);

        this.pujaService.crearPuja(puja).subscribe({
          next: (data) => {
            console.log('Puja creada exitosamente en BD:', data);

            this.pujaActual = data.monto;
            this.pujaRapida = data.monto + 1;
            this.pujaComun = null;            const nuevaPuja: pujaDto = {
              id: data.id,
              fechaHora: new Date(data.fechaHora),
              monto: data.monto,
              lote: this.lotes[this.indexLotes],
              factura: null as any,              cliente: {
                usuario: {
                  id: puja.cliente_id!,
                  nombre: localStorage.getItem('usuario_nombre') || 'Usuario',
                  email: this.clienteMail || '',
                  imagen: '' // Campo imagen vacío por defecto
                }
              }
            };
            this.pujas.push(nuevaPuja);            console.log('✅ Puja agregada localmente:', {
              pujaId: nuevaPuja.id,
              monto: nuevaPuja.monto,
              clienteId: puja.cliente_id,
              clienteUsuarioId: nuevaPuja.cliente.usuario.id,
              totalPujas: this.pujas.length
            });

            this.sendWebSocketBid(puja);

            if (this.lotes[this.indexLotes].umbral < data.monto && !this.umbralSuperado) {
              this.umbralSuperado = true;
              this.enviarNotificacionUmbral(data.monto);
            }

            // Retrasar la actualización de datos para evitar interferir con navegación del rematador
            setTimeout(() => {
              this.actualizarDatosSinSobrescribir();
            }, 500); // Retraso de 500ms
          },
          error: (err) => {
            console.error('Error al crear la puja en BD:', err);
            alert('Error al procesar la puja. Por favor, intente nuevamente.');
          }
        });
      },
      error: (err) => {
        console.error('Error al obtener el email del cliente:', err);
      }
    });
  }

  private enviarNotificacionUmbral(monto: number): void {
    const casaRemateId = this.subasta?.casaremate?.usuario_id;
    if (casaRemateId) {
      this.notificacionService.crearNotificacion(
        "Umbral Superado", 
        `El lote ID: ${this.lotes[this.indexLotes].id} ha superado su umbral de $${this.lotes[this.indexLotes].umbral}. Nueva puja: $${monto}`, 
        casaRemateId, 
        false, 
        0
      ).subscribe({
        next: (notificacion) => console.log('Notificación de umbral superado creada:', notificacion),
        error: (error) => console.error('Error al crear notificación de umbral:', error)
      });
    }
  }  // Variables para control de navegación del rematador
  private rematadorNavigating = false;
  private lastNavigationTime = 0;

  private actualizarDatosSinSobrescribir(): void {
    // Protección: Si el rematador está navegando activamente, evitar interferir
    if (this.isRematador() && this.rematadorNavigating) {
      const tiempoDesdeNavegacion = Date.now() - this.lastNavigationTime;
      if (tiempoDesdeNavegacion < 2000) { // 2 segundos de protección
        console.log('🛡️ PROTECCIÓN: Evitando actualización mientras rematador navega');
        return;
      } else {
        this.rematadorNavigating = false;
      }
    }

    const id = Number(this.route.snapshot.paramMap.get('id'));
    
    console.log('🔄 Actualizando datos desde backend...', { 
      esRematador: this.isRematador(),
      loteActual: this.indexLotes 
    });
    
    this.subastaService.getSubasta(id).subscribe({
      next: (data) => {
        console.log('✅ Datos recibidos desde backend');
        
        // Preservar estados locales CRÍTICOS
        const timerEstadoAnterior = { ...this.timerState };
        const clienteIDAnterior = this.ganadores[this.indexLotes]?.clienteId;
        const subastaActivaAnterior = this.subasta?.activa;
        const botonAnterior = this.boton;
        const indexLotesAnterior = this.indexLotes; // PRESERVAR ÍNDICE DE LOTE ACTUAL DEL REMATADOR
        
        console.log('🔒 Estados críticos preservados:', {
          timerActivo: timerEstadoAnterior.timerActivo,
          subastaActiva: subastaActivaAnterior,
          boton: botonAnterior,
          indexLotes: indexLotesAnterior,
          esRematador: this.isRematador()
        });
        
        // Actualizar datos de la subasta sin tocar el índice de lote
        this.subasta = { 
          ...data,
          // CRÍTICO: Si es rematador, mantener SU índice de lote, no el del backend
          loteIndex: this.isRematador() ? indexLotesAnterior : data.loteIndex
        };
        
        // CRÍTICO: Restaurar el índice de lote del rematador INMEDIATAMENTE
        this.indexLotes = indexLotesAnterior;
        
        this.lotes = (data.lotes || []).map(lote => ({
          ...lote,
          subasta: {
            id: this.subasta!.id,
            fecha: this.subasta!.fecha,
            duracionMinutos: this.subasta!.duracionMinutos,
            nombre: this.subasta!.nombre
          }
        }));
        
        // Manejo diferenciado según tipo de usuario
        if (this.isRematador()) {
          console.log('🎯 REMATADOR: Preservando control total de navegación');
          // El rematador mantiene SIEMPRE su lote actual, sin excepciones
          this.indexLotes = indexLotesAnterior;
          
          // NO actualizar el backend con el lote del rematador aquí para evitar loops
          console.log('🎯 Rematador manteniendo lote:', indexLotesAnterior);
        } else {
          // Los usuarios normales siguen los cambios del backend/rematador
          if (data.loteIndex !== undefined && data.loteIndex !== indexLotesAnterior) {
            console.log('📍 Usuario siguiendo cambio de lote del rematador:', {
              de: indexLotesAnterior,
              a: data.loteIndex
            });
            this.indexLotes = data.loteIndex;
          }
        }
        
        // Actualizar pujas del lote actual
        const loteIndex = this.indexLotes; // Usar el índice final (ya decidido arriba)
        if (loteIndex >= 0 && loteIndex < this.lotes.length) {
          const pujasBackend = (this.lotes[loteIndex]?.pujas as pujaDto[]) || [];
          
          // Solo actualizar si hay más pujas en el backend
          if (pujasBackend.length > this.pujas.length) {
            console.log('📈 Nuevas pujas detectadas:', {
              anteriores: this.pujas.length,
              nuevas: pujasBackend.length,
              loteIndex: loteIndex
            });
            this.pujas = pujasBackend;
            
            // Recalcular puja actual
            this.pujaActual = Number(this.pujas.length > 0 ? Math.max(...this.pujas.map(p => p.monto)) : 0);
            if (this.pujaActual === 0) {
              this.pujaActual = Number(this.lotes[loteIndex].pujaMinima);
            }
            this.pujaRapida = Number(this.pujaActual) + 1;
          }
        }
        
        // CRÍTICO: Restaurar estados importantes para mantener UI consistente
        this.timerState = timerEstadoAnterior;

        // Restaurar ganador usando el índice correcto
        const indexFinal = this.indexLotes;
        if (this.ganadores[indexFinal]) {
          this.ganadores[indexFinal].clienteId = clienteIDAnterior || 0;
        } else if (clienteIDAnterior) {
          this.ganadores[indexFinal] = {
            numeroLote: this.lotes[indexFinal]?.id || (indexFinal + 1),
            clienteId: clienteIDAnterior,
            monto: Number(this.pujaActual)
          };
        }
        
        // Mantener el estado de la subasta activa si el timer está corriendo
        if (this.timerState.timerActivo) {
          console.log('⚠️ Timer activo - Forzando subasta activa');
          this.subasta.activa = true;
          this.boton = true;
        } else {
          this.boton = this.subasta.activa;
        }
        
        console.log('💰 Actualización completada:', {
          esRematador: this.isRematador(),
          indexLoteFinal: this.indexLotes,
          pujaActual: this.pujaActual,
          totalPujas: this.pujas.length,
          timerActivo: this.timerState.timerActivo,
          subastaActiva: this.subasta.activa
        });
      },
      error: (err) => {
        console.error('❌ Error al actualizar datos:', err);
      }
    });
  }
  
  // Métodos WebSocket
  private setupWebSocketConnection(): void {
    if (!this.subasta?.id) return;

    // Conectar inmediatamente sin delay
    this.websocketService.joinAuction(
      this.subasta!.id!,
      Number(localStorage.getItem('usuario_id')) || 999,
      'TestUser'
    );
    
    // Iniciar el timer display interval inmediatamente
    this.startTimerDisplayInterval();

    const auctionJoinedSubscription = this.websocketService.onAuctionJoined().subscribe({
      next: (data) => {
        console.log('✅ Confirmación: Te uniste a la subasta', data.auctionId);
        this.onWebSocketConnect();
      }
    });

    const bidSubscription = this.websocketService.onBidReceived().subscribe({
      next: (bidData) => this.handleNewBidFromWebSocket(bidData),
      error: (err) => console.error('Error en WebSocket bid:', err)
    });

    const timerSubscription = this.websocketService.onTimerUpdated().subscribe({
      next: (timerData) => this.handleTimerUpdateFromWebSocket(timerData)
    });

    const loteUpdateSubscription = this.websocketService.onLoteUpdated().subscribe({
      next: (loteData) => this.handleLoteUpdateFromWebSocket(loteData)
    });

    this.websocketSubscriptions.push(
      auctionJoinedSubscription,
      bidSubscription,
      timerSubscription,
      loteUpdateSubscription
    );
  }
  private handleNewBidFromWebSocket(bidData: any): void {
    console.log('💰 Puja recibida por WebSocket:', bidData);
    
    if (bidData.loteId !== this.lotes[this.indexLotes]?.id) {
      console.log('⚠️ Puja ignorada: corresponde a otro lote');
      return;
    }

    if (bidData.bidAmount > this.pujaActual) {
      console.log('📈 Actualizando puja actual:', this.pujaActual, '->', bidData.bidAmount);
      
      this.pujaActual = bidData.bidAmount;
      this.pujaRapida = bidData.bidAmount + 1;

      const nuevaPuja: pujaDto = {
        id: bidData.pujaId || Date.now(), // Usar ID real si está disponible
        fechaHora: new Date(bidData.timestamp),
        monto: bidData.bidAmount,
        lote: this.lotes[this.indexLotes],
        factura: null as any,
        cliente: null as any
      };

      this.pujas.push(nuevaPuja);
      console.log('✅ Puja agregada. Total de pujas:', this.pujas.length);

      if (this.lotes[this.indexLotes].umbral < bidData.bidAmount && !this.umbralSuperado) {
        this.umbralSuperado = true;
        console.log('🚨 Umbral superado!');
      }
      
      // Forzar detección de cambios
      this.cdr.detectChanges();
    } else {
      console.log('⚠️ Puja ignorada: monto no supera puja actual');
    }
  }

  private handleLoteUpdateFromWebSocket(loteData: any): void {
    // Solo los usuarios NO-rematadores deben seguir automáticamente los cambios de lote
    if (!this.isRematador() && loteData.newLoteIndex !== this.indexLotes) {
      console.log('📍 Usuario recibiendo cambio de lote vía WebSocket:', {
        loteAnterior: this.indexLotes,
        loteNuevo: loteData.newLoteIndex,
        esRematador: this.isRematador()
      });
      
      this.indexLotes = loteData.newLoteIndex;
      this.cargarPujas(this.indexLotes);
      this.umbralSuperado = false;
    } else if (this.isRematador()) {
      console.log('🎯 Rematador: Ignorando cambio de lote vía WebSocket - mantiene control manual');
    }
  }  /**
   * Procesa las actualizaciones del timer recibidas vía WebSocket desde el servidor.
   * TODOS los usuarios (rematadores y visitantes) procesan estas actualizaciones por igual.
   */
  private handleTimerUpdateFromWebSocket(timerData: any): void {
    console.log('🔍 Timer update recibido por WebSocket:', timerData);

    if (timerData.tiempoRestante !== undefined) {
      const nuevoTiempo = timerData.tiempoRestante;
      
      console.log('🌐 Actualizando timer desde servidor WebSocket:', nuevoTiempo);
      
      // Actualizar estado local con los datos del servidor
      this.timerState.tiempoRestanteSegundos = nuevoTiempo;
      this.timerState.timer = this.formatearTiempo(nuevoTiempo);
        if (nuevoTiempo > 0) {
        this.timerState.timerActivo = true;
      } else {
        this.timerState.timer = TIMER_CONSTANTS.FINISHED_MESSAGE;
        this.timerState.tiempoRestanteSegundos = 0;
        this.timerState.timerActivo = false;
        
        console.log('🏁 Timer terminado según servidor WebSocket - SUBASTA FINALIZADA');
        this.finalizarSubastaPorTiempo();
      }

      // Forzar detección de cambios para actualizar la UI
      this.cdr.detectChanges();
    }
  }

  private sendWebSocketBid(puja: PujaRequest): void {
    if (!this.subasta?.id) return;

    this.websocketService.sendBid(
      this.subasta.id,
      Number(localStorage.getItem('usuario_id')) || 999,
      'Usuario',
      puja.monto,
      puja.lote_id
    );
  }

  private sendLoteChangeToWebSocket(): void {
    if (!this.subasta?.id) return;

    const loteData = {
      loteId: this.lotes[this.indexLotes]?.id,
      loteInfo: this.lotes[this.indexLotes]
    };

    this.websocketService.sendLoteChange(
      this.subasta.id,
      this.indexLotes,
      loteData
    );
  }  /**
   * El servidor WebSocket maneja completamente el timer.
   * Este método ya no es necesario en la nueva arquitectura.
   */
  private sendTimerUpdateToWebSocket(tiempoRestanteSegundos: number): void {
    console.log('⚠️ sendTimerUpdateToWebSocket ya no se usa - el servidor maneja el timer');
  }

  // Métodos de usuario y roles
  isRematador(): boolean {
    const storedUserId = localStorage.getItem('usuario_id');
    if (!storedUserId || !this.subasta?.rematador) {
      return false;
    }

    const userId = Number(storedUserId);
    let rematadorId: number | undefined;
    
    if (this.subasta.rematador.usuario?.id) {
      rematadorId = this.subasta.rematador.usuario.id;
    } else if ((this.subasta.rematador as any).usuario_id) {
      rematadorId = (this.subasta.rematador as any).usuario_id;
    } else if (typeof this.subasta.rematador === 'number') {
      rematadorId = this.subasta.rematador;
    }    return rematadorId !== undefined && userId === rematadorId;
  }  // Métodos de finalización y pago
  /**
   * Finaliza la subasta cuando el timer llega a 0:00.
   * 1. Desactiva la subasta (no más pujas)
   * 2. Determina el ganador
   * 3. Muestra modal PayPal al ganador
   * 4. Envía notificaciones (solo rematador)
   * 5. Actualiza backend (solo rematador)
   */
  private finalizarSubastaPorTiempo(): void {
    console.log('🏁 FINALIZANDO SUBASTA POR TIEMPO AGOTADO');
    
    // PASO 1: Desactivar subasta para que no se puedan hacer más pujas
    if (this.subasta) {
      this.subasta.activa = false;
      this.boton = false;
    }
    
    console.log('🚫 Subasta INACTIVA - YA NO SE PUEDEN HACER MÁS PUJAS');
    
    // PASO 2: SINCRONIZAR GANADORES DE TODOS LOS LOTES
    this.sincronizarGanadoresCompleto();
    
    // PASO 3: Determinar ganador del lote actual
    const ganadorId = this.encontrarGanador();
    console.log('🏆 Ganador determinado:', ganadorId, '- Usuario actual:', localStorage.getItem('usuario_id'));
    
    // PASO 4: Si el usuario actual es ganador de algún lote, mostrar PayPal con el total
    if (this.lotesGanadosPorUsuario.length > 0) {
      console.log('🎉 ¡ERES GANADOR DE LOTES! Mostrando modal de pago PayPal');
      this.paypalMonto = this.montoTotalGanador; // Usar el monto total
      
      // Asegurar que el componente PayPal se inicialice correctamente
      this.paypalComponentKey = true;
      this.pagando = true;
      
      // Mensaje de confirmación con detalles
      setTimeout(() => {
        const cantidadLotes = this.lotesGanadosPorUsuario.length;
        const mensaje = cantidadLotes === 1 
          ? `¡Felicidades! Has ganado 1 lote por $${this.montoTotalGanador}. Procede con el pago.`
          : `¡Felicidades! Has ganado ${cantidadLotes} lotes por un total de $${this.montoTotalGanador}. Procede con el pago.`;
        alert(mensaje);
      }, 1000);
    } else if (ganadorId) {
      console.log('👀 No eres el ganador de esta subasta');
      setTimeout(() => {
        alert(`La subasta ha finalizado. El ganador pagó $${this.pujaActual}.`);
      }, 1000);
    } else {
      setTimeout(() => {
        alert('La subasta ha finalizado sin ganador (no hubo pujas).');
      }, 1000);
    }
    
    // PASO 5 y 6: Solo el rematador maneja notificaciones y backend
    if (this.isRematador()) {
      console.log('🔥 REMATADOR: Manejando finalización en backend');
      
      if (ganadorId) {
        this.enviarNotificacionesFinalizacion(ganadorId);
      }
      
      if (this.subasta) {
        this.subastaService.updateSubasta(this.subasta).subscribe({
          next: () => console.log('✅ REMATADOR: Subasta marcada como finalizada en la base de datos'),
          error: (err) => console.error('❌ REMATADOR: Error al finalizar subasta en la base de datos:', err)
        });
      }
    } else {
      console.log('👀 USUARIO: Finalización local completada');
    }
  }

  /**
   * DEPRECATED: Usar finalizarSubastaPorTiempo() en su lugar
   */
  private manejarFinalizacionSubasta(): void {
    console.warn('⚠️ manejarFinalizacionSubasta() está deprecated. Usando finalizarSubastaPorTiempo()');
    this.finalizarSubastaPorTiempo();
  }

  private enviarNotificacionesFinalizacion(ganadorId: number): void {
    const chatId = 0;

    this.notificacionService.crearNotificacion(
      "Subasta finalizada", 
      "Usted ha ganado la subasta por el lote " + this.lotes[this.indexLotes].id, 
      ganadorId, 
      true, 
      chatId
    ).subscribe({
      next: (notificacion) => console.log('Notificación creada:', notificacion),
      error: (error) => console.error('Error al crear notificación:', error)
    });

    this.notificacionService.crearNotificacion(
      "Subasta finalizada", 
      "Su lote " + this.lotes[this.indexLotes].id + " ha sido ganado por el usuario: " + ganadorId, 
      this.subasta?.casaremate.usuario_id || 0, 
      true, 
      chatId
    ).subscribe({
      next: (notificacion) => console.log('Notificación creada:', notificacion),
      error: (error) => console.error('Error al crear notificación:', error)
    });  }  private encontrarGanador(): number | null {
    console.log('🔍 BUSCANDO GANADOR...');
    
    // MÉTODO 1: Verificar en el array de ganadores primero
    const ganadorLote = this.ganadores[this.indexLotes];
    if (ganadorLote && ganadorLote.clienteId > 0) {
      console.log('🏆 ✅ Ganador encontrado en array ganadores:', ganadorLote.clienteId);
      return ganadorLote.clienteId;
    }
    
    console.log('🔍 Estado actual:', {
      totalPujas: this.pujas?.length || 0,
      pujaActual: this.pujaActual,
      ganadorActual: ganadorLote,
      usuarioActual: localStorage.getItem('usuario_id'),
      pujas: this.pujas?.map(p => ({ 
        id: p.id,
        monto: p.monto, 
        fecha: p.fechaHora,
        cliente: p.cliente,
        clienteUsuario: p.cliente?.usuario
      })) || []
    });

    if (!this.pujas || this.pujas.length === 0) {
      console.log('🏆 No hay pujas registradas, no hay ganador');
      return null;
    }

    // MÉTODO 2: Buscar en las pujas si no hay ganador registrado
    const pujaGanadora = this.pujas.reduce((maxPuja, pujaActual) => {
      if (pujaActual.monto > maxPuja.monto) {
        return pujaActual;
      } else if (pujaActual.monto === maxPuja.monto) {
        // En caso de empate, tomar la más reciente
        return new Date(pujaActual.fechaHora) > new Date(maxPuja.fechaHora) ? pujaActual : maxPuja;
      }
      return maxPuja;
    });

    console.log('🏆 Puja ganadora encontrada:', {
      monto: pujaGanadora.monto,
      fecha: pujaGanadora.fechaHora,
      cliente: pujaGanadora.cliente,
      clienteUsuario: pujaGanadora.cliente?.usuario,
      pujaActualRegistrada: this.pujaActual,
      coincidencia: pujaGanadora.monto === this.pujaActual
    });

    // MÉTODO 3: Usar cliente.usuario.id de la puja ganadora
    if (pujaGanadora.cliente?.usuario?.id) {
      const ganadorId = Number(pujaGanadora.cliente.usuario.id);
      console.log('🏆 ✅ Ganador identificado por cliente.usuario.id de la puja ganadora:', ganadorId);
      
      // Actualizar el array de ganadores con este resultado
      this.ganadores[this.indexLotes] = {
        numeroLote: this.lotes[this.indexLotes]?.id || (this.indexLotes + 1),
        clienteId: ganadorId,
        monto: pujaGanadora.monto
      };
      
      return ganadorId;
    }

    // MÉTODO 4: Buscar en todas las pujas del monto ganador
    const pujasGanadoras = this.pujas.filter(p => p.monto === pujaGanadora.monto);
    for (const puja of pujasGanadoras) {
      if (puja.cliente?.usuario?.id) {
        const ganadorId = Number(puja.cliente.usuario.id);
        console.log('🏆 ✅ Ganador encontrado en pujas del monto ganador:', ganadorId);
        
        // Actualizar el array de ganadores
        this.ganadores[this.indexLotes] = {
          numeroLote: this.lotes[this.indexLotes]?.id || (this.indexLotes + 1),
          clienteId: ganadorId,
          monto: Number(puja.monto)
        };
        
        return ganadorId;
      }
    }

    console.log('❌ No se pudo determinar el ganador de forma segura');
    console.log('🔍 Información de debugging:', {
      cliente: pujaGanadora.cliente,
      tieneUsuario: !!pujaGanadora.cliente?.usuario,
      usuarioId: pujaGanadora.cliente?.usuario?.id,
      usuarioActual: localStorage.getItem('usuario_id'),
      pujasGanadoras: pujasGanadoras.length,
      ganadores: this.ganadores
    });
    
    return null;
  }
  private esUsuarioGanador(ganadorId: number): boolean {
    const usuarioActual = localStorage.getItem('usuario_id');
    const result = usuarioActual !== null && Number(usuarioActual) === ganadorId;
    
    console.log('🎯 esUsuarioGanador verificación:', {
      ganadorId,
      usuarioActual,
      usuarioActualNumber: usuarioActual ? Number(usuarioActual) : null,
      esGanador: result
    });
    
    return result;
  }

  /**
   * Maneja el pago exitoso del ganador.
   * Después del pago, crea automáticamente una invitación de chat con la casa de remate.
   */
  async onPaymentSuccess(paymentData: any): Promise<void> {
    console.log('💰 PAGO EXITOSO:', paymentData);
    
    try {
      // PASO 1: Cerrar modal de pago
      this.pagando = false;
      
      // PASO 2: Obtener datos del ganador
      const usuarioActual = localStorage.getItem('usuario_id');
      const ganadorId = usuarioActual ? Number(usuarioActual) : (this.ganadores[this.indexLotes]?.clienteId || 0);
      const ganadorNombre = localStorage.getItem('usuario_nombre') || `Usuario ${ganadorId}`;
      
      if (!ganadorId || !this.subasta?.casaremate) {
        console.error('❌ No se puede crear chat: faltan datos del ganador o casa de remate');
        alert('Pago exitoso! Por favor contacte a la casa de remate para coordinar la entrega.');
        return;
      }
      
      console.log('🔄 Creando invitación de chat entre ganador y casa de remate:', {
        ganadorId,
        ganadorNombre,
        casaRemateId: this.subasta.casaremate.usuario_id,
        casaRemateNombre: this.subasta.casaremate.usuario?.nombre || 'Casa de Remate'
      });

      // PASO 3: Crear invitación de chat (como en testChatCreation)
      const chatResult = await this.chatService.crearInvitacionChat(
        ganadorId,
        ganadorNombre,
        this.subasta.casaremate.usuario_id || 0,
        this.subasta.casaremate.usuario?.nombre || 'Casa de Remate'
      );

      console.log('✅ Resultado de la invitación de chat:', chatResult);

      // PASO 4: Manejar resultado del chat
      if (chatResult.success) {
        this.chatRoomId = chatResult.chatId || `chat_${ganadorId}_${this.subasta.casaremate.usuario_id}`;
        this.chatCreado = true;
        
        console.log('🎉 Invitación de chat creada exitosamente:', {
          chatId: this.chatRoomId,
          message: chatResult.message
        });
        
        // Mostrar mensaje de éxito completo
        alert(`¡Pago exitoso por $${this.paypalMonto}! 
        
${chatResult.message}

La casa de remate recibirá una notificación y podrán chatear para coordinar la entrega del artículo.`);
        
      } else {
        console.warn('⚠️ No se pudo crear la invitación de chat:', chatResult.message);
        alert(`Pago exitoso por $${this.paypalMonto}!

Hubo un problema al crear la invitación de chat: ${chatResult.message}

Por favor contacte directamente a la casa de remate para coordinar la entrega.`);
      }
      
    } catch (error) {
      console.error('❌ Error al procesar post-pago:', error);
      const errorMessage = error && typeof error === 'object' && 'error' in error 
        ? (error as any).error?.message || (error as any).message 
        : 'Error desconocido';
        
      alert(`Pago exitoso por $${this.paypalMonto}!

Hubo un error al crear la invitación de chat: ${errorMessage}

Por favor contacte directamente a la casa de remate para coordinar la entrega.`);
    }
  }

  onPaymentError(error: any): void {
    console.error('❌ Error en el pago:', error);
    alert('Error en el pago. Por favor, intente nuevamente.');
  }

  abrirChatEnNuevaPestana(): void {
    if (this.chatRoomId) {
      const chatUrl = `/chat/${this.chatRoomId}`;
      window.open(chatUrl, '_blank');
    } else {
      alert('Chat no disponible. Contacte al soporte.');
    }
  }

  /**
   * Reabre el modal de pago cuando el usuario ya ganó lotes
   */
  reabrirModalPago(): void {
    if (this.lotesGanadosPorUsuario.length > 0) {
      this.paypalMonto = this.montoTotalGanador; // Usar monto total
      this.paypalComponentKey = !this.paypalComponentKey; // Toggle para recrear componente
      this.pagando = true;
      console.log('💰 Modal de pago reabierto con monto total:', this.paypalMonto);
    } else {
      console.warn('⚠️ Usuario no tiene lotes ganados para mostrar modal de pago');
      alert('No tienes lotes ganados para proceder al pago.');
    }
  }

  // Métodos de verificación automática
  /**
   * Verifica si la subasta debe iniciarse automáticamente según la fecha y hora configuradas.
   * Configura verificaciones periódicas si la subasta está programada para el futuro.
   */
  private verificarInicioAutomaticoSubasta(): void {
    console.log('🔍 INICIO DE VERIFICACIÓN AUTOMÁTICA');
    
    if (!this.subasta || !this.subasta.fecha || !this.subasta.duracionMinutos) {
      console.warn('❌ No se puede verificar inicio automático: datos de subasta incompletos');
      return;
    }

    const fechaSubasta = this.parsearFechaSubasta(this.subasta.fecha);
    if (!fechaSubasta) {
      console.error('❌ No se pudo parsear la fecha de la subasta:', this.subasta.fecha);
      return;
    }
    
    const ahora = new Date();
    const diferenciaMilisegundos = fechaSubasta.getTime() - ahora.getTime();
    
    console.log('🕐 Verificando inicio automático:', {
      fechaSubasta: fechaSubasta.toLocaleString(),
      ahora: ahora.toLocaleString(),
      debeIniciar: fechaSubasta <= ahora,
      activa: this.subasta.activa
    });

    if (this.subasta.activa) {
      console.log('✅ Subasta ya está activa, manejando timer existente');
      this.manejarSubastaActiva(fechaSubasta, ahora);
      return;
    }

    if (fechaSubasta <= ahora) {
      console.log('🚀 La hora de la subasta ha llegado, iniciando automáticamente');
      this.iniciarSubastaAutomaticamente();
      return;
    }

    this.configurarVerificacionPeriodica(fechaSubasta);
  }

  /**
   * Maneja subastas que ya están activas al cargar el componente.
   * Calcula el tiempo restante y reinicia el timer si es necesario.
   */
  private manejarSubastaActiva(fechaSubasta: Date, ahora: Date): void {
    if (!this.timerInitialized) {
      this.timerInitialized = true;
      
      const tiempoTranscurridoMs = ahora.getTime() - fechaSubasta.getTime();
      const tiempoTranscurridoSegundos = Math.floor(tiempoTranscurridoMs / 1000);
      const duracionTotalSegundos = this.subasta!.duracionMinutos! * 60;
      const tiempoRestante = Math.max(0, duracionTotalSegundos - tiempoTranscurridoSegundos);

      if (tiempoRestante > 0) {
        this.timerState.timer = this.formatearTiempo(tiempoRestante);
        this.timerState.tiempoRestanteSegundos = tiempoRestante;
        this.timerState.timerActivo = true;
        
        if (this.isRematador()) {
          this.inicializarTimerWebSocket(tiempoRestante);
        }
      } else {
        this.timerState.timer = TIMER_CONSTANTS.FINISHED_MESSAGE;
        this.timerState.timerActivo = false;
      }
    }
  }

  /**
   * Configura verificaciones periódicas para iniciar la subasta automáticamente
   * cuando llegue la fecha y hora programadas.
   */
  private configurarVerificacionPeriodica(fechaSubasta: Date): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.timerState.timer = "Esperando inicio";
    this.timerState.timerActivo = false;
    
    console.log('⏰ Configurando verificación cada 5 segundos para inicio automático');
    
    this.intervalId = setInterval(() => {
      const ahora = new Date();
      const diferenciaMs = fechaSubasta.getTime() - ahora.getTime();
      
      console.log('🕐 Verificando inicio:', {
        diferencia: Math.floor(diferenciaMs / 1000),
        fechaSubasta: fechaSubasta.toLocaleString(),
        ahora: ahora.toLocaleString()
      });
      
      if (diferenciaMs <= 0) {
        console.log('🚀 ¡Hora de inicio alcanzada! Iniciando subasta automáticamente');
        this.iniciarSubastaAutomaticamente();
        clearInterval(this.intervalId);
      }
    }, 5000); // Verificar cada 5 segundos
  }

  /**
   * Inicia la subasta automáticamente cuando llega la fecha programada.
   * Calcula el tiempo restante y activa el timer correspondiente.
   */
  private iniciarSubastaAutomaticamente(): void {
    console.log('🚀 INICIANDO SUBASTA AUTOMÁTICAMENTE');
    
    if (this.subasta) {
      this.subasta.activa = true;
      this.boton = true;
      this.timerInitialized = true;

      const ahora = new Date();
      const fechaSubasta = this.parsearFechaSubasta(this.subasta.fecha);
      const tiempoRestanteMs = fechaSubasta!.getTime() + this.subasta.duracionMinutos! * 60000 - ahora.getTime();
      const tiempoRestanteSegundos = Math.max(0, Math.ceil(tiempoRestanteMs / 1000));

      console.log('⏰ Calculando tiempo restante:', {
        fechaSubasta: fechaSubasta!.toLocaleString(),
        ahora: ahora.toLocaleString(),
        duracionMinutos: this.subasta.duracionMinutos,
        tiempoRestanteSegundos
      });

      this.timerState.tiempoRestanteSegundos = tiempoRestanteSegundos;
      this.timerState.timer = this.formatearTiempo(tiempoRestanteSegundos);
      this.timerState.timerActivo = true;

      if (tiempoRestanteSegundos > 0) {
        this.inicializarTimerWebSocket(tiempoRestanteSegundos);
        console.log('🎯 Subasta ACTIVA - Los usuarios YA PUEDEN PUJAR');
      } else {
        console.log('⏰ Tiempo agotado - Finalizando subasta automáticamente');
        this.timerState.timer = TIMER_CONSTANTS.FINISHED_MESSAGE;
        this.timerState.timerActivo = false;
        this.finalizarSubastaPorTiempo();
      }
      
      // Forzar actualización de la interfaz
      this.cdr.detectChanges();
    }
  }

  /**
   * Se ejecuta al conectar al WebSocket
   * Configura el timer display interval para actualizar la UI
   */
  onWebSocketConnect(): void {
    console.log('WebSocket conectado correctamente');
    this.startTimerDisplayInterval();
  }

  /**
   * Se ejecuta al desconectar del WebSocket
   */
  onWebSocketDisconnect(): void {
    console.log('WebSocket desconectado');
    this.stopTimerDisplayInterval();
  }

  /**
   * Inicia el interval para actualizar la UI del timer cada segundo
   */
  private startTimerDisplayInterval(): void {
    this.stopTimerDisplayInterval(); // Limpiar interval previo
    
   
    
    console.log('🔄 Iniciando timer display interval');
    
    this.timerDisplayInterval = setInterval(() => {
      if (this.timerState.timerActivo && this.timerState.tiempoRestanteSegundos !== undefined) {
        if (this.timerState.tiempoRestanteSegundos > 0) {
          this.timerState.tiempoRestanteSegundos--;
          this.timerState.timer = this.formatearTiempo(this.timerState.tiempoRestanteSegundos);
        } else {
          this.timerState.timer = TIMER_CONSTANTS.FINISHED_MESSAGE;
          this.timerState.timerActivo = false;
        }
        this.cdr.detectChanges();
      }
    }, 1000);
    
    console.log('✅ Timer display interval iniciado');
  }

  /**
   * Detiene el interval del timer display
   */
  private stopTimerDisplayInterval(): void {
    if (this.timerDisplayInterval) {
      clearInterval(this.timerDisplayInterval);
      this.timerDisplayInterval = null;
      console.log('🛑 Timer display interval detenido');
    }
  }

  /**
   * Inicializa el array de ganadores con el tamaño correcto (uno por lote)
   */
  private initializarArrayGanadores(): void {
    this.ganadores = this.lotes.map((lote, index) => ({
      numeroLote: lote.id || (index + 1),
      clienteId: 0,
      monto: 0
    }));
    
    console.log('🎯 Array de ganadores inicializado:', {
      totalLotes: this.lotes.length,
      totalGanadores: this.ganadores.length,
      ganadores: this.ganadores.map((g, i) => ({
        index: i,
        numeroLote: g.numeroLote,
        loteReal: this.lotes[i]?.id
      }))
    });
  }

  /**
   * Sincroniza el array de ganadores basándose en las pujas reales de TODOS los lotes.
   * Este método debe llamarse al final de la subasta para asegurar que el array ganadores
   * refleje correctamente quién ganó cada lote.
   */
  private sincronizarGanadoresCompleto(): void {
    console.log('🔄 SINCRONIZANDO GANADORES DE TODOS LOS LOTES...');
    
    this.lotes.forEach((lote, index) => {
      const pujasLote = (lote.pujas as pujaDto[]) || [];
      
      if (pujasLote.length > 0) {
        // Encontrar la puja ganadora (mayor monto, y en caso de empate, la más reciente)
        const pujaGanadora = pujasLote.reduce((maxPuja, pujaActual) => {
          if (pujaActual.monto > maxPuja.monto) {
            return pujaActual;
          } else if (pujaActual.monto === maxPuja.monto) {
            return new Date(pujaActual.fechaHora) > new Date(maxPuja.fechaHora) ? pujaActual : maxPuja;
          }
          return maxPuja;
        });
        
        // Obtener el ID del ganador
        let ganadorId = 0;
        if (pujaGanadora.cliente?.usuario?.id) {
          ganadorId = Number(pujaGanadora.cliente.usuario.id);
        }
        
        // Actualizar el array ganadores
        if (!this.ganadores[index]) {
          this.ganadores[index] = {
            numeroLote: lote.id || (index + 1),
            clienteId: ganadorId,
            monto: Number(pujaGanadora.monto)
          };
        } else {
          this.ganadores[index].clienteId = ganadorId;
          this.ganadores[index].monto = Number(pujaGanadora.monto);
          this.ganadores[index].numeroLote = lote.id || (index + 1);
        }
        
        console.log(`🏆 Lote ${index} (ID: ${lote.id}) - Ganador: ${ganadorId}, Monto: $${pujaGanadora.monto}`);
      } else {
        // No hay pujas en este lote
        if (!this.ganadores[index]) {
          this.ganadores[index] = {
            numeroLote: lote.id || (index + 1),
            clienteId: 0,
            monto: 0
          };
        } else {
          this.ganadores[index].clienteId = 0;
          this.ganadores[index].monto = 0;
        }
        
        console.log(`📭 Lote ${index} (ID: ${lote.id}) - Sin pujas`);
      }
    });
    
    console.log('✅ SINCRONIZACIÓN COMPLETA:', {
      totalLotes: this.lotes.length,
      ganadoresArray: this.ganadores,
      usuarioActual: localStorage.getItem('usuario_id'),
      lotesGanadosPorUsuario: this.lotesGanadosPorUsuario.length
    });
  }

}
