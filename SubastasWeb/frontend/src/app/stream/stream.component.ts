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
import { TimezoneService } from '../../services/timezone.service';
import { FacturaService } from '../../services/factura.service';
import { facturaDto } from '../../models/facturaDto';

// ✅ Redis-compatible request format
interface PujaRedisRequest {
  cliente_id: number | null;
  monto: number;
}

// 🔄 Legacy format (for compatibility)
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

  fechaFormateada: Date | null = null;

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

  // Getter para pujaActual que asegura que nunca sea undefined
  get pujaActualSegura(): number {
    if (this.pujaActual === undefined || this.pujaActual === null || isNaN(this.pujaActual)) {
      const loteActual = this.lotes[this.indexLotes];
      const pujaMinima = loteActual ? Number(loteActual.pujaMinima) || 0 : 0;
      console.warn(`⚠️ pujaActual inválida (${this.pujaActual}), usando puja mínima: ${pujaMinima}`);
      return pujaMinima;
    }
    return this.pujaActual;
  }

  pujaActual: number = 0;
  pujaRapida: number | null = null;
  pujaComun: number | null = null;
  clienteMail: string | null = null;

  // Variables para control de inicio automático
  private intervalId: any;
  
  // Interval para actualizar la UI del timer en tiempo real
  private timerDisplayInterval: any;

  // Variables para modal y pago
  modalVideo: boolean = false;
  video: string = '';
  pagando: boolean = false;
  loteActualPagado: boolean = false; // Variable para rastrear si el lote actual ya se completó el pago
  paypalMonto: number = 0;
  paypalComponentKey: boolean = true; // Para forzar recreación del componente PayPal
  loteIdPagando: number | null = null; // ID del lote que se está pagando actualmente

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
      return false;
    }
    
    const usuarioId = Number(usuarioActual);
    
    // Solo verificar ganadores cuando la subasta haya terminado 
    // Un usuario no puede ser "ganador" mientras la subasta sigue activa
    if (!this.subasta?.activa || !this.timerState.timerActivo) {
      const lotesGanados = this.lotesGanadosPorUsuario.length;
      if (lotesGanados > 0) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Getter que determina si debe mostrar el botón de "Proceder al Pago"
   * Solo se muestra si es ganador de lotes sin pagar Y no está pagando actualmente
   */
  get mostrarBotonPago(): boolean {
    const lotesGanadosSinPagar = this.lotesGanadosSinPagar;
    return this.esGanador && lotesGanadosSinPagar.length > 0 && !this.pagando;
  }

  /**
   * Getter que determina si debe mostrar el mensaje de "Pago Completado"
   * Solo se muestra si es ganador Y todos los lotes ganados están pagados
   */
  get mostrarMensajePagado(): boolean {
    const lotesGanados = this.lotesGanadosPorUsuario;
    const lotesPagados = lotesGanados.filter(ganador => {
      const lote = this.lotes.find(l => l.id === ganador.numeroLote);
      return lote?.pago === true;
    });
    
    return this.esGanador && lotesGanados.length > 0 && lotesPagados.length === lotesGanados.length && !this.pagando;
  }

  /**
   * Getter que devuelve todos los lotes ganados por el usuario actual
   * Solo funciona correctamente después de finalizada la subasta
   */
  get lotesGanadosPorUsuario(): ganadorDto[] {
    const usuarioActual = localStorage.getItem('usuario_id');
    if (!usuarioActual) return [];
    
    // Si la subasta está activa, devolver array vacío ya que los ganadores se determinan al final
    if (this.subasta?.activa) return [];
    
    const usuarioId = Number(usuarioActual);
    return this.ganadores.filter(ganador => 
      ganador.clienteId === usuarioId && ganador.monto > 0
    );
  }

  /**
   * Getter que devuelve todos los lotes ganados por el usuario que NO han sido pagados
   */
  get lotesGanadosSinPagar(): ganadorDto[] {
    return this.lotesGanadosPorUsuario.filter(ganador => {
      const lote = this.lotes.find(l => l.id === ganador.numeroLote);
      return lote?.pago === false; // Solo lotes no pagados
    });
  }

  /**
   * Calcula el monto total de todos los lotes ganados por el usuario que NO han sido pagados
   */
  get montoTotalGanadorSinPagar(): number {
    return this.lotesGanadosSinPagar.reduce((total, ganador) => {
      return total + Number(ganador.monto);
    }, 0);
  }

  /**
   * Calcula el monto total de todos los lotes ganados por el usuario (pagados y sin pagar)
   */
  get montoTotalGanador(): number {
    return this.lotesGanadosPorUsuario.reduce((total, ganador) => {
      return total + Number(ganador.monto);
    }, 0);
  }

  constructor(
    private subastaService: SubastaService,
    private route: ActivatedRoute,
    private pujaService: PujaService,
    private sanitizer: DomSanitizer,
    private websocketService: WebsocketService,
    private notificacionService: NotificacionService,
    private chatService: ChatService,
    private cdr: ChangeDetectorRef,
    private timezoneService: TimezoneService,
    private facturaService: FacturaService
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
            nombre: this.subasta!.nombre,
          },
          pago: lote.pago
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
    console.log('[parsearFechaSubasta] fechaInput:', fechaInput, '-> fecha:', fecha);
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
    const duracionMinutos = this.subasta.duracionMinutos;
    const finSubasta = new Date(fechaSubasta.getTime() + duracionMinutos * 60000);
    console.log('[validarEstadoSubasta] fechaSubasta:', fechaSubasta, 'ahora:', ahora, 'duracionMinutos:', duracionMinutos, 'finSubasta:', finSubasta);
    if (ahora < fechaSubasta) {
      // Antes de la subasta
      this.subasta.activa = false;
      this.boton = false;
    } else if (ahora >= fechaSubasta && ahora <= finSubasta) {
      // Durante la subasta - activar automáticamente
      const estadoAnterior = this.subasta.activa;
      this.subasta.activa = true;
      this.boton = true;
      
      // Si no estaba activa antes, iniciar el timer
      if (!estadoAnterior && !this.timerInitialized) {
        const tiempoTranscurridoMs = ahora.getTime() - fechaSubasta.getTime();
        const tiempoTranscurridoSegundos = Math.floor(tiempoTranscurridoMs / 1000);
        const duracionTotalSegundos = duracionMinutos * 60;
        const tiempoRestante = Math.max(0, duracionTotalSegundos - tiempoTranscurridoSegundos);
        console.log('[validarEstadoSubasta] tiempoTranscurridoMs:', tiempoTranscurridoMs, 'tiempoTranscurridoSegundos:', tiempoTranscurridoSegundos, 'duracionTotalSegundos:', duracionTotalSegundos, 'tiempoRestante:', tiempoRestante);
        if (tiempoRestante > 0) {
          this.timerInitialized = true;
          this.timerState.tiempoRestanteSegundos = tiempoRestante;
          this.timerState.timer = this.formatearTiempo(tiempoRestante);
          this.timerState.timerActivo = true;
          
          // Inicializar timer WebSocket para todos los usuarios
          this.inicializarTimerWebSocket(tiempoRestante);
        } else {
          // La subasta ya debería haber terminado
          this.timerState.timer = TIMER_CONSTANTS.FINISHED_MESSAGE;
          this.timerState.timerActivo = false;
          this.finalizarSubastaPorTiempo();
        }
      }
    } else {
      // Después de la subasta
      this.subasta.activa = false;
      this.boton = false;
      this.timerState.timer = TIMER_CONSTANTS.FINISHED_MESSAGE;
      this.timerState.timerActivo = false;
      
      this.finalizarSubastaPorTiempo();
    }
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
      alert('Solo el rematador puede cambiar de lote');
      return;
    }

    if (!this.subasta) {
      return;
    }

    if (this.indexLotes <= 0) {
      alert('Ya estás en el primer lote');
      return;
    }

    // Marcar que el rematador está navegando activamente
    this.rematadorNavigating = true;
    this.lastNavigationTime = Date.now();

    // Realizar el cambio inmediatamente en el frontend
    this.indexLotes--;
    this.subasta.loteIndex = this.indexLotes;
    this.umbralSuperado = false;
    
    // Cargar pujas del nuevo lote inmediatamente
    this.cargarPujas(this.indexLotes);
    
    // Enviar cambio vía WebSocket inmediatamente
    this.sendLoteChangeToWebSocket();
    
    // Actualizar el backend con un payload específico que incluya loteIndex
    const updatePayload = {
      id: this.subasta.id,
      loteIndex: this.indexLotes,
      // Incluir otros campos esenciales para evitar problemas
      nombre: this.subasta.nombre,
      activa: this.subasta.activa,
      duracionMinutos: this.subasta.duracionMinutos,
      fecha: this.subasta.fecha
    };
    
    console.log('🔄 Actualizando loteIndex en backend (anteriorLote):', updatePayload);
    
    this.subastaService.updateSubasta(updatePayload as any).subscribe({
      next: (response) => {
        console.log('✅ LoteIndex actualizado exitosamente (anteriorLote):', response);
        // Desmarcar navegación después de éxito
        setTimeout(() => {
          this.rematadorNavigating = false;
        }, 1000);
      },
      error: (err) => {
        console.error('❌ Error actualizando loteIndex (anteriorLote):', err);
        // NO revertir el cambio - mantener el control del rematador
        // Desmarcar navegación incluso en caso de error
        setTimeout(() => {
          this.rematadorNavigating = false;
        }, 1000);
      }
    });
  }

  siguienteLote(): void {
    // Validación más robusta para el rematador
    if (!this.isRematador()) {
      alert('Solo el rematador puede cambiar de lote');
      return;
    }

    if (!this.subasta) {
      return;
    }

    if (this.indexLotes >= this.lotes.length - 1) {
      alert('Ya estás en el último lote');
      return;
    }

    // Marcar que el rematador está navegando activamente
    this.rematadorNavigating = true;
    this.lastNavigationTime = Date.now();

    // Realizar el cambio inmediatamente en el frontend
    this.indexLotes++;
    this.subasta.loteIndex = this.indexLotes;
    this.umbralSuperado = false;
    
    // Cargar pujas del nuevo lote inmediatamente
    this.cargarPujas(this.indexLotes);
    
    // Enviar cambio vía WebSocket inmediatamente
    this.sendLoteChangeToWebSocket();
    
    // Actualizar el backend con un payload específico que incluya loteIndex
    const updatePayload = {
      id: this.subasta.id,
      loteIndex: this.indexLotes,
      // Incluir otros campos esenciales para evitar problemas
      nombre: this.subasta.nombre,
      activa: this.subasta.activa,
      duracionMinutos: this.subasta.duracionMinutos,
      fecha: this.subasta.fecha
    };
    
    console.log('🔄 Actualizando loteIndex en backend (siguienteLote):', updatePayload);
    
    this.subastaService.updateSubasta(updatePayload as any).subscribe({
      next: (response) => {
        console.log('✅ LoteIndex actualizado exitosamente (siguienteLote):', response);
        // Desmarcar navegación después de éxito
        setTimeout(() => {
          this.rematadorNavigating = false;
        }, 1000);
      },
      error: (err) => {
        console.error('❌ Error actualizando loteIndex (siguienteLote):', err);
        // NO revertir el cambio - mantener el control del rematador
        // Desmarcar navegación incluso en caso de error
        setTimeout(() => {
          this.rematadorNavigating = false;
        }, 1000);
      }
    });
  }

  cargarPujas(loteIndex: number): void {
    if (loteIndex < 0 || loteIndex >= this.lotes.length) {
      return;
    }
    
    this.pujas = (this.lotes[loteIndex]?.pujas as pujaDto[]) || [];
    
    // Calcular puja actual con validación robusta
    let pujaMaxima = 0;
    if (this.pujas.length > 0) {
      const montos = this.pujas.map(p => this.validarNumero(p.monto, 0, 'cargarPujas-monto')).filter(m => m > 0);
      pujaMaxima = montos.length > 0 ? Math.max(...montos) : 0;
    }
    
    // pujaActual = la última puja realizada (o valor base si no hay pujas)
    if (pujaMaxima > 0) {
      this.pujaActual = pujaMaxima;
    } else {
      // Si no hay pujas, usar el valor base del lote
      const valorBase = Number(this.lotes[loteIndex].valorBase) || 0;
      this.pujaActual = valorBase;
    }
    
    // pujaRapida = pujaActual + pujaMinima (el siguiente monto mínimo válido)
    const pujaMinima = this.validarNumero(this.lotes[loteIndex].pujaMinima, 0, 'cargarPujas-pujaMinima');
    this.pujaRapida = this.pujaActual + pujaMinima;
    this.pujaComun = null;
    
    console.log(`📊 PUJAS CARGADAS: Lote ${loteIndex} - Puja actual: $${this.pujaActual} - Puja rápida: $${this.pujaRapida}`);
  }// Métodos de timer
  /**
   * Inicializa el estado del timer basado en WebSocket.
   * TODOS los usuarios (rematadores y visitantes) solo escuchan las actualizaciones del servidor.
   * El servidor WebSocket maneja el timer maestro y envía actualizaciones a todos los clientes.
   */
  inicializarTimerWebSocket(tiempoInicialSegundos?: number) {
    if (!this.subasta?.duracionMinutos) {
      return;
    }

    let tiempoRestanteSegundos = tiempoInicialSegundos ?? (this.subasta.duracionMinutos * 60);
    console.log('[inicializarTimerWebSocket] tiempoInicialSegundos:', tiempoInicialSegundos, 'this.subasta.duracionMinutos:', this.subasta.duracionMinutos, 'tiempoRestanteSegundos:', tiempoRestanteSegundos);
    this.timerState.tiempoRestanteSegundos = tiempoRestanteSegundos;
    this.timerState.timer = this.formatearTiempo(tiempoRestanteSegundos);
    this.timerState.timerActivo = true;
  }

  /**
   * Detiene el timer local (ya no hay suscripciones locales - todo es WebSocket)
   */
  detenerTimer(): void {
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
    const tiempoFormateado = `${horas.toString().padStart(2, '0')}:` +
          `${minutos.toString().padStart(2, '0')}:` +
          `${seg.toString().padStart(2, '0')}`;
    return tiempoFormateado;
  }

  private formatearFechaInicio(fecha: Date): string {
    // Mantener el formato específico que necesitas: dd/mm/yyyy, hh:mm
    const userTimezone = this.timezoneService.getUserTimezone();
    
    // Crear un formateador que use la zona horaria del usuario
    const formatter = new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: userTimezone
    });
    
    return formatter.format(fecha);
  }
  
  // Métodos de pujas
  /**
   * Valida si se puede realizar una puja.
   * Verifica que la subasta esté activa Y que el timer esté corriendo.
   */
  private validarPuja(monto: number | null): { valida: boolean; error?: string } {
    // VALIDACIÓN 1: Subasta debe estar activa
    if (!this.subasta?.activa) {
      return { valida: false, error: 'La subasta no está activa' };
    }
    
    // VALIDACIÓN 2: Timer debe estar corriendo
    if (!this.timerState.timerActivo) {
      return { valida: false, error: 'El tiempo de la subasta ha terminado' };
    }

    // VALIDACIÓN 3: Monto válido
    if (!monto || monto <= 0) {
      return { valida: false, error: 'El monto debe ser mayor a 0' };
    }

    // VALIDACIÓN 4: Lote disponible
    const loteActual = this.lotes[this.indexLotes];
    if (!loteActual) {
      return { valida: false, error: 'No hay lote seleccionado' };
    }

    // VALIDACIÓN 5: Puja no puede ser menor que valorBase + pujaMinima o pujaActual + pujaMinima
    const valorBase = Number(loteActual.valorBase) || 0;
    const pujaMinima = Number(loteActual.pujaMinima) || 1;
    const pujaActualSegura = this.pujaActualSegura;
    
    // El monto mínimo requerido es el mayor entre:
    // - valorBase + pujaMinima
    // - pujaActual + pujaMinima
    const montoMinimoDesdeBase = valorBase + pujaMinima;
    const montoMinimoDesdeActual = pujaActualSegura + pujaMinima;
    const montoMinimoRequerido = Math.max(montoMinimoDesdeBase, montoMinimoDesdeActual);
    
    if (monto < montoMinimoRequerido) {
      return { 
        valida: false, 
        error: `El monto debe ser al menos $${montoMinimoRequerido} (valor base: $${valorBase} + puja mínima: $${pujaMinima} o puja actual: $${pujaActualSegura} + puja mínima: $${pujaMinima})` 
      };
    }

    return { valida: true };
  }

  // 🔧 HELPER: Calcular puja actual usando la misma lógica que el backend Redis
  private calcularPujaActual(pujaAnterior: number): number {
    const loteActual = this.lotes[this.indexLotes];
    if (!loteActual) return 0;
    
    const valorBase = Number(loteActual.valorBase) || 0;
    const pujaMinima = Number(loteActual.pujaMinima) || 1;
    
    // Usar la misma lógica que el backend Redis
    const montoMinimo = Math.max(pujaAnterior + pujaMinima, valorBase);
    
    console.log(`🧮 CALCULAR PUJA ACTUAL: pujaAnterior=${pujaAnterior}, valorBase=${valorBase}, pujaMinima=${pujaMinima}, resultado=${montoMinimo}`);
    
    return montoMinimo;
  }

  // ✅ UPDATED: Create Redis-compatible bid request
  private crearPujaRedis(monto: number): PujaRedisRequest {
    // Validar que el monto sea válido
    if (!monto || monto <= 0) {
      throw new Error('El monto debe ser mayor a 0');
    }

    // Obtener ID del usuario de forma segura
    const usuarioIdStr = localStorage.getItem('usuario_id');
    const clienteId = usuarioIdStr ? Number(usuarioIdStr) : null;
    
    console.log('🔍 DEBUG crearPujaRedis:', {
      usuarioIdStr,
      clienteId,
      monto,
      localStorage_keys: Object.keys(localStorage),
      localStorage_usuario_id: localStorage.getItem('usuario_id')
    });
    
    // Validar que el cliente ID sea válido
    if (!clienteId || isNaN(clienteId)) {
      throw new Error('ID de usuario inválido');
    }

    const puja = {
      monto: monto,
      cliente_id: clienteId
    };
    
    console.log('✅ PUJA CREADA:', puja);
    return puja;
  }

  // 🔄 LEGACY: Keep for compatibility if needed
  private crearPujaBase(monto: number): PujaRequest {
    return {
      fechaHora: new Date().toISOString(),
      monto: monto,
      cliente_id: localStorage.getItem('usuario_id') !== null ? Number(localStorage.getItem('usuario_id')) : null, 
      lote_id: Number(this.lotes[this.indexLotes].id)
    };
  } 
  
  // 🔧 DEBUG: Verificar si el usuario existe en la tabla clientes
  debugUsuario(): void {
    const usuarioId = localStorage.getItem('usuario_id');
    if (!usuarioId) {
      console.error('❌ No hay usuario_id en localStorage');
      return;
    }

    console.log('🔍 Verificando usuario:', usuarioId);
    
    // NUEVO: Debug directo del usuario
    const debugDirectoUrl = `http://localhost:8080/api/pujas-redis/debug-usuario/${usuarioId}`;
    fetch(debugDirectoUrl)
      .then(response => response.json())
      .then((data: any) => {
        console.log('✅ DEBUG USUARIO DIRECTO:', data);
      })
      .catch((error: any) => {
        console.error('❌ ERROR EN DEBUG USUARIO DIRECTO:', error);
      });
    
    // Crear URL manualmente para el debug original
    const debugUrl = `http://localhost:8080/api/pujas-redis/debug/cliente/${usuarioId}`;
    fetch(debugUrl)
      .then(response => response.json())
      .then((data: any) => {
        console.log('✅ DEBUG USUARIO:', data);
      })
      .catch((error: any) => {
        console.error('❌ ERROR EN DEBUG USUARIO:', error);
      });
  }

  crearPujaRapida(): void {
    const loteActual = this.lotes[this.indexLotes];
    if (!loteActual) {
      alert('Error: No hay lote seleccionado');
      return;
    }

    const pujaMinima = Number(loteActual.pujaMinima) || 1;
    
    // Recalcular pujaRapida = pujaActual + pujaMinima
    this.pujaRapida = this.pujaActual + pujaMinima;

    console.log(`🚀 CREANDO PUJA RÁPIDA: pujaActual = $${this.pujaActual}, pujaMinima = $${pujaMinima}, pujaRapida = $${this.pujaRapida}`);

    const validacion = this.validarPuja(this.pujaRapida);
    
    if (!validacion.valida) {
      alert(`No se puede realizar la puja: ${validacion.error}`);
      this.pujaRapida = null; // Limpiar el valor para evitar confusión
      return;
    }

    try {
      // ✅ UPDATED: Use Redis-compatible request with error handling
      const puja = this.crearPujaRedis(this.pujaRapida!);
      this.enviarPujaRedis(puja);
    } catch (error) {
      console.error('Error al crear puja rápida:', error);
      alert(`Error al crear la puja: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      this.pujaRapida = null;
    }
  }

  crearPujaComun(): void {
    const validacion = this.validarPuja(this.pujaComun);
    
    if (!validacion.valida) {
      alert(`No se puede realizar la puja: ${validacion.error}`);
      this.pujaComun = null; // Limpiar el valor para evitar confusión
      return;
    }

    try {
      // ✅ UPDATED: Use Redis-compatible request with error handling
      const puja = this.crearPujaRedis(this.pujaComun!);
      this.enviarPujaRedis(puja);
    } catch (error) {
      console.error('Error al crear puja común:', error);
      alert(`Error al crear la puja: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      this.pujaComun = null;
    }
  }

  private enviarPuja(puja: PujaRequest): void {
    if (!puja.lote_id || puja.lote_id <= 0) {
      alert('Error: ID de lote inválido');
      return;
    }

    const usuarioId = localStorage.getItem('usuario_id');
    if (!usuarioId) {
      alert('Debe iniciar sesión para realizar una puja');
      return;
    }

    if (puja.cliente_id === null) {
      puja.cliente_id = Number(usuarioId);
    }

    // 2. Enviar email de confirmación al usuario que realiza la puja
    this.subastaService.getClienteMail(puja.cliente_id).subscribe({
      next: (mail) => {
        if (!mail) {
          return;
        }

        const exGanador = mail;

        const email: mailDto = {
          email: mail,
          asunto: `Puja realizada en la subasta ${this.subasta?.nombre || 'desconocida'}`,
          mensaje: `Se ha realizado una puja de $${puja.monto} en el lote ${this.lotes[this.indexLotes].id} de la subasta ${this.subasta?.nombre || 'desconocida'}.`
        };

        if (this.esUsuarioGanadorActualLote()) {
          this.subastaService.enviarMail(email).subscribe({
            next: (response) => console.log('📧 MAIL ENVIADO: Email de confirmación enviado exitosamente a', this.clienteMail),
            error: (error) => console.error('❌ ERROR AL ENVIAR MAIL DE CONFIRMACIÓN:', error)
          });
        }

        // ✅ Ya no actualizamos el array local de ganadores - se consultará al servidor al final de la subasta

        this.pujaService.crearPuja(puja).subscribe({
          next: (data) => {
            console.log(`💰 NUEVA PUJA CREADA: Lote ${this.lotes[this.indexLotes].id} - Cliente ${puja.cliente_id} - Monto: $${data.monto}`);
            this.pujaActual = data.monto;
            this.pujaRapida = data.monto + (this.lotes[this.indexLotes].pujaMinima || 1);
            this.pujaComun = null;
            const nuevaPuja: pujaDto = {
              id: data.id,
              fechaHora: new Date(data.fechaHora),
              monto: data.monto,
              lote: this.lotes[this.indexLotes],
              factura: null as any,
              cliente: {
                usuario: {
                  id: puja.cliente_id!,
                  nombre: localStorage.getItem('usuario_nombre') || 'Usuario',
                  email: this.clienteMail || '',
                  imagen: '',
                  telefono: undefined,
                  cedula: undefined,
                  latitud: undefined,
                  longitud: undefined
                }
              }
            };
            this.pujas.push(nuevaPuja);

            this.sendWebSocketBid(puja);

            // 3. Notificar al ex ganador si existe y es distinto al usuario actual
            if (exGanador) {
              
              const exEmail: mailDto = {
                email: exGanador,
                asunto: `Puja superada - ${this.subasta?.nombre}`,
                mensaje: `Tu puja en el lote ${this.lotes[this.indexLotes].id} de la subasta ${this.subasta?.nombre} ha sido superada.`
              };

              console.log('🔔 NOTIFICACIÓN AL EX GANADOR:', exGanador);

              if (this.esUsuarioGanadorActualLote()) {
                this.subastaService.enviarMail(exEmail).subscribe({
                  next: () => console.log('📧 MAIL ENVIADO: Notificación de puja superada enviada a', exGanador),
                  error: (error) => console.error('❌ ERROR AL ENVIAR MAIL AL EX GANADOR:', error)
                });
              }
            }

            setTimeout(() => {
              this.actualizarDatosSinSobrescribir();
            }, 500);
          },
          error: (err) => {
            alert('Error al procesar la puja. Por favor, intente nuevamente.');
          }
        });
      },
      error: (err) => {
        console.error('Error al obtener el email del cliente:', err);
      }
    });
  }

  // ✅ NEW: Redis-based bidding method
  private enviarPujaRedis(puja: PujaRedisRequest): void {
    const usuarioId = localStorage.getItem('usuario_id');
    if (!usuarioId) {
      alert('Debe iniciar sesión para realizar una puja');
      return;
    }

    if (puja.cliente_id === null) {
      puja.cliente_id = Number(usuarioId);
    }

    // Get current lot ID from URL/index
    const loteId = this.lotes[this.indexLotes]?.id;
    if (!loteId || loteId <= 0) {
      alert('Error: ID de lote inválido');
      return;
    }

    // Get client email for notifications
    this.subastaService.getClienteMail(puja.cliente_id).subscribe({
      next: (mail) => {
        const exGanador = mail;

        const email: mailDto = {
          email: mail || '',
          asunto: `Puja realizada en la subasta ${this.subasta?.nombre || 'desconocida'}`,
          mensaje: `Se ha realizado una puja de $${puja.monto} en el lote ${loteId} de la subasta ${this.subasta?.nombre || 'desconocida'}.`
        };

        

        // Make the Redis bid request
        this.pujaService.crearPujaRedis(loteId, puja).subscribe({
          next: (data) => {
            console.log(`💰 NUEVA PUJA REDIS CREADA: Lote ${loteId} - Cliente ${puja.cliente_id} - Monto: $${data.monto}`);
            
            // Update UI with the new bid
            const montoRecibido = this.validarNumero(data.monto, Number(puja.monto), 'enviarPujaRedis-nuevoMonto');
            
            // pujaActual = el monto de la puja que acabamos de hacer
            this.pujaActual = montoRecibido;
            
            // pujaRapida = pujaActual + pujaMinima (el siguiente monto mínimo)
            const loteActual = this.lotes[this.indexLotes];
            const pujaMinima = loteActual ? Number(loteActual.pujaMinima) || 1 : 1;
            this.pujaRapida = this.pujaActual + pujaMinima;
            
            console.log(`✅ PUJA ACTUALIZADA: pujaActual = $${this.pujaActual}, pujaRapida = $${this.pujaRapida}`);
            this.pujaComun = null;

            // Create the bid object for local display
            const montoValidado = this.validarNumero(data.monto, Number(puja.monto), 'enviarPujaRedis-nuevaPuja');
            const nuevaPuja: pujaDto = {
              id: data.id || Date.now(), // Use timestamp as fallback ID
              fechaHora: new Date(data.fechaHora || Date.now()),
              monto: montoValidado,
              lote: this.lotes[this.indexLotes],
              factura: null as any,
              cliente: {
                usuario: {
                  id: puja.cliente_id!,
                  nombre: localStorage.getItem('usuario_nombre') || 'Usuario',
                  email: this.clienteMail || '',
                  imagen: ''
                }
              }
            };
            this.pujas.push(nuevaPuja);
            
            console.log(`📝 NUEVA PUJA AGREGADA: ID: ${nuevaPuja.id}, Monto: ${nuevaPuja.monto}, Total pujas: ${this.pujas.length}`);

            // Send WebSocket notification
            this.sendWebSocketBidRedis(puja, loteId);

            // ✅ Ya no actualizamos el array local de ganadores - se consultará al servidor al final de la subasta

            // Send confirmation email to bidder
            if (mail && this.esUsuarioGanadorActualLote()) {
              this.subastaService.enviarMail(email).subscribe({
                next: (response) => console.log('📧 MAIL ENVIADO: Email de confirmación enviado exitosamente a', mail),
                error: (error) => console.error('❌ ERROR AL ENVIAR MAIL DE CONFIRMACIÓN:', error)
              });
            }

            // Check if threshold is exceeded and send notification
            if (this.lotes[this.indexLotes].umbral && puja.monto > this.lotes[this.indexLotes].umbral && !this.umbralSuperado) {
              this.umbralSuperado = true;
              this.enviarNotificacionUmbral(puja.monto);
            }

            // Notify previous winner if exists and is different from current user
            if (exGanador && exGanador !== mail) {
              const exEmail: mailDto = {
                email: exGanador,
                asunto: `Puja superada - ${this.subasta?.nombre}`,
                mensaje: `Tu puja en el lote ${loteId} de la subasta ${this.subasta?.nombre} ha sido superada.`
              };

              console.log('🔔 NOTIFICACIÓN AL EX GANADOR:', exGanador);

              if (this.esUsuarioGanadorActualLote()) {
                this.subastaService.enviarMail(exEmail).subscribe({
                  next: () => console.log('📧 MAIL ENVIADO: Notificación de puja superada enviada a', exGanador),
                  error: (error) => console.error('❌ ERROR AL ENVIAR MAIL AL EX GANADOR:', error)
                });
              }
            }

            // Update data after a short delay
            setTimeout(() => {
              this.actualizarDatosSinSobrescribir();
            }, 500);
          },
          error: (err) => {
            console.error('❌ ERROR EN PUJA REDIS:', err);
            console.error('❌ DETALLES DEL ERROR:', {
              status: err.status,
              statusText: err.statusText,
              error: err.error,
              url: err.url,
              puja_enviada: puja,
              lote_id: loteId
            });
            
            // Handle specific Redis errors
            if (err.status === 422) {
              console.error('❌ ERROR 422 - Validación fallida:', err.error);
              alert(`Error de validación: ${err.error?.message || 'Datos enviados inválidos'}`);
            } else if (err.status === 409) {
              alert('Tu puja ha sido superada por otra más alta. Por favor, intenta con un monto mayor.');
            } else if (err.status === 400) {
              alert('Puja inválida. Verifica que el monto sea mayor al actual.');
            } else if (err.status === 404) {
              alert('El lote no fue encontrado o ya no está disponible.');
            } else {
              alert('Error al procesar la puja. Por favor, intente nuevamente.');
            }
            
            // Reset input values on error
            const pujaActualSegura = this.pujaActualSegura;
            this.pujaRapida = pujaActualSegura + 1;
            this.pujaComun = null;
            
            console.log(`❌ ERROR - VALORES RESETEADOS: pujaActual = ${this.pujaActual}, pujaActualSegura = ${pujaActualSegura}, pujaRapida = ${this.pujaRapida}`);
          }
        });
      },
      error: (err) => {
        console.error('Error al obtener el email del cliente:', err);
        alert('Error al procesar la información del usuario. Por favor, intente nuevamente.');
      }
    });
  }

  // ✅ NEW: WebSocket notification for Redis bids
  private sendWebSocketBidRedis(puja: PujaRedisRequest, loteId: number): void {
    if (!this.subasta?.id) return;

    this.websocketService.sendBid(
      this.subasta.id,
      puja.cliente_id || 0,
      localStorage.getItem('usuario_nombre') || 'Usuario',
      puja.monto,
      loteId
    );
    
    console.log('🌐 WEBSOCKET: Puja Redis enviada via WebSocket', {
      subastaId: this.subasta.id,
      clienteId: puja.cliente_id,
      monto: puja.monto,
      loteId: loteId
    });
  }

  private enviarNotificacionUmbral(monto: number): void {
    const casaRemateId = this.subasta?.casa_remate?.usuario_id;
    if (casaRemateId) {
      this.notificacionService.crearNotificacion(
        "Umbral Superado", 
        `El lote ID: ${this.lotes[this.indexLotes].id} ha superado su umbral de $${this.lotes[this.indexLotes].umbral}. Nueva puja: $${monto}`, 
        casaRemateId, 
        false, 
        ""
      ).subscribe({
        next: (notificacion) => console.log(`🔔 NOTIFICACIÓN ENVIADA: Umbral superado - Lote ${this.lotes[this.indexLotes].id} - Casa de remate ${casaRemateId} - Monto: $${monto}`),
        error: (error) => console.error('❌ ERROR AL CREAR NOTIFICACIÓN DE UMBRAL:', error)
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
        return;
      } else {
        this.rematadorNavigating = false;
      }
    }

    const id = Number(this.route.snapshot.paramMap.get('id'));
    
    this.subastaService.getSubasta(id).subscribe({
      next: (data) => {
        // Preservar estados locales CRÍTICOS
        const timerEstadoAnterior = { ...this.timerState };
        const clienteIDAnterior = this.ganadores[this.indexLotes]?.clienteId;
        const subastaActivaAnterior = this.subasta?.activa;
        const botonAnterior = this.boton;
        const indexLotesAnterior = this.indexLotes; // PRESERVAR ÍNDICE DE LOTE ACTUAL DEL REMATADOR
        
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
          // El rematador mantiene SIEMPRE su lote actual, sin excepciones
          this.indexLotes = indexLotesAnterior;
        } else {
          // Los usuarios normales siguen los cambios del backend/rematador
          if (data.loteIndex !== undefined && data.loteIndex !== indexLotesAnterior) {
            this.indexLotes = data.loteIndex;
          }
        }
        
        // Actualizar pujas del lote actual
        const loteIndex = this.indexLotes; // Usar el índice final (ya decidido arriba)
        if (loteIndex >= 0 && loteIndex < this.lotes.length) {
          const pujasBackend = (this.lotes[loteIndex]?.pujas as pujaDto[]) || [];
          
          // Solo actualizar si hay más pujas en el backend
          if (pujasBackend.length > this.pujas.length) {
            this.pujas = pujasBackend;
            
            // Recalcular puja actual con validación robusta
            let pujaMaxima = 0;
            if (this.pujas.length > 0) {
              const montos = this.pujas.map(p => Number(p.monto)).filter(m => !isNaN(m) && m > 0);
              pujaMaxima = montos.length > 0 ? Math.max(...montos) : 0;
            }
            
            this.pujaActual = pujaMaxima > 0 ? pujaMaxima : Number(this.lotes[loteIndex].pujaMinima) || 0;
            this.pujaRapida = Number(this.pujaActual) + 1;
            
            // Validación adicional para asegurar que pujaActual nunca sea undefined/NaN
            if (isNaN(this.pujaActual) || this.pujaActual === undefined || this.pujaActual === null) {
              this.pujaActual = Number(this.lotes[loteIndex].pujaMinima) || 0;
              console.warn(`⚠️ pujaActual corregida a puja mínima: ${this.pujaActual}`);
            }
            if (isNaN(this.pujaRapida) || this.pujaRapida === undefined || this.pujaRapida === null) {
              this.pujaRapida = this.pujaActual + 1;
              console.warn(`⚠️ pujaRapida corregida: ${this.pujaRapida}`);
            }
            
            console.log(`🔄 DATOS ACTUALIZADOS: Lote ${loteIndex} - Puja actual: $${this.pujaActual} - Puja rápida: $${this.pujaRapida}`);
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
          this.subasta.activa = true;
          this.boton = true;
        } else {
          this.boton = this.subasta.activa;
        }
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
        console.log(`🌐 WEBSOCKET CONECTADO: Subasta ${this.subasta?.id} - Usuario ${localStorage.getItem('usuario_id')} conectado exitosamente`);
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
    if (bidData.loteId !== this.lotes[this.indexLotes]?.id) {
      return;
    }

    const pujaActualSegura = this.pujaActualSegura;
    if (bidData.bidAmount > pujaActualSegura) {
      this.pujaActual = bidData.bidAmount;
      this.pujaRapida = bidData.bidAmount + 1;
      
      console.log(`🌐 WEBSOCKET PUJA RECIBIDA: ${bidData.bidAmount} > ${pujaActualSegura}, actualizando UI`);

      const nuevaPuja: pujaDto = {
        id: bidData.pujaId || Date.now(), // Usar ID real si está disponible
        fechaHora: new Date(bidData.timestamp),
        monto: bidData.bidAmount,
        lote: this.lotes[this.indexLotes],
        factura: null as any,
        cliente: null as any
      };

      this.pujas.push(nuevaPuja);

      if (this.lotes[this.indexLotes].umbral < bidData.bidAmount && !this.umbralSuperado) {
        this.umbralSuperado = true;
        console.log("🔔 UMBRAL SUPERADO");
        if (this.esUsuarioUmbral() ) {
          this.enviarNotificacionUmbral(bidData.bidAmount);
        }
      }
      // Forzar detección de cambios
      this.cdr.detectChanges();
    }
  }

  private esUsuarioGanadorActualLote(): boolean {
    // Durante la subasta activa, cualquier usuario puede recibir notificaciones
    // Al final de la subasta, se consultará el servidor para determinar ganadores reales
    if (this.subasta?.activa) {
      return true;
    }
    
    // Si la subasta no está activa, verificar en el array de ganadores
    const ganadorLote = this.ganadores[this.indexLotes];
    const usuarioActual = localStorage.getItem('usuario_id');
    if (!ganadorLote || !ganadorLote.clienteId || ganadorLote.clienteId === 0) return false;
    if (!usuarioActual) return false;
    return Number(usuarioActual) === Number(ganadorLote.clienteId);
  }

   private esUsuarioUmbral(): boolean {
    // Durante la subasta activa, cualquier usuario puede recibir notificaciones de umbral
    if (this.subasta?.activa) {
      return true;
    }
    
    // Si la subasta no está activa, verificar en el array de ganadores
    const ganadorLote = this.ganadores[this.indexLotes];
    const usuarioActual = localStorage.getItem('usuario_id');
    
    if (!usuarioActual || !ganadorLote || !ganadorLote.clienteId || ganadorLote.clienteId === 0) return false;
    return Number(usuarioActual) === Number(ganadorLote.clienteId);
  }

  private handleLoteUpdateFromWebSocket(loteData: any): void {
    // Solo los usuarios NO-rematadores deben seguir automáticamente los cambios de lote
    if (!this.isRematador() && loteData.newLoteIndex !== this.indexLotes) {
      this.indexLotes = loteData.newLoteIndex;
      this.cargarPujas(this.indexLotes);
      this.umbralSuperado = false;
    }
  }  /**
   * Procesa las actualizaciones del timer recibidas vía WebSocket desde el servidor.
   * TODOS los usuarios (rematadores y visitantes) procesan estas actualizaciones por igual.
   */
  private handleTimerUpdateFromWebSocket(timerData: any): void {
    if (timerData.tiempoRestante !== undefined) {
      const nuevoTiempo = timerData.tiempoRestante;
      console.log('[handleTimerUpdateFromWebSocket] timerData:', timerData, 'nuevoTiempo:', nuevoTiempo);
      this.timerState.tiempoRestanteSegundos = nuevoTiempo;
      this.timerState.timer = this.formatearTiempo(nuevoTiempo);
      if (nuevoTiempo > 0) {
        this.timerState.timerActivo = true;
      } else {
        this.timerState.timer = TIMER_CONSTANTS.FINISHED_MESSAGE;
        this.timerState.tiempoRestanteSegundos = 0;
        this.timerState.timerActivo = false;
        this.finalizarSubastaPorTiempo();
      }
      this.cdr.detectChanges();
    }
  }

  private sendWebSocketBid(puja: PujaRequest): void {
    if (!this.subasta?.id) return;

    this.websocketService.sendBid(
      this.subasta.id,
      puja.cliente_id || 0,
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
    // PASO 1: Desactivar subasta para que no se puedan hacer más pujas
    if (this.subasta) {
      this.subasta.activa = false;
      this.boton = false;
    }
    
    // PASO 2: OBTENER GANADORES REALES DEL SERVIDOR
    this.obtenerGanadoresDesdeServidor().then(() => {
      console.log('✅ Ganadores obtenidos del servidor correctamente');
      
      // PASO 3: Determinar ganador del lote actual
      const ganadorId = this.encontrarGanador();
      
      // PASO 4: Si el usuario actual es ganador de lotes sin pagar, mostrar PayPal con el total sin pagar
      const lotesSinPagar = this.lotesGanadosSinPagar;
      if (lotesSinPagar.length > 0) {
        this.paypalMonto = this.montoTotalGanadorSinPagar; // Usar el monto total sin pagar
        
        // Asegurar que el componente PayPal se inicialice correctamente
        this.paypalComponentKey = true;
        this.pagando = true;
        
        // Mensaje de confirmación con detalles
        setTimeout(() => {
          const cantidadLotes = lotesSinPagar.length;
          const mensaje = cantidadLotes === 1 
            ? `¡Felicidades! Has ganado 1 lote por $${this.montoTotalGanadorSinPagar}. Procede con el pago.`
            : `¡Felicidades! Has ganado ${cantidadLotes} lotes por un total de $${this.montoTotalGanadorSinPagar}. Procede con el pago.`;
          alert(mensaje);
        }, 1000);
      } else if (ganadorId) {
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
        if (ganadorId) {
          this.enviarNotificacionesFinalizacion(ganadorId);
        }
        
        if (this.subasta) {
          this.subastaService.updateSubasta(this.subasta).subscribe({
            next: () => console.log('✅ REMATADOR: Subasta marcada como finalizada en la base de datos'),
            error: (err) => console.error('❌ REMATADOR: Error al finalizar subasta en la base de datos:', err)
          });
        }
      }
    }).catch((error: any) => {
      console.error('❌ Error al obtener ganadores del servidor:', error);
    });
  }



  private enviarNotificacionesFinalizacion(ganadorId: number): void {
    const casaRemateId = this.subasta?.casa_remate?.usuario_id;
    const loteId = this.lotes[this.indexLotes]?.id;
    
    if (!casaRemateId || !loteId) {
      console.error('❌ No se pueden enviar notificaciones: falta casaRemateId o loteId');
      return;
    }

    console.log('� Enviando notificaciones de finalización:', {
      ganadorId,
      casaRemateId,
      loteId
    });

   
  }  
  
  private encontrarGanador(): number | null {
    // MÉTODO 1: Verificar en el array de ganadores primero
    const ganadorLote = this.ganadores[this.indexLotes];
    if (ganadorLote && ganadorLote.clienteId > 0) {
      return ganadorLote.clienteId;
    }
    
    if (!this.pujas || this.pujas.length === 0) {
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

    // MÉTODO 3: Usar cliente.usuario.id de la puja ganadora
    if (pujaGanadora.cliente?.usuario?.id) {
      const ganadorId = Number(pujaGanadora.cliente.usuario.id);
      
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
        
        // Actualizar el array de ganadores
        this.ganadores[this.indexLotes] = {
          numeroLote: this.lotes[this.indexLotes]?.id || (this.indexLotes + 1),
          clienteId: ganadorId,
          monto: Number(puja.monto)
        };
        
        return ganadorId;
      }
    }
    
    return null;
  }
  private esUsuarioGanador(ganadorId: number): boolean {
    const usuarioActual = localStorage.getItem('usuario_id');
    return usuarioActual !== null && Number(usuarioActual) === ganadorId;
  }

  /**
   * Maneja el pago exitoso del ganador.
   * Marca los lotes sin pagar como pagados y persiste en la base de datos.
   * Después del pago, crea automáticamente una invitación de chat con la casa de remate.
   */
  async onPaymentSuccess(paymentData: any): Promise<void> {
    console.log(`💳 PAGO EXITOSO: Usuario ${localStorage.getItem('usuario_id')} - Monto: $${this.paypalMonto} - Lotes pagados: ${this.lotesGanadosSinPagar.length}`);
    
    try {
      // PASO 1: Marcar lotes como pagados y cerrar modal de pago
      const lotesSinPagar = this.lotesGanadosSinPagar;
      console.log(`💰 PROCESANDO PAGO: Marcando ${lotesSinPagar.length} lotes como pagados:`, lotesSinPagar.map(l => `Lote ${l.numeroLote}: $${l.monto}`));
      
      // Marcar cada lote ganado como pagado en ambos arrays
      lotesSinPagar.forEach(ganador => {
        // Actualizar en this.lotes
        const lote = this.lotes.find(l => l.id === ganador.numeroLote);
        if (lote) {
          lote.pago = true;
          console.log(`✅ LOTE PAGADO: Lote ${lote.id} marcado como pagado en this.lotes`);
        }
        
        // Actualizar en this.subasta.lotes
        if (this.subasta?.lotes) {
          const loteSubasta = this.subasta.lotes.find(l => l.id === ganador.numeroLote);
          if (loteSubasta) {
            loteSubasta.pago = true;
            console.log(`✅ LOTE PAGADO: Lote ${loteSubasta.id} marcado como pagado en this.subasta.lotes`);
          }
        }

        // Buscar la puja ganadora de este lote
        const pujasLote = (lote?.pujas as pujaDto[]) || [];
        let pujaGanadora = null;
        if (pujasLote.length > 0) {
          pujaGanadora = pujasLote.reduce((max, p) => {
            if (p.monto > max.monto) return p;
            if (p.monto === max.monto) {
              return new Date(p.fechaHora) > new Date(max.fechaHora) ? p : max;
            }
            return max;
          }, pujasLote[0]);
        }
        
        if (!pujaGanadora || !pujaGanadora.id) {
          console.error('❌ No se encontró puja ganadora para el lote', ganador.numeroLote);
          console.error('❌ Datos del lote:', lote);
          console.error('❌ Pujas del lote:', pujasLote);
          return;
        }

        // Validar datos antes de crear factura
        if (!pujaGanadora.id || ganador.monto <= 0) {
          console.error('❌ Datos inválidos para crear factura:', {
            pujaId: pujaGanadora.id,
            monto: ganador.monto,
            loteId: ganador.numeroLote
          });
          return;
        }

        // Validar que la puja ganadora sea del cliente correcto
        const usuarioActual = localStorage.getItem('usuario_id');
        const clienteIdPuja = pujaGanadora.cliente?.usuario?.id;
        if (usuarioActual && clienteIdPuja && Number(usuarioActual) !== Number(clienteIdPuja)) {
          console.error('❌ La puja ganadora no pertenece al usuario actual:', {
            usuarioActual: Number(usuarioActual),
            clientePuja: Number(clienteIdPuja),
            pujaId: pujaGanadora.id
          });
          return;
        }

        // Crear facturaDto para cada lote pagado
        const factura: facturaDto = {
          id: null,
          puja_id: pujaGanadora.id,
          montoTotal: ganador.monto,
          condicionesDePago: 'Pago online',
          entrega: 'A coordinar',
          vendedor_id: null
        };

        console.log('📋 CREANDO FACTURA:', factura);

        this.facturaService.crearFactura(factura).subscribe({
          next: (facturaCreada) => {
            console.log('🧾 FACTURA CREADA EXITOSAMENTE:', facturaCreada);
          },
          error: (err) => {
            console.error('❌ ERROR AL CREAR FACTURA:', err);
            console.error('❌ Detalles del error:', {
              status: err.status,
              statusText: err.statusText,
              message: err.message,
              error: err.error
            });
          }
        });
      });
      this.pagando = false;
      
      // PASO 1.5: Persistir cambios en la base de datos
      if (this.subasta) {
        this.subastaService.updateSubasta(this.subasta).subscribe({
          next: (subastaActualizada) => {
            console.log(`💾 PERSISTENCIA EXITOSA: Estado de pago actualizado en BD para ${lotesSinPagar.length} lotes`);
            // Actualizar la subasta local con los datos del servidor
            this.subasta = subastaActualizada;
            
            // También actualizar this.lotes para mantener sincronización
            if (subastaActualizada.lotes) {
              this.lotes = subastaActualizada.lotes.map(lote => ({
                ...lote,
                subasta: {
                  id: this.subasta!.id,
                  fecha: this.subasta!.fecha,
                  duracionMinutos: this.subasta!.duracionMinutos,
                  nombre: this.subasta!.nombre,
                },
                pago: lote.pago
              }));
            }
          },
          error: (error) => {
            console.error('❌ ERROR EN PERSISTENCIA: Error al actualizar estado de pago en la base de datos:', error);
            // Aunque falle la persistencia, continuar con el proceso
          }
        });
      }
      
      // PASO 2: Obtener datos del ganador y casa de remate
      const usuarioActual = localStorage.getItem('usuario_id');
      const ganadorId = usuarioActual ? Number(usuarioActual) : (this.ganadores[this.indexLotes]?.clienteId || 0);
      const ganadorNombre = localStorage.getItem('usuario_nombre') || `Usuario ${ganadorId}`;
      
      if (!ganadorId || !this.subasta?.casa_remate) {
        alert('Pago exitoso! Por favor contacte a la casa de remate para coordinar la entrega.');
        return;
      }
      
      // PASO 3: Crear invitación de chat con notificaciones automáticas (como en test-chat)
      console.log(`💬 CREANDO CHAT: Ganador ${ganadorId} (${ganadorNombre}) con Casa de Remate ${this.subasta.casa_remate.usuario_id}`);
      
      const chatResult = await this.chatService.crearInvitacionChat(
        ganadorId,
        ganadorNombre,
        this.subasta.casa_remate.usuario_id || 0,
        this.subasta.casa_remate.usuario?.nombre || 'Casa de Remate'
      );

      // PASO 4: Manejar resultado del chat
      if (chatResult.success) {
        console.log(`✅ CHAT CREADO: Chat exitoso entre ganador ${ganadorId} y casa de remate ${this.subasta.casa_remate.usuario_id}`);
        this.chatRoomId = chatResult.chatId || `chat_${ganadorId}_${this.subasta.casa_remate.usuario_id}`;
        this.chatCreado = true;
        
        // Mostrar mensaje de éxito completo
        alert(`¡Pago exitoso por $${this.paypalMonto}! ${chatResult.message} Ambos usuarios recibirán notificaciones para chatear y coordinar la entrega del artículo.`);
        
      } else {
        console.error('❌ ERROR EN CHAT: Error al crear invitación de chat:', chatResult.message);
        alert(`Pago exitoso por $${this.paypalMonto}! Hubo un problema al crear la invitación de chat: ${chatResult.message} Por favor contacte directamente a la casa de remate para coordinar la entrega.`);
      }
      
    } catch (error) {
      console.error('❌ ERROR CRÍTICO EN PAGO: Error al crear invitación de chat después del pago:', error);
      const errorMessage = error && typeof error === 'object' && 'error' in error 
        ? (error as any).error?.message || (error as any).message 
        : 'Error desconocido';
        alert(`Pago exitoso por $${this.paypalMonto}! Hubo un error al crear la invitación de chat: ${errorMessage} Por favor contacte directamente a la casa de remate para coordinar la entrega.`);
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
   * Reabre el modal de pago cuando el usuario ya ganó lotes sin pagar
   */
  reabrirModalPago(): void {
    const lotesSinPagar = this.lotesGanadosSinPagar;
    
    // No permitir reabrir el modal si no hay lotes sin pagar
    if (lotesSinPagar.length === 0) {
      alert('Todos los lotes ganados ya han sido pagados.');
      return;
    }

    if (lotesSinPagar.length > 0) {
      this.paypalMonto = this.montoTotalGanadorSinPagar; // Usar monto total sin pagar
      this.paypalComponentKey = !this.paypalComponentKey; // Toggle para recrear componente
      this.pagando = true;
    } else {
      alert('No tienes lotes pendientes de pago.');
    }
  }

  // Métodos de verificación automática
  /**
   * Verifica si la subasta debe iniciarse automáticamente según la fecha y hora configuradas.
   * Configura verificaciones periódicas si la subasta está programada para el futuro.
   */
  private verificarInicioAutomaticoSubasta(): void {
    if (!this.subasta || !this.subasta.fecha || !this.subasta.duracionMinutos) {
      return;
    }

    const fechaSubasta = this.parsearFechaSubasta(this.subasta.fecha);
    if (!fechaSubasta) {
      return;
    }
    
    const ahora = new Date();
    const diferenciaMiliseundos = fechaSubasta.getTime() - ahora.getTime();
    
    if (this.subasta.activa) {
      this.manejarSubastaActiva(fechaSubasta, ahora);
      return;
    }

    if (fechaSubasta <= ahora) {
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
      console.log('[manejarSubastaActiva] tiempoTranscurridoMs:', tiempoTranscurridoMs, 'tiempoTranscurridoSegundos:', tiempoTranscurridoSegundos, 'duracionTotalSegundos:', duracionTotalSegundos, 'tiempoRestante:', tiempoRestante);
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
    
    this.intervalId = setInterval(() => {
      const ahora = new Date();
      const diferenciaMs = fechaSubasta.getTime() - ahora.getTime();
      
      if (diferenciaMs <= 0) {
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
    if (this.subasta) {
      this.subasta.activa = true;
      this.boton = true;
      this.timerInitialized = true;

      const ahora = new Date();
      const fechaSubasta = new Date(this.subasta.fecha);
      const tiempoRestanteMs = fechaSubasta!.getTime() + this.subasta.duracionMinutos! * 60000 - ahora.getTime();
      const tiempoRestanteSegundos = Math.max(0, Math.ceil(tiempoRestanteMs / 1000));

      this.timerState.tiempoRestanteSegundos = tiempoRestanteSegundos;
      this.timerState.timer = this.formatearTiempo(tiempoRestanteSegundos);
      this.timerState.timerActivo = true;

      if (tiempoRestanteSegundos > 0) {
        this.inicializarTimerWebSocket(tiempoRestanteSegundos);

      } else {
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
    this.startTimerDisplayInterval();
  }

  /**
   * Se ejecuta al desconectar del WebSocket
   */
  onWebSocketDisconnect(): void {
    this.stopTimerDisplayInterval();
  }

  /**
   * Inicia el interval para actualizar la UI del timer cada segundo
   */
  private startTimerDisplayInterval(): void {
    this.stopTimerDisplayInterval(); // Limpiar interval previo
    
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
  }

  /**
   * Detiene el interval del timer display
   */
  private stopTimerDisplayInterval(): void {
    if (this.timerDisplayInterval) {
      clearInterval(this.timerDisplayInterval);
      this.timerDisplayInterval = null;
    }
  }

  /**
   * MÉTODO OBSOLETO: Ya no se usa - se reemplazó por obtenerGanadoresDesdeServidor()
   * Inicializa el array de ganadores con el tamaño correcto (uno por lote)
   */
  private initializarArrayGanadores(): void {
    this.ganadores = this.lotes.map((lote, index) => ({
      numeroLote: lote.id || (index + 1),
      clienteId: 0,
      monto: 0
    }));
  }

  /**
   * MÉTODO OBSOLETO: Ya no se usa - se reemplazó por obtenerGanadoresDesdeServidor()
   * Sincroniza el array de ganadores basándose en las pujas reales de TODOS los lotes.
   * Este método debe llamarse al final de la subasta para asegurar que el array ganadores
   * refleje correctamente quién ganó cada lote.
   */
  private sincronizarGanadoresCompleto(): void {
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
        }, pujasLote[0]);
        
        // Obtener el ID del ganador
        let ganadorId = 0;
        if (pujaGanadora.cliente?.usuario?.id) {
          ganadorId = Number(pujaGanadora.cliente.usuario.id);
        }
        
        // Actualizar el array de ganadores
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
      }
    });
  }

  /**
   * Verifica y corrige los ganadores de todos los lotes consultando directamente Redis
   * Esta función debe ser llamada al finalizar la subasta para asegurar datos precisos
   */
  private async verificarYCorregirGanadores(): Promise<void> {
    console.log('🔍 INICIANDO VERIFICACIÓN DE GANADORES');
    
    for (let i = 0; i < this.lotes.length; i++) {
      const lote = this.lotes[i];
      if (!lote || !lote.id) continue;

      try {
        console.log(`🔍 Verificando lote ${i + 1} (ID: ${lote.id})`);
        
        // Obtener la puja actual desde Redis
        const response = await this.pujaService.obtenerPujaActual(lote.id).toPromise();
        
        if (response && response.puja_actual && response.puja_actual.monto > 0) {
          const pujaRealGanadora = response.puja_actual;
          const ganadorActual = this.ganadores[i];
          
          console.log(`📊 Lote ${i + 1}:`, {
            'Ganador registrado': ganadorActual,
            'Puja real en Redis': pujaRealGanadora
          });
          
          // Verificar si el ganador registrado coincide con la puja real
          const ganadorIncorrecto = !ganadorActual || 
                                   ganadorActual.clienteId !== pujaRealGanadora.cliente_id ||
                                   ganadorActual.monto !== pujaRealGanadora.monto;
          
          if (ganadorIncorrecto) {
            console.warn(`⚠️ GANADOR INCORRECTO EN LOTE ${i + 1}:`, {
              'Registrado': ganadorActual,
              'Real': pujaRealGanadora
            });
            
            // Corregir el ganador
            this.ganadores[i] = {
              numeroLote: lote.id,
              clienteId: pujaRealGanadora.cliente_id,
              monto: pujaRealGanadora.monto
            };
            
            console.log(`✅ GANADOR CORREGIDO EN LOTE ${i + 1}:`, this.ganadores[i]);
            
            // También actualizar la puja actual si es el lote activo
            if (i === this.indexLotes) {
              this.pujaActual = pujaRealGanadora.monto;
            }
          } else {
            console.log(`✅ Ganador correcto en lote ${i + 1}`);
          }
        } else {
          console.log(`📝 Lote ${i + 1} sin pujas`);
          // Asegurar que no hay ganador registrado para lotes sin pujas
          if (this.ganadores[i] && this.ganadores[i].monto > 0) {
            console.warn(`⚠️ Lote ${i + 1} sin pujas pero con ganador registrado, corrigiendo...`);
            this.ganadores[i] = {
              numeroLote: lote.id,
              clienteId: 0,
              monto: 0
            };
          }
        }
      } catch (error) {
        console.error(`❌ Error verificando lote ${i + 1}:`, error);
      }
    }
    
    console.log('🔍 VERIFICACIÓN DE GANADORES COMPLETADA');
    console.log('📋 GANADORES FINALES:', this.ganadores);
    
    // Forzar actualización de la UI
    this.cdr.detectChanges();
  }

  /**
   * Función utilitaria para validar y corregir valores numéricos
   * Asegura que el valor sea un número válido mayor o igual a 0
   */
  private validarNumero(valor: any, valorPorDefecto: number = 0, contexto: string = ''): number {
    const numero = Number(valor);
    if (isNaN(numero) || numero === undefined || numero === null || numero < 0) {
      if (contexto) {
        console.warn(`⚠️ [${contexto}] Valor inválido (${valor}), usando valor por defecto: ${valorPorDefecto}`);
      }
      return valorPorDefecto;
    }
    return numero;
  }

  /**
   * Función de depuración para verificar el estado de la subasta y el loteIndex
   */
  verificarEstadoSubasta(): void {
    if (!this.isRematador()) {
      alert('Solo el rematador puede verificar el estado');
      return;
    }

    console.log('🔍 ESTADO ACTUAL DE LA SUBASTA:');
    console.log('- ID Subasta:', this.subasta?.id);
    console.log('- Índice actual en frontend:', this.indexLotes);
    console.log('- LoteIndex en objeto subasta:', this.subasta?.loteIndex);
    console.log('- Total de lotes:', this.lotes.length);
    console.log('- Lote actual:', this.lotes[this.indexLotes]);

    // Hacer una consulta fresca al backend para verificar el estado real
    if (this.subasta?.id) {
      this.subastaService.getSubasta(this.subasta.id).subscribe({
        next: (subastaFresca) => {
          console.log('🔄 ESTADO EN BASE DE DATOS:');
          console.log('- LoteIndex en BD:', subastaFresca.loteIndex);
          console.log('- Objeto subasta completo:', subastaFresca);
          
          if (subastaFresca.loteIndex !== this.indexLotes) {
            console.warn('⚠️ INCONSISTENCIA DETECTADA:');
            console.warn('- Frontend:', this.indexLotes);
            console.warn('- Base de datos:', subastaFresca.loteIndex);
            
            const sincronizar = confirm(
              `Hay una inconsistencia entre el frontend (lote ${this.indexLotes + 1}) y la base de datos (lote ${(subastaFresca.loteIndex || 0) + 1}).\n\n` +
              '¿Desea sincronizar el frontend con la base de datos?'
            );
            
            if (sincronizar) {
              this.indexLotes = subastaFresca.loteIndex || 0;
              this.subasta!.loteIndex = this.indexLotes;
              this.cargarPujas(this.indexLotes);
              this.sendLoteChangeToWebSocket();
              alert('✅ Frontend sincronizado con la base de datos');
            }
          } else {
            alert('✅ Frontend y base de datos están sincronizados');
          }
        },
        error: (err) => {
          console.error('❌ Error consultando estado:', err);
          alert('Error al consultar el estado de la base de datos');
        }
      });
    }
  }

  /**
   * Obtiene los ganadores reales desde el servidor.
   * Reemplaza el array local con los datos del servidor para garantizar consistencia.
   */
  private async obtenerGanadoresDesdeServidor(): Promise<void> {
    if (!this.subasta?.id) {
      throw new Error('No hay subasta activa');
    }

    try {
      const ganadoresServidor = await this.subastaService.obtenerGanadores(this.subasta.id).toPromise();
      
      if (ganadoresServidor && ganadoresServidor.length > 0) {
        // Mapear los datos del servidor al formato local
        this.ganadores = ganadoresServidor.map((ganador: any) => ({
          numeroLote: ganador.loteId, // Usar loteId como numeroLote
          clienteId: ganador.clienteId,
          monto: ganador.monto
        }));
        
        console.log('✅ Ganadores actualizados desde servidor:', this.ganadores);
      } else {
        // Si no hay ganadores, inicializar array vacío
        this.initializarArrayGanadores();
        console.log('📝 No hay ganadores, inicializando array vacío');
      }
    } catch (error) {
      console.error('❌ Error al obtener ganadores del servidor:', error);
      // Fallback: usar sincronización local
      this.sincronizarGanadoresCompleto();
    }
  }
}
