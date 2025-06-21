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
import { takeWhile } from 'rxjs/operators'; 
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
  timerSubscription?: Subscription;
  tiempoRestanteSegundos?: number;
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
  
  // Propiedades para el chat
  chatCreado: boolean = false;
  chatRoomId: string = '';
  
  public timerState: TimerState = {
    timer: "Sin iniciar",
    timerActivo: false,
    tiempoRestanteSegundos: 0
  };
  
  private subastaSubscription?: Subscription;
  private timerInitialized: boolean = false;
  private websocketSubscriptions: Subscription[] = [];
  boton: boolean = false;

  pujaActual: number = 0;
  pujaRapida: number | null = null;
  pujaComun: number | null = null;
  clienteID: number | null = null;
  clienteMail: string | null = null;

  // Variables para control de inicio automático
  private intervalId: any;
  private subastaFechaVerificada: boolean = false;

  // Variables para modal y pago
  modalVideo: boolean = false;
  video: string = '';
  pagando: boolean = false;
  paypalMonto: number = 0;

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
    return !!(this.subasta?.activa && this.timerState.timerActivo);
  }

  /**
   * Getter que indica si el usuario actual es el ganador de la subasta
   */
  get esGanador(): boolean {
    if (!this.subasta || this.subasta.activa || this.timerState.timerActivo) {
      return false; // La subasta no ha terminado
    }
    
    const ganadorId = this.encontrarGanador();
    return ganadorId !== null && this.esUsuarioGanador(ganadorId);
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
        this.clienteID || 0,
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
   * Valida si la subasta debe estar activa según la hora actual y la duración
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
        const tiempoRestante = Math.max(0, duracionTotalSegundos - tiempoTranscurridoSegundos);
        
        if (tiempoRestante > 0) {
          this.timerInitialized = true;
          this.timerState.tiempoRestanteSegundos = tiempoRestante;
          this.timerState.timer = this.formatearTiempo(tiempoRestante);
          this.timerState.timerActivo = true;
          
          if (this.isRematador()) {
            this.iniciarTimer(tiempoRestante);
          }
        } else {
          // La subasta ya debería haber terminado
          this.timerState.timer = TIMER_CONSTANTS.FINISHED_MESSAGE;
          this.timerState.timerActivo = false;
        }
      }
    } else {
      // Después de la subasta
      this.subasta.activa = false;
      this.boton = false;
      this.timerState.timer = TIMER_CONSTANTS.FINISHED_MESSAGE;
      this.timerState.timerActivo = false;
      console.log('🏁 Subasta finalizada');
    }
  }
  /**
   * Exponer métodos de testing en window para debugging
   */
  private exposeTestingMethods(): void {
    (window as any).streamDebug = {
      getAuctionInfo: () => this.getAuctionInfo(),
      getTimerStatus: () => this.getTimerStatus(),
      forceRestartTimer: () => this.forceRestartTimer(),
      forceSyncWithBackend: () => this.forceSyncWithBackend(),
      testAuctionEnd: () => this.testAuctionEnd(),
      checkBackendStatus: () => this.checkBackendStatus(),
      getFullDebugInfo: () => this.getFullDebugInfo(),      validarEstado: () => this.validarEstadoSubasta(),
      testWinnerPayment: () => this.testWinnerPayment(),
      checkWinner: () => this.checkWinner(),
      testChatCreation: () => this.testChatCreation(),
      testNotifications: () => this.testNotifications(),
      testCompletePaymentFlow: () => this.testCompletePaymentFlow(),
      forceValidateAuctionState: () => this.forceValidateAuctionState(),
      testAutoStart: () => this.testAutoStart(),
      testTimerSync: () => this.testTimerSync(),
      testWebSocketConnection: () => this.testWebSocketConnection()    };
    console.log('%c[streamDebug] Métodos de testing disponibles en window.streamDebug', 'color: #1976d2; font-weight: bold;');
    console.log('%c[streamDebug] Nuevos métodos: testChatCreation, testNotifications, testCompletePaymentFlow', 'color: #4caf50; font-weight: bold;');
    console.log('%c[streamDebug] Para debugging de timer: forceValidateAuctionState, testAutoStart', 'color: #ff9800; font-weight: bold;');
  }

  // Métodos de testing y debugging
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
      tieneSubscripcion: !!this.timerState.timerSubscription,
      timer: this.timerState.timer,
      tiempoRestanteSegundos: this.timerState.tiempoRestanteSegundos,
      displayText: this.timerDisplayText,
      cssClass: this.timerCssClass,
      esRematador: this.isRematador(),
      intervalId: this.intervalId
    };
  }

  public forceRestartTimer() {
    console.log('🧪 [TEST] Forzando reinicio del timer');
    this.detenerTimer();
    
    setTimeout(() => {
      if (this.subasta?.activa && this.subasta?.duracionMinutos) {
        const tiempoRestante = this.timerState.tiempoRestanteSegundos || (this.subasta.duracionMinutos * 60);
        this.iniciarTimer(tiempoRestante);
      }
    }, 100);
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

  public testAuctionEnd() {
    console.log('🧪 [TEST] Simulando finalización de subasta');
    console.log('🧪 [TEST] Estado antes:', this.getTimerStatus());
    
    this.timerState.timer = TIMER_CONSTANTS.FINISHED_MESSAGE;
    this.timerState.tiempoRestanteSegundos = 0;
    this.timerState.timerActivo = false;
    this.detenerTimer();
    
    this.manejarFinalizacionSubasta();
    
    console.log('🧪 [TEST] Estado después:', this.getTimerStatus());
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

  public getFullDebugInfo() {
    return {
      subasta: {
        id: this.subasta?.id,
        activa: this.subasta?.activa,
        fecha: this.subasta?.fecha,
        fechaParseada: this.subasta?.fecha ? this.parsearFechaSubasta(this.subasta.fecha) : null,
        duracionMinutos: this.subasta?.duracionMinutos
      },
      timer: this.getTimerStatus(),
      usuario: {
        esRematador: this.isRematador(),
        userId: localStorage.getItem('usuario_id'),
        casaRematId: localStorage.getItem('casaremate_id')
      },
      websocket: {
        subscripciones: this.websocketSubscriptions.length,
        chatCreado: this.chatCreado,
        chatRoomId: this.chatRoomId
      },
      otros: {
        intervalId: !!this.intervalId,
        subastaFechaVerificada: this.subastaFechaVerificada,
        timerInitialized: this.timerInitialized,
        indexLotes: this.indexLotes,
        pujaActual: this.pujaActual
      }
    };
  }

  public testWinnerPayment() {
    console.log('🧪 [TEST] Simulando ganador y pago');
    const userId = localStorage.getItem('usuario_id');
    if (!userId) {
      console.error('❌ Usuario no está logueado');
      return;
    }
    
    // Simular que el usuario actual hizo la puja más alta
    this.clienteID = Number(userId);
    this.pujaActual = 1000; // Simular puja alta
    
    // Simular finalización de subasta
    this.timerState.timer = TIMER_CONSTANTS.FINISHED_MESSAGE;
    this.timerState.timerActivo = false;
    this.subasta!.activa = false;
    
    // Ejecutar lógica de finalización
    this.manejarFinalizacionSubasta();
    
    console.log('🧪 [TEST] Estado después:', {
      esGanador: this.esGanador,
      pagando: this.pagando,
      paypalMonto: this.paypalMonto
    });
  }

  public checkWinner() {
    const ganadorId = this.encontrarGanador();
    const esGanador = ganadorId && this.esUsuarioGanador(ganadorId);
    
    console.log('🏆 [TEST] Información del ganador:', {
      ganadorId: ganadorId,
      usuarioActual: localStorage.getItem('usuario_id'),
      clienteID: this.clienteID,
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
      console.warn('No hay videoId válido configurado para el stream');
      this.videoUrl = null; 
      return;
    }
    
    const cleanVideoId = videoId.trim();
    
    const embedUrl = `https://www.youtube.com/embed/${cleanVideoId}?` +
      'mute=1&' +          
      'controls=1&' +       
      'rel=0&' +           
      'modestbranding=1&' + 
      'iv_load_policy=3';  
      
    this.videoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);

    if(this.subasta?.videoId == null || this.subasta?.videoId.trim() !== cleanVideoId){
      this.subasta!.videoId = cleanVideoId;
      this.subastaService.updateSubasta(this.subasta!).subscribe({
        next: () => {
          console.log('Subasta actualizada con el nuevo video');
        },
        error: (err) => {
          console.error('Error al actualizar subasta con el nuevo video:', err);
        }
      });
    }
  }

  // Métodos de navegación de lotes
  anteriorLote(): void {
    if (!this.subasta?.activa) {
      console.warn('No se puede cambiar de lote: la subasta no está activa');
      return;
    }

    if (this.indexLotes > 0 && this.subasta) {
      this.indexLotes--;
      this.subasta.loteIndex = this.indexLotes;
      this.umbralSuperado = false; 
      this.subastaService.updateSubasta(this.subasta).subscribe({
        next: () => {
          console.log('Subasta actualizada con el lote anterior');
          this.cargarPujas(this.indexLotes);
          this.sendLoteChangeToWebSocket();
        },
        error: (err) => {
          console.error('Error al actualizar subasta con el lote anterior:', err);
          this.indexLotes++;
          if (this.subasta) this.subasta.loteIndex = this.indexLotes;
        }
      });
    }
  }

  siguienteLote(): void {
    if (!this.subasta?.activa) {
      console.warn('No se puede cambiar de lote: la subasta no está activa');
      return;
    }

    if (this.indexLotes < this.lotes.length - 1 && this.subasta) {
      this.indexLotes++;
      this.subasta.loteIndex = this.indexLotes;
      this.umbralSuperado = false;
      this.subastaService.updateSubasta(this.subasta).subscribe({
        next: () => {
          console.log('Subasta actualizada con el siguiente lote');
          this.cargarPujas(this.indexLotes);
          this.sendLoteChangeToWebSocket();
        },
        error: (err) => {
          console.error('Error al actualizar subasta con el siguiente lote:', err);
          this.indexLotes--;
          if (this.subasta) this.subasta.loteIndex = this.indexLotes;
        }
      });
    }
  }

  cargarPujas(loteIndex: number): void {
    if (loteIndex < 0 || loteIndex >= this.lotes.length) {
      console.warn('Índice de lote fuera de rango:', loteIndex);
      return;
    }

    this.pujas = (this.lotes[loteIndex]?.pujas as pujaDto[]) || [];
    this.pujaActual = Number(this.pujas.length > 0 ? Math.max(...this.pujas.map(p => p.monto)) : 0);
    if (this.pujaActual === 0) {
      this.pujaActual = Number(this.lotes[loteIndex].pujaMinima);
    }
    this.pujaRapida = Number(this.pujaActual) + 1;
    this.pujaComun = null;
  }

  // Métodos de timer
  iniciarTimer(tiempoInicialSegundos?: number) {
    if (this.timerState.timerActivo) {
      console.warn('⚠️ Timer ya está activo, ignorando nueva inicialización');
      return;
    }

    this.detenerTimer();

    if (!this.subasta?.duracionMinutos) {
      console.warn('No hay duración de subasta definida');
      return;
    }

    let tiempoRestanteSegundos = tiempoInicialSegundos ?? (this.subasta.duracionMinutos * 60);
    this.timerState.tiempoRestanteSegundos = tiempoRestanteSegundos;

    console.log('Iniciando timer con tiempo restante:', tiempoRestanteSegundos, 'segundos');

    this.timerState.timerActivo = true;
    this.timerState.timer = this.formatearTiempo(tiempoRestanteSegundos);

    const esRematador = this.isRematador();
    console.log('🔍 Es rematador?', esRematador);    if (esRematador) {
      // REMATADOR: Ejecuta el timer maestro
      console.log('🔥 REMATADOR: Iniciando timer maestro');
      let websocketUpdateCounter = 0;
      
      this.timerState.timerSubscription = interval(TIMER_CONSTANTS.INTERVAL_MS).pipe(
        takeWhile(() => this.timerState.timerActivo)
      ).subscribe({
        next: () => {
          try {
            if (this.timerState.tiempoRestanteSegundos! > 0) {
              this.timerState.tiempoRestanteSegundos!--;
              this.timerState.timer = this.formatearTiempo(this.timerState.tiempoRestanteSegundos!);
              
              // Enviar actualización al WebSocket cada 2 segundos para reducir la carga
              websocketUpdateCounter++;
              if (websocketUpdateCounter >= 2 || this.timerState.tiempoRestanteSegundos! <= 10) {
                this.sendTimerUpdateToWebSocket(this.timerState.tiempoRestanteSegundos!);
                websocketUpdateCounter = 0;
              }
            } else {
              console.log('🔥 REMATADOR: Timer terminado, finalizando subasta');
              this.timerState.timer = TIMER_CONSTANTS.FINISHED_MESSAGE;
              this.timerState.tiempoRestanteSegundos = 0;
              
              this.sendTimerUpdateToWebSocket(0);
              this.manejarFinalizacionSubasta();
              this.detenerTimer();
            }
          } catch (error) {
            console.error('🔥 REMATADOR: Error en timer:', error);
            this.detenerTimer();
          }
        },
        error: (error) => {
          console.error('Error en suscripción del timer:', error);
          this.detenerTimer();
        }
      });    } else {
      // USUARIOS: Ejecutan su propio timer de visualización, sincronizado con WebSocket
      console.log('👀 Usuario: Iniciando timer de visualización sincronizado');
      this.timerState.timerSubscription = interval(TIMER_CONSTANTS.INTERVAL_MS).pipe(
        takeWhile(() => this.timerState.timerActivo)
      ).subscribe({
        next: () => {
          try {
            if (this.timerState.tiempoRestanteSegundos! > 0) {
              this.timerState.tiempoRestanteSegundos!--;
              this.timerState.timer = this.formatearTiempo(this.timerState.tiempoRestanteSegundos!);
            } else {
              console.log('👀 Usuario: Timer de visualización terminado');
              this.timerState.timer = TIMER_CONSTANTS.FINISHED_MESSAGE;
              this.timerState.tiempoRestanteSegundos = 0;
              this.timerState.timerActivo = false;
              this.detenerTimer();
              this.manejarFinalizacionSubasta();
            }
          } catch (error) {
            console.error('👀 Usuario: Error en timer de visualización:', error);
            this.detenerTimer();
          }
        },
        error: (error) => {
          console.error('Error en suscripción del timer de usuario:', error);
          this.detenerTimer();
        }
      });
    }
  }

  detenerTimer(): void {
    console.log('🛑 Deteniendo timer');
    
    this.timerState.timerActivo = false;
    if (this.timerState.timerSubscription) {
      this.timerState.timerSubscription.unsubscribe();
      this.timerState.timerSubscription = undefined;
    }
  }

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
    });
  }

  // Métodos de pujas
  private validarPuja(monto: number | null): { valida: boolean; error?: string } {
    if (!this.timerState.timerActivo){
      return { valida: false, error: 'La subasta no está activa' };
    }

    if (!monto || monto <= 0) {
      return { valida: false, error: 'El monto debe ser mayor a 0' };
    }

    const loteActual = this.lotes[this.indexLotes];
    if (!loteActual) {
      return { valida: false, error: 'No hay lote seleccionado' };
    }

    if (monto < loteActual.pujaMinima) {
      return { valida: false, error: `El monto debe ser mayor a ${loteActual.pujaMinima}` };
    }

    if (monto < this.pujaActual) {
      return { valida: false, error: `El monto debe ser mayor a la puja actual de ${this.pujaActual}` };
    }

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
      console.error('Error de validación:', validacion.error);
      return;
    }

    const puja = this.crearPujaBase(this.pujaRapida!);
    this.enviarPuja(puja);
  }

  crearPujaComun(): void {
    const validacion = this.validarPuja(this.pujaComun);
    
    if (!validacion.valida) {
      console.error('Error de validación:', validacion.error);
      return;
    }

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

        this.clienteID = puja.cliente_id;

        this.pujaService.crearPuja(puja).subscribe({
          next: (data) => {
            console.log('Puja creada exitosamente en BD:', data);

            this.pujaActual = data.monto;
            this.pujaRapida = data.monto + 1;
            this.pujaComun = null;

            const nuevaPuja: pujaDto = {
              id: data.id,
              fechaHora: new Date(data.fechaHora),
              monto: data.monto,
              lote: this.lotes[this.indexLotes],
              factura: null as any,
              cliente: null as any
            };
            this.pujas.push(nuevaPuja);

            this.sendWebSocketBid(puja);

            if (this.lotes[this.indexLotes].umbral < data.monto && !this.umbralSuperado) {
              this.umbralSuperado = true;
              this.enviarNotificacionUmbral(data.monto);
            }

            this.actualizarDatosSinSobrescribir();
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
  }

  private actualizarDatosSinSobrescribir(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    
    this.subastaService.getSubasta(id).subscribe({
      next: (data) => {
        this.subasta = data;
        this.lotes = (this.subasta.lotes || []).map(lote => ({
          ...lote,
          subasta: {
            id: this.subasta!.id,
            fecha: this.subasta!.fecha,
            duracionMinutos: this.subasta!.duracionMinutos,
            nombre: this.subasta!.nombre
          }
        }));
        
        const loteIndex = this.indexLotes;
        if (loteIndex >= 0 && loteIndex < this.lotes.length) {
          this.pujas = (this.lotes[loteIndex]?.pujas as pujaDto[]) || [];
        }
      },
      error: (err) => {
        console.error('Error al actualizar datos:', err);
      }
    });
  }

  // Métodos WebSocket
  private setupWebSocketConnection(): void {
    if (!this.subasta?.id) return;

    setTimeout(() => {
      this.websocketService.joinAuction(
        this.subasta!.id!,
        this.clienteID || 999,
        'TestUser'
      );
    }, 1000);

    const auctionJoinedSubscription = this.websocketService.onAuctionJoined().subscribe({
      next: (data) => console.log('✅ Confirmación: Te uniste a la subasta', data.auctionId)
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
    if (bidData.loteId !== this.lotes[this.indexLotes]?.id) return;

    if (bidData.bidAmount > this.pujaActual) {
      this.pujaActual = bidData.bidAmount;
      this.pujaRapida = bidData.bidAmount + 1;

      const nuevaPuja: pujaDto = {
        id: Date.now(),
        fechaHora: new Date(bidData.timestamp),
        monto: bidData.bidAmount,
        lote: this.lotes[this.indexLotes],
        factura: null as any,
        cliente: null as any
      };

      this.pujas.push(nuevaPuja);

      if (this.lotes[this.indexLotes].umbral < bidData.bidAmount && !this.umbralSuperado) {
        this.umbralSuperado = true;
      }
    }
  }

  private handleLoteUpdateFromWebSocket(loteData: any): void {
    if (loteData.newLoteIndex !== this.indexLotes) {
      this.indexLotes = loteData.newLoteIndex;
      this.cargarPujas(this.indexLotes);
      this.umbralSuperado = false;
    }
  }  private handleTimerUpdateFromWebSocket(timerData: any): void {
    console.log('🔍 Timer update recibido por WebSocket:', timerData);

    if (timerData.tiempoRestante !== undefined) {
      const nuevoTiempo = timerData.tiempoRestante;
      
      // Solo procesar si no soy el rematador (el rematador maneja su propio timer)
      if (!this.isRematador()) {
        console.log('👀 Usuario: Sincronizando timer desde rematador:', nuevoTiempo);
        
        // Calcular diferencia para detectar desfases significativos
        const diferencia = Math.abs((this.timerState.tiempoRestanteSegundos || 0) - nuevoTiempo);
        
        // Si hay una diferencia significativa (>3 segundos), sincronizar inmediatamente
        if (diferencia > 3 || !this.timerState.timerActivo) {
          console.log(`👀 Usuario: Sincronización forzada (diferencia: ${diferencia}s)`);
          this.timerState.tiempoRestanteSegundos = nuevoTiempo;
          this.timerState.timer = this.formatearTiempo(nuevoTiempo);
          
          if (nuevoTiempo > 0 && !this.timerState.timerActivo) {
            this.timerState.timerActivo = true;
          }
        }

        if (nuevoTiempo <= 0) {
          this.timerState.timer = TIMER_CONSTANTS.FINISHED_MESSAGE;
          this.timerState.tiempoRestanteSegundos = 0;
          this.timerState.timerActivo = false;
          this.detenerTimer();
          
          console.log('👀 Usuario: Timer terminado, manejando finalización');
          this.manejarFinalizacionSubasta();
        }

        // Forzar detección de cambios para actualizar la UI
        this.cdr.detectChanges();
      } else {
        console.log('🔥 Rematador: Ignorando actualización del WebSocket (uso mi propio timer)');
      }
    }
  }

  private sendWebSocketBid(puja: PujaRequest): void {
    if (!this.subasta?.id) return;

    this.websocketService.sendBid(
      this.subasta.id,
      this.clienteID || 999,
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
  }

  private sendTimerUpdateToWebSocket(tiempoRestanteSegundos: number): void {
    if (!this.subasta?.id) return;

    this.websocketService.sendTimerUpdate(
      this.subasta.id,
      tiempoRestanteSegundos
    );
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
  }

  // Métodos de finalización y pago
  private manejarFinalizacionSubasta(): void {
    console.log('🏁 Finalizando subasta - Rol:', this.isRematador() ? 'REMATADOR' : 'USUARIO');
    
    // TODOS los usuarios verifican si son ganadores al finalizar la subasta
    const ganadorId = this.encontrarGanador();
    console.log('🏆 Ganador encontrado:', ganadorId, '- Usuario actual:', localStorage.getItem('usuario_id'));
    
    // Si este usuario es el ganador, mostrar PayPal (solo después de que la subasta termine)
    if (ganadorId && this.esUsuarioGanador(ganadorId) && !this.subasta?.activa && !this.timerState.timerActivo) {
      console.log('🎉 ¡Eres el ganador! Mostrando modal de pago');
      this.paypalMonto = this.pujaActual;
      this.pagando = true;
    } else if (ganadorId && this.esUsuarioGanador(ganadorId)) {
      console.log('🏆 Eres el ganador, pero la subasta aún no ha terminado completamente');
    } else {
      console.log('👀 No eres el ganador o no hay ganador determinado');
    }
    
    // Solo el rematador maneja notificaciones y actualización del backend
    if (this.isRematador()) {
      if (ganadorId) {
        this.enviarNotificacionesFinalizacion(ganadorId);
      }
      
      if (this.subasta && this.subasta.activa) {
        console.log('🏁 REMATADOR: Actualizando estado de subasta en backend');
        this.subasta.activa = false;
        this.boton = false;
        
        this.subastaService.updateSubasta(this.subasta).subscribe({
          next: () => console.log('✅ REMATADOR: Subasta marcada como finalizada en la base de datos'),
          error: (err) => console.error('❌ REMATADOR: Error al finalizar subasta en la base de datos:', err)
        });
      }
    } else {
      console.log('👀 USUARIO: Finalizando subasta localmente (sin actualizar backend)');
      if (this.subasta) {
        this.subasta.activa = false;
        this.boton = false;
      }
    }
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
    });
  }  private encontrarGanador(): number | null {
    if (!this.pujas || this.pujas.length === 0) {
      console.log('🏆 No hay pujas, no hay ganador');
      return null;
    }

    // Encontrar la puja con el monto más alto
    const pujaGanadora = this.pujas.reduce((maxPuja, pujaActual) => {
      return pujaActual.monto > maxPuja.monto ? pujaActual : maxPuja;
    });

    console.log('🏆 Puja ganadora encontrada:', {
      monto: pujaGanadora.monto,
      pujaActual: this.pujaActual,
      clienteID: this.clienteID,
      totalPujas: this.pujas.length
    });

    // Verificar si la puja ganadora corresponde al monto actual Y el usuario actual hizo la última puja
    if (pujaGanadora.monto === this.pujaActual) {
      const usuarioActualId = localStorage.getItem('usuario_id');
      
      // Priorizar clienteID si está disponible y coincide con el usuario actual
      if (this.clienteID && this.clienteID > 0 && usuarioActualId && Number(usuarioActualId) === this.clienteID) {
        console.log('🏆 Ganador confirmado por clienteID:', this.clienteID);
        return this.clienteID;
      }
      
      // Fallback: verificar si el usuario actual es el mismo que tiene la sesión
      if (usuarioActualId) {
        const userId = Number(usuarioActualId);
        console.log('🏆 Verificando ganador por localStorage:', userId);
        return userId;
      }
    }

    console.log('🏆 No se pudo identificar al ganador o el usuario actual no es el ganador');
    return null;
  }

  private esUsuarioGanador(ganadorId: number): boolean {
    const usuarioActual = localStorage.getItem('usuario_id');
    return usuarioActual !== null && Number(usuarioActual) === ganadorId;
  }
  async onPaymentSuccess(paymentData: any): Promise<void> {
    console.log('💰 Pago exitoso:', paymentData);
    
    try {
      this.pagando = false;
      
      const ganadorId = Number(localStorage.getItem('usuario_id')) || this.clienteID;
      const ganadorNombre = localStorage.getItem('usuario_nombre') || `Usuario ${ganadorId}`;
      
      if (ganadorId && this.subasta?.casaremate && this.subasta.id) {
        console.log('🔄 Creando chat entre ganador y casa de remate:', {
          ganadorId,
          ganadorNombre,
          casaRemateId: this.subasta.casaremate.usuario_id,
          casaRemateNombre: this.subasta.casaremate.usuario?.nombre
        });

        const chatResult = await this.chatService.crearInvitacionChat(
          ganadorId,
          ganadorNombre,
          this.subasta.casaremate.usuario_id || 0,
          this.subasta.casaremate.usuario?.nombre || 'Casa de Remate'
        );

        console.log('✅ Resultado del chat:', chatResult);

        if (chatResult.success) {
          this.chatRoomId = chatResult.chatId || `chat_${ganadorId}_${this.subasta.casaremate.usuario_id}`;
          this.chatCreado = true;
          
          console.log('🎉 Chat creado exitosamente:', {
            chatId: this.chatRoomId,
            message: chatResult.message
          });
          
          alert(`¡Pago exitoso! ${chatResult.message}\nEl chat se ha creado y ambos usuarios recibirán una notificación.`);
        } else {
          console.warn('⚠️ Chat no se pudo crear:', chatResult.message);
          alert(`Pago exitoso, pero hubo un problema al crear el chat: ${chatResult.message}`);
        }
      } else {
        console.warn('⚠️ No se puede crear chat: datos insuficientes');
        alert('Pago exitoso! Por favor contacte a la casa de remate para coordinar la entrega.');
      }
      
    } catch (error) {
      console.error('❌ Error post-pago:', error);
      const errorMessage = error && typeof error === 'object' && 'error' in error 
        ? (error as any).error?.message || (error as any).message 
        : 'Error desconocido';
      alert(`Pago exitoso, pero hubo un error al crear el chat: ${errorMessage}`);
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

  // Métodos de verificación automática
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
          this.iniciarTimer(tiempoRestante);
        }
      } else {
        this.timerState.timer = TIMER_CONSTANTS.FINISHED_MESSAGE;
        this.timerState.timerActivo = false;
      }
    }
  }

  private configurarVerificacionPeriodica(fechaSubasta: Date): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.timerState.timer = "Esperando inicio";
    this.timerState.timerActivo = false;
    
    this.intervalId = setInterval(() => {
      const ahora = new Date();
      const diferenciaMs = fechaSubasta.getTime() - ahora.getTime();
      
      if (diferenciaMs <= 0) {
        console.log('🚀 La subasta ha comenzado, iniciando automáticamente');
        this.iniciarSubastaAutomaticamente();
        clearInterval(this.intervalId);
      }
    }, 60000);
  }
  private iniciarSubastaAutomaticamente(): void {
    console.log('🚀 Iniciando subasta automáticamente');
    
    if (this.subasta) {
      this.subasta.activa = true;
      this.boton = true;
      this.timerInitialized = true;

      const ahora = new Date();
      const fechaSubasta = this.parsearFechaSubasta(this.subasta.fecha);
      const tiempoRestanteMs = fechaSubasta!.getTime() + this.subasta.duracionMinutos! * 60000 - ahora.getTime();
      const tiempoRestanteSegundos = Math.max(0, Math.ceil(tiempoRestanteMs / 1000));

      this.timerState.tiempoRestanteSegundos = tiempoRestanteSegundos;
      this.timerState.timer = this.formatearTiempo(tiempoRestanteSegundos);
      this.timerState.timerActivo = true;
      
      if (tiempoRestanteSegundos > 0) {
        this.iniciarTimer(tiempoRestanteSegundos);
      } else {
        // La subasta ya debería haber terminado
        this.timerState.timer = TIMER_CONSTANTS.FINISHED_MESSAGE;
        this.timerState.timerActivo = false;
        this.manejarFinalizacionSubasta();
      }
    }
  }

  public testChatCreation() {
    console.log('🧪 [TEST] Simulando creación de chat post-pago');
    
    const ganadorId = Number(localStorage.getItem('usuario_id'));
    const ganadorNombre = localStorage.getItem('usuario_nombre') || `Usuario ${ganadorId}`;
    
    if (!ganadorId || !this.subasta?.casaremate) {
      console.error('❌ [TEST] No se puede probar chat: faltan datos');
      return;
    }

    this.chatService.crearInvitacionChat(
      ganadorId,
      ganadorNombre,
      this.subasta.casaremate.usuario_id || 0,
      this.subasta.casaremate.usuario?.nombre || 'Casa de Remate'
    ).then((resultado) => {
      console.log('✅ [TEST] Chat creado:', resultado);
      if (resultado.success) {
        this.chatRoomId = resultado.chatId || '';
        this.chatCreado = true;
      }
    }).catch((error) => {
      console.error('❌ [TEST] Error al crear chat:', error);
    });
  }

  public testNotifications() {
    console.log('🧪 [TEST] Verificando notificaciones del usuario actual');
    
    const usuarioId = Number(localStorage.getItem('usuario_id'));
    if (!usuarioId) {
      console.error('❌ [TEST] Usuario no está logueado');
      return;
    }

    this.notificacionService.obtenerNotificacionesPublico(usuarioId).subscribe({
      next: (notificaciones) => {
        console.log('📬 [TEST] Notificaciones obtenidas:', notificaciones);
        
        const notificacionesChat = notificaciones.filter(n => n.esMensajeChat);
        console.log('💬 [TEST] Notificaciones de chat:', notificacionesChat);
        
        if (notificacionesChat.length > 0) {
          console.log('🎯 [TEST] Tienes invitaciones de chat pendientes!');
        }
      },
      error: (error) => {
        console.error('❌ [TEST] Error al obtener notificaciones:', error);
      }
    });
  }

  public testCompletePaymentFlow() {
    console.log('🧪 [TEST] Simulando flujo completo: ganador -> pago -> chat');
    
    // Paso 1: Simular que somos el ganador
    const userId = localStorage.getItem('usuario_id');
    if (!userId) {
      console.error('❌ Usuario no está logueado');
      return;
    }
    
    this.clienteID = Number(userId);
    this.pujaActual = 1500;
    
    // Paso 2: Simular finalización de subasta
    this.timerState.timer = TIMER_CONSTANTS.FINISHED_MESSAGE;
    this.timerState.timerActivo = false;
    if (this.subasta) this.subasta.activa = false;
    
    // Paso 3: Simular pago exitoso
    this.onPaymentSuccess({ 
      paymentId: 'test_payment_123',
      amount: this.pujaActual 
    });
    
    console.log('🧪 [TEST] Flujo completo ejecutado - verifica chat y notificaciones');
  }

  public forceValidateAuctionState() {
    console.log('🧪 [TEST] Forzando validación del estado de la subasta');
    console.log('🧪 [TEST] Estado antes:', {
      activa: this.subasta?.activa,
      timerActivo: this.timerState.timerActivo,
      timer: this.timerState.timer,
      timerInitialized: this.timerInitialized
    });
    
    this.timerInitialized = false; // Reset para permitir reinicio
    this.validarEstadoSubasta();
    
    console.log('🧪 [TEST] Estado después:', {
      activa: this.subasta?.activa,
      timerActivo: this.timerState.timerActivo,
      timer: this.timerState.timer,
      timerInitialized: this.timerInitialized
    });
  }

  public testAutoStart() {
    console.log('🧪 [TEST] Probando inicio automático de subasta');
    
    if (!this.subasta) {
      console.error('❌ [TEST] No hay subasta cargada');
      return;
    }
    
    // Simular que la subasta debe iniciar ahora
    const ahora = new Date();
    const fechaInicio = new Date(ahora.getTime() - 5000); // 5 segundos atrás
    const duracionMinutos = 10; // 10 minutos de duración
    
    console.log('🧪 [TEST] Configurando subasta para iniciar automáticamente');
    console.log('🧪 [TEST] Fecha inicio simulada:', fechaInicio.toLocaleString());
    console.log('🧪 [TEST] Duración:', duracionMinutos, 'minutos');
      // Actualizar datos de la subasta
    this.subasta.fecha = fechaInicio; // Usar Date directamente
    this.subasta.duracionMinutos = duracionMinutos;
    this.subasta.activa = false; // Inicialmente inactiva
    this.timerInitialized = false;
    
    // Forzar validación
    this.validarEstadoSubasta();
    
    console.log('🧪 [TEST] Resultado:', {
      activa: this.subasta.activa,
      timerActivo: this.timerState.timerActivo,
      timer: this.timerState.timer
    });
  }

  public testTimerSync() {
    console.log('🧪 [TEST] Probando sincronización del timer');
    
    const infoTemporal = {
      esRematador: this.isRematador(),
      timerActivo: this.timerState.timerActivo,
      tiempoRestante: this.timerState.tiempoRestanteSegundos,
      timerDisplay: this.timerState.timer,
      tieneSuscripcion: !!this.timerState.timerSubscription
    };
    
    console.log('🔍 [TEST] Estado actual del timer:', infoTemporal);
    
    if (this.isRematador()) {
      console.log('🔥 [TEST] Como rematador, enviando update manual de timer');
      if (this.timerState.tiempoRestanteSegundos) {
        this.sendTimerUpdateToWebSocket(this.timerState.tiempoRestanteSegundos);
      }
    } else {
      console.log('👀 [TEST] Como usuario, simulando recepción de update');
      const tiempoTest = this.timerState.tiempoRestanteSegundos || 300; // 5 minutos de prueba
      this.handleTimerUpdateFromWebSocket({ tiempoRestante: tiempoTest - 10 });
    }
    
    setTimeout(() => {
      console.log('🔍 [TEST] Estado después de la prueba:', {
        timerActivo: this.timerState.timerActivo,
        tiempoRestante: this.timerState.tiempoRestanteSegundos,
        timerDisplay: this.timerState.timer
      });
    }, 2000);
  }

  public testWebSocketConnection() {
    console.log('🧪 [TEST] Probando conexión WebSocket');
    
    const connectionInfo = {
      connected: this.websocketService.isConnected(),
      socketId: this.websocketService.getSocketId(),
      subscriptions: this.websocketSubscriptions.length
    };
    
    console.log('🔍 [TEST] Estado de conexión:', connectionInfo);
    
    if (!this.websocketService.isConnected()) {
      console.log('🔄 [TEST] Intentando reconectar...');
      this.websocketService.reconnect();
    } else {
      console.log('✅ [TEST] WebSocket conectado correctamente');
      
      // Test de envío de evento
      if (this.subasta?.id) {
        console.log('📡 [TEST] Enviando evento de prueba...');
        this.websocketService.joinAuction(
          this.subasta.id,
          Number(localStorage.getItem('usuario_id')) || 999,
          'TestUser'
        );
      }
    }
  }
}
