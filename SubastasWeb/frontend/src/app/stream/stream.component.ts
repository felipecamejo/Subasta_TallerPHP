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
  private timerInitialized: boolean = false;  private websocketSubscriptions: Subscription[] = [];
  boton: boolean = false;

  pujaActual: number = 0;
  pujaRapida: number | null = null;
  pujaComun: number | null = null;
  clienteID: number | null = null;
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
    return !!(this.subasta?.activa && this.timerState.timerActivo);
  }  /**
   * Getter que indica si el usuario actual es el ganador de la subasta
   */
  get esGanador(): boolean {
    // CONDICIÓN 1: La subasta debe haber terminado
    if (!this.subasta || this.subasta.activa || this.timerState.timerActivo) {
      console.log('🎯 esGanador: FALSE - La subasta aún está activa');
      return false; // La subasta no ha terminado
    }
    
    // CONDICIÓN 2: Debe haber pujas para determinar un ganador
    if (!this.pujas || this.pujas.length === 0) {
      console.log('🎯 esGanador: FALSE - No hay pujas');
      return false;
    }
    
    const usuarioActual = localStorage.getItem('usuario_id');
    if (!usuarioActual) {
      console.log('🎯 esGanador: FALSE - No hay usuario logueado');
      return false;
    }
    
    // MÉTODO 1: Usar encontrarGanador (más preciso)
    const ganadorId = this.encontrarGanador();
    if (ganadorId !== null && Number(usuarioActual) === ganadorId) {
      console.log('🎯 esGanador: TRUE - Ganador encontrado por encontrarGanador()');
      return true;
    }
    
    // MÉTODO 2: Verificar si el usuario actual hizo la última puja (fallback)
    if (this.clienteID && Number(usuarioActual) === this.clienteID) {
      // Verificar que la puja más alta coincida con la puja actual
      const pujaMasAlta = Math.max(...this.pujas.map(p => p.monto));
      if (pujaMasAlta === this.pujaActual) {
        console.log('🎯 esGanador: TRUE - Usuario actual es clienteID y tiene la puja más alta');
        return true;
      }
    }
    
    // MÉTODO 3: Verificar directamente en las pujas (último recurso)
    const pujaMasAlta = Math.max(...this.pujas.map(p => p.monto));
    const pujasGanadoras = this.pujas.filter(p => p.monto === pujaMasAlta);
    
    for (const puja of pujasGanadoras) {
      // Verificar por cliente.usuario.id
      if (puja.cliente?.usuario?.id && Number(usuarioActual) === puja.cliente.usuario.id) {
        console.log('🎯 esGanador: TRUE - Usuario encontrado en puja ganadora');
        return true;
      }
    }
    
    console.log('🎯 esGanador: FALSE - No se pudo determinar que el usuario es ganador');
    console.log('🎯 Debug info:', {
      ganadorId,
      usuarioActual,
      clienteID: this.clienteID,
      pujaActual: this.pujaActual,
      pujaMasAlta: this.pujas.length > 0 ? Math.max(...this.pujas.map(p => p.monto)) : 0,
      totalPujas: this.pujas.length
    });
    
    return false;
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
      debugValidarPuja: (monto?: number) => this.debugValidarPuja(monto),
      debugTimer: () => this.debugTimer(),
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
          clienteID: this.clienteID,
          pujaActual: this.pujaActual,
          subastaActiva: this.subasta?.activa,
          timerActivo: this.timerState.timerActivo
        });
        
        return { ganadorId, esGanador };
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
  }  crearPujaRapida(): void {
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

        this.clienteID = puja.cliente_id;

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
  }  private actualizarDatosSinSobrescribir(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    
    console.log('🔄 Actualizando datos desde backend...');
    
    this.subastaService.getSubasta(id).subscribe({
      next: (data) => {
        console.log('✅ Datos actualizados desde backend');
        
        // Preservar estados locales CRÍTICOS
        const timerEstadoAnterior = { ...this.timerState };
        const clienteIDAnterior = this.clienteID;
        const subastaActivaAnterior = this.subasta?.activa;
        const botonAnterior = this.boton;
        
        console.log('🔒 Preservando estados críticos:', {
          timerActivo: timerEstadoAnterior.timerActivo,
          subastaActiva: subastaActivaAnterior,
          boton: botonAnterior
        });
        
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
        
        // Actualizar pujas del lote actual
        const loteIndex = this.indexLotes;
        if (loteIndex >= 0 && loteIndex < this.lotes.length) {
          const pujasBackend = (this.lotes[loteIndex]?.pujas as pujaDto[]) || [];
          
          // Solo actualizar si hay más pujas en el backend
          if (pujasBackend.length > this.pujas.length) {
            console.log('📈 Nuevas pujas detectadas en backend:', {
              anteriores: this.pujas.length,
              nuevas: pujasBackend.length
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
        this.clienteID = clienteIDAnterior;
        
        // SOLO sobrescribir el estado de la subasta si el timer no está activo
        // Esto evita que se muestre "Lista para iniciar" cuando la subasta está corriendo
        if (this.timerState.timerActivo) {
          console.log('⚠️ Timer activo - Preservando estado de subasta activa');
          this.subasta.activa = true; // Forzar que permanezca activa
          this.boton = true; // Mantener botones habilitados
        } else {
          // Si el timer no está activo, respetar el estado del backend
          this.boton = this.subasta.activa;
        }
        
        console.log('💰 Estado final actualizado:', {
          pujaActual: this.pujaActual,
          totalPujas: this.pujas.length,
          timerActivo: this.timerState.timerActivo,
          subastaActiva: this.subasta.activa,
          boton: this.boton
        });
      },
      error: (err) => {
        console.error('❌ Error al actualizar datos:', err);
      }
    });
  }// Métodos WebSocket
  private setupWebSocketConnection(): void {
    if (!this.subasta?.id) return;

    // Conectar inmediatamente sin delay
    this.websocketService.joinAuction(
      this.subasta!.id!,
      this.clienteID || 999,
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
    if (loteData.newLoteIndex !== this.indexLotes) {
      this.indexLotes = loteData.newLoteIndex;
      this.cargarPujas(this.indexLotes);
      this.umbralSuperado = false;
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
    
    // PASO 2: Determinar ganador
    const ganadorId = this.encontrarGanador();
    console.log('🏆 Ganador determinado:', ganadorId, '- Usuario actual:', localStorage.getItem('usuario_id'));
    
    // PASO 3: Si el usuario actual es el ganador, mostrar PayPal
    if (ganadorId && this.esUsuarioGanador(ganadorId)) {
      console.log('🎉 ¡ERES EL GANADOR! Mostrando modal de pago PayPal');
      this.paypalMonto = this.pujaActual;
      
      // Asegurar que el componente PayPal se inicialice correctamente
      this.paypalComponentKey = true;
      this.pagando = true;
      
      // Mensaje de confirmación
      setTimeout(() => {
        alert(`¡Felicidades! Has ganado la subasta por $${this.pujaActual}. Procede con el pago.`);
      }, 1000);
    } else {
      console.log('👀 No eres el ganador de esta subasta');
      if (ganadorId) {
        setTimeout(() => {
          alert(`La subasta ha finalizado. El ganador pagó $${this.pujaActual}.`);
        }, 1000);
      } else {
        setTimeout(() => {
          alert('La subasta ha finalizado sin ganador (no hubo pujas).');
        }, 1000);
      }
    }
    
    // PASO 4 y 5: Solo el rematador maneja notificaciones y backend
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
    console.log('🔍 Estado actual:', {
      totalPujas: this.pujas?.length || 0,
      pujaActual: this.pujaActual,
      clienteID: this.clienteID,
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

    // Encontrar la puja con el monto más alto y más reciente en caso de empate
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

    // MÉTODO 1: Usar cliente.usuario.id de la puja ganadora
    if (pujaGanadora.cliente?.usuario?.id) {
      const ganadorId = Number(pujaGanadora.cliente.usuario.id);
      console.log('🏆 ✅ Ganador identificado por cliente.usuario.id de la puja ganadora:', ganadorId);
      return ganadorId;
    }

    // MÉTODO 2: Si no hay cliente.usuario.id pero el monto coincide con pujaActual y tenemos clienteID
    if (pujaGanadora.monto === this.pujaActual && this.clienteID && this.clienteID > 0) {
      const usuarioActual = localStorage.getItem('usuario_id');
      if (usuarioActual && Number(usuarioActual) === this.clienteID) {
        console.log('🏆 ✅ Ganador identificado por clienteID (usuario actual que pujó):', this.clienteID);
        return this.clienteID;
      }
    }

    // MÉTODO 3: Buscar en todas las pujas del monto ganador
    const pujasGanadoras = this.pujas.filter(p => p.monto === pujaGanadora.monto);
    for (const puja of pujasGanadoras) {
      if (puja.cliente?.usuario?.id) {
        const ganadorId = Number(puja.cliente.usuario.id);
        console.log('🏆 ✅ Ganador encontrado en pujas del monto ganador:', ganadorId);
        return ganadorId;
      }
    }

    console.log('❌ No se pudo determinar el ganador de forma segura');
    console.log('🔍 Información de debugging:', {
      cliente: pujaGanadora.cliente,
      tieneUsuario: !!pujaGanadora.cliente?.usuario,
      usuarioId: pujaGanadora.cliente?.usuario?.id,
      clienteIDLocal: this.clienteID,
      usuarioActual: localStorage.getItem('usuario_id'),
      pujasGanadoras: pujasGanadoras.length
    });
    
    // En caso de emergencia, si hay clienteID y coincide con el usuario actual
    const usuarioActual = localStorage.getItem('usuario_id');
    if (this.clienteID && usuarioActual && Number(usuarioActual) === this.clienteID) {
      console.log('🏆 ⚠️ EMERGENCIA: Usando clienteID como ganador:', this.clienteID);
      return this.clienteID;
    }
    
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
      const ganadorId = Number(localStorage.getItem('usuario_id')) || this.clienteID;
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
    }, 5000); // Verificar cada 5 segundos en lugar de 60
  }  /**
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
        // Inicializar timer inmediatamente
        this.inicializarTimerWebSocket(tiempoRestanteSegundos);
        
        // Asegurar que el timer display esté funcionando
        this.startTimerDisplayInterval();
        
        console.log('🎯 Subasta iniciada automáticamente - USUARIOS PUEDEN PUJAR');
        console.log('🎯 Timer activo con', tiempoRestanteSegundos, 'segundos restantes');
      } else {
        // La subasta ya debería haber terminado
        console.log('⏰ Tiempo agotado al iniciar - Finalizando inmediatamente');
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
  }  /**
   * Inicia el interval para actualizar la UI del timer cada segundo
   */
  private startTimerDisplayInterval(): void {
    this.stopTimerDisplayInterval(); // Limpiar interval previo
    
    console.log('🔄 Iniciando timer display interval');
    
    this.timerDisplayInterval = setInterval(() => {
      // Actualizar UI si hay datos del timer
      if (this.timerState && this.timerState.timerActivo) {
        // Decrementar tiempo local para mostrar en tiempo real
        if (this.timerState.tiempoRestanteSegundos && this.timerState.tiempoRestanteSegundos > 0) {
          this.timerState.tiempoRestanteSegundos--;
          this.timerState.timer = this.formatearTiempo(this.timerState.tiempoRestanteSegundos);
          
          // Si llega a 0, finalizar subasta
          if (this.timerState.tiempoRestanteSegundos <= 0) {
            this.timerState.timer = TIMER_CONSTANTS.FINISHED_MESSAGE;
            this.timerState.timerActivo = false;
            this.finalizarSubastaPorTiempo();
          }
        }
        
        // Forzar detección de cambios en Angular
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
      console.log('🛑 Deteniendo timer display interval');
      clearInterval(this.timerDisplayInterval);
      this.timerDisplayInterval = null;
    }
  }
  // Método de debugging para validación de pujas
  public debugValidarPuja(monto?: number): void {
    const montoTest = monto || this.pujaRapida || (this.pujaActual + 1);
    
    console.log('🧪 [DEBUG] ESTADO DE VALIDACIÓN DE PUJAS:');
    console.log('📊 Estado de la subasta:', {
      id: this.subasta?.id,
      activa: this.subasta?.activa,
      nombre: this.subasta?.nombre
    });
    console.log('⏰ Estado del timer:', {
      timer: this.timerState.timer,
      timerActivo: this.timerState.timerActivo,
      tiempoRestante: this.timerState.tiempoRestanteSegundos
    });
    console.log('💰 Estado de pujas:', {
      pujaActual: this.pujaActual,
      pujaRapida: this.pujaRapida,
      pujaComun: this.pujaComun,
      totalPujas: this.pujas.length,
      montoTest: montoTest
    });
    console.log('📦 Estado del lote:', {
      indexLotes: this.indexLotes,
      loteActual: this.lotes[this.indexLotes],
      pujaMinima: this.lotes[this.indexLotes]?.pujaMinima
    });
    
    // Probar validación
    const resultado = this.validarPuja(montoTest);
    console.log('✅ Resultado de validación:', resultado);
  }

  // Método de debugging para el timer
  public debugTimer(): void {
    console.log('🧪 [DEBUG] ESTADO DEL TIMER:');
    console.log('⏰ TimerState:', {
      timer: this.timerState.timer,
      timerActivo: this.timerState.timerActivo,
      tiempoRestanteSegundos: this.timerState.tiempoRestanteSegundos
    });
    console.log('📅 Fechas:', {
      fechaSubasta: this.subasta?.fecha,
      fechaParseada: this.subasta?.fecha ? this.parsearFechaSubasta(this.subasta.fecha) : null,
      ahora: new Date().toLocaleString(),
      duracionMinutos: this.subasta?.duracionMinutos
    });
    console.log('🔄 Intervals:', {
      timerDisplayInterval: !!this.timerDisplayInterval,
      intervalId: !!this.intervalId,
      timerInitialized: this.timerInitialized
    });
    console.log('🎮 Estado UI:', {
      timerDisplayText: this.timerDisplayText,
      timerCssClass: this.timerCssClass,
      subastaActiva: this.subasta?.activa,
      boton: this.boton
    });
  }

  /**
   * Reabrir el modal de pago para el ganador
   * Permite al ganador volver a ver el modal de pago si lo cerró accidentalmente
   */
  reabrirModalPago(): void {
    console.log('🔄 Reabriendo modal de pago para el ganador');
    
    if (!this.esGanador) {
      console.warn('⚠️ Usuario no es el ganador, no puede acceder al pago');
      alert('Solo el ganador puede proceder al pago.');
      return;
    }
    
    if (this.chatCreado) {
      console.log('✅ El pago ya fue completado (chat creado)');
      alert('El pago ya fue completado exitosamente. El chat con la casa de remate está disponible.');
      return;
    }
    
    // Forzar recreación del componente PayPal
    this.paypalComponentKey = false;
    
    // Reabrir modal de pago
    this.paypalMonto = this.pujaActual;
    this.pagando = true;
    
    // Recrear componente PayPal después de un pequeño delay
    setTimeout(() => {
      this.paypalComponentKey = true;
      this.cdr.detectChanges();
    }, 100);
    
    console.log('💰 Modal de pago reabierto para monto:', this.paypalMonto);
  }
}
