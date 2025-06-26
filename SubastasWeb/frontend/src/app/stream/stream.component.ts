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
import { notificacionUsuarioDto } from '../../models/notificacionDto';

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
  
  // Interval para actualizar la UI del timer en tiempo real
  private timerDisplayInterval: any;

  // Variables para modal y pago
  modalVideo: boolean = false;
  video: string = '';
  pagando: boolean = false;
  pagado: boolean = false; // Variable para rastrear si ya se completó el pago
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
      return false;
    }
    
    const usuarioId = Number(usuarioActual);
    
    // MÉTODO 1: Verificar en tiempo real durante la subasta activa
    if (this.subasta?.activa && this.timerState.timerActivo) {
      // Durante la subasta, verificar si es ganador del lote actual
      const ganadorLoteActual = this.ganadores[this.indexLotes];
      if (ganadorLoteActual && ganadorLoteActual.clienteId === usuarioId && ganadorLoteActual.monto > 0) {
        return true;
      }
    }
    
    // MÉTODO 2: Al final de la subasta, verificar todos los lotes ganados
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
   * Solo se muestra si es ganador Y no ha pagado todavía
   */
  get mostrarBotonPago(): boolean {
    return this.esGanador && !this.pagado && !this.pagando;
  }

  /**
   * Getter que determina si debe mostrar el mensaje de "Pago Completado"
   * Solo se muestra si es ganador Y ya ha pagado
   */
  get mostrarMensajePagado(): boolean {
    return this.esGanador && this.pagado && !this.pagando;
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
        const duracionTotalSegundos = this.subasta.duracionMinutos * 60;
        const tiempoRestante = Math.max(0, duracionTotalSegundos - tiempoTranscurridoSegundos);
        
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
    
    // Actualizar el backend de forma asíncrona
    this.subastaService.updateSubasta(this.subasta).subscribe({
      next: () => {
        // Desmarcar navegación después de éxito
        setTimeout(() => {
          this.rematadorNavigating = false;
        }, 1000);
      },
      error: (err) => {
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
    
    // Actualizar el backend de forma asíncrona
    this.subastaService.updateSubasta(this.subasta).subscribe({
      next: () => {
        // Desmarcar navegación después de éxito
        setTimeout(() => {
          this.rematadorNavigating = false;
        }, 1000);
      },
      error: (err) => {
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
    
    this.pujaActual = Number(this.pujas.length > 0 ? Math.max(...this.pujas.map(p => p.monto)) : 0);
    if (this.pujaActual === 0) {
      this.pujaActual = Number(this.lotes[loteIndex].pujaMinima);
    }
    this.pujaRapida = Number(this.pujaActual) + 1;
    this.pujaComun = null;
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

    // VALIDACIÓN 5: Puja mínima
    if (monto < loteActual.pujaMinima) {
      return { valida: false, error: `El monto debe ser mayor a $${loteActual.pujaMinima}` };
    }

    // VALIDACIÓN 6: Superar puja actual
    if (monto <= this.pujaActual) {
      return { valida: false, error: `El monto debe ser mayor a la puja actual de $${this.pujaActual}` };
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
      alert(`No se puede realizar la puja: ${validacion.error}`);
      this.pujaRapida = null; // Limpiar el valor para evitar confusión
      return;
    }

    const puja = this.crearPujaBase(this.pujaRapida!);
    this.enviarPuja(puja);
  }

  crearPujaComun(): void {
    const validacion = this.validarPuja(this.pujaComun);
    
    if (!validacion.valida) {
      alert(`No se puede realizar la puja: ${validacion.error}`);
      this.pujaComun = null; // Limpiar el valor para evitar confusión
      return;
    }

    const puja = this.crearPujaBase(this.pujaComun!);
    this.enviarPuja(puja);
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

    this.subastaService.getClienteMail(puja.cliente_id).subscribe({
      next: (mail) => {
        if (!mail) {
          return;
        }
        this.clienteMail = mail;
        
        const email: mailDto = {
          email: this.clienteMail,
          asunto: `Puja realizada en la subasta ${this.subasta?.nombre || 'desconocida'}`,
          mensaje: `Se ha realizado una puja de $${puja.monto} en el lote ${this.lotes[this.indexLotes].id} de la subasta ${this.subasta?.nombre || 'desconocida'}.`
        };

        this.subastaService.enviarMail(email).subscribe({
          next: (response) => console.log('📧 Email de puja enviado exitosamente'),
          error: (error) => console.error('Error al enviar email:', error)
        });

       
        if (!this.ganadores[this.indexLotes]) {
          this.ganadores[this.indexLotes] = {
            numeroLote: this.lotes[this.indexLotes].id || (this.indexLotes + 1),
            clienteId: puja.cliente_id || 0,
            monto: Number(puja.monto)
          };
          console.log(`🏆 Nuevo ganador en lote ${this.indexLotes}: Cliente ${puja.cliente_id} con $${puja.monto}`);
        } else {
          
          this.ganadores[this.indexLotes].clienteId = puja.cliente_id || 0;
          this.ganadores[this.indexLotes].monto = Number(puja.monto); // IMPORTANTE: Actualizar el monto también
         
        }

        this.pujaService.crearPuja(puja).subscribe({
          next: (data) => {
            console.log('💰 Puja realizada exitosamente: $' + data.monto);

            this.pujaActual = data.monto;
            this.pujaRapida = data.monto + 1;
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
                  imagen: '' // Campo imagen vacío por defecto
                }
              }
            };
            this.pujas.push(nuevaPuja);

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
        next: (notificacion) => console.log('🔔 Notificación de umbral superado enviada'),
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
        console.log('🌐 WebSocket conectado exitosamente a la subasta');
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

    if (bidData.bidAmount > this.pujaActual) {
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

      if (this.lotes[this.indexLotes].umbral < bidData.bidAmount && !this.umbralSuperado) {
        this.umbralSuperado = true;
      }
      
      // Forzar detección de cambios
      this.cdr.detectChanges();
    }
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
      
      // Actualizar estado local con los datos del servidor
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
    
    // PASO 2: SINCRONIZAR GANADORES DE TODOS LOS LOTES
    this.sincronizarGanadoresCompleto();
    
    // PASO 3: Determinar ganador del lote actual
    const ganadorId = this.encontrarGanador();
    
    // PASO 4: Si el usuario actual es ganador de algún lote, mostrar PayPal con el total
    if (this.lotesGanadosPorUsuario.length > 0) {
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
  }



  private enviarNotificacionesFinalizacion(ganadorId: number): void {
    const casaRemateId = this.subasta?.casaremate?.usuario_id;
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
   * Después del pago, crea automáticamente una invitación de chat con la casa de remate.
   */
  async onPaymentSuccess(paymentData: any): Promise<void> {
    console.log('💰 Pago exitoso: $' + this.paypalMonto);
    
    try {
      // PASO 1: Marcar como pagado y cerrar modal de pago
      this.pagado = true;
      this.pagando = false;
      
      // PASO 2: Obtener datos del ganador y casa de remate
      const usuarioActual = localStorage.getItem('usuario_id');
      const ganadorId = usuarioActual ? Number(usuarioActual) : (this.ganadores[this.indexLotes]?.clienteId || 0);
      const ganadorNombre = localStorage.getItem('usuario_nombre') || `Usuario ${ganadorId}`;
      
      if (!ganadorId || !this.subasta?.casaremate) {
        alert('Pago exitoso! Por favor contacte a la casa de remate para coordinar la entrega.');
        return;
      }

      // PASO 3: Crear invitación de chat con notificaciones automáticas (como en test-chat)
      const chatResult = await this.chatService.crearInvitacionChat(
        ganadorId,
        ganadorNombre,
        this.subasta.casaremate.usuario_id || 0,
        this.subasta.casaremate.usuario?.nombre || 'Casa de Remate'
      );

      // PASO 4: Manejar resultado del chat
      console.log('💬 Chat creado después del pago:', chatResult);
      if (chatResult.success) {
        this.chatRoomId = chatResult.chatId || `chat_${ganadorId}_${this.subasta.casaremate.usuario_id}`;
        this.chatCreado = true;
        
        console.log('💬 Invitación de chat creada exitosamente con notificaciones automáticas');
        
        // Verificar que las notificaciones se hayan enviado correctamente
        setTimeout(() => {
          this.verificarNotificacionesChat(ganadorId, this.subasta!.casaremate.usuario_id || 0);
        }, 1000); // Esperar 1 segundo para que el backend procese las notificaciones
        
        // Mostrar mensaje de éxito completo
        alert(`¡Pago exitoso por $${this.paypalMonto}! 
        
${chatResult.message}

Ambos usuarios recibirán notificaciones para chatear y coordinar la entrega del artículo.`);
        
      } else {
        console.error('❌ Error al crear invitación de chat:', chatResult.message);
        alert(`Pago exitoso por $${this.paypalMonto}!

Hubo un problema al crear la invitación de chat: ${chatResult.message}

Por favor contacte directamente a la casa de remate para coordinar la entrega.`);
      }
      
    } catch (error) {
      console.error('❌ Error al crear invitación de chat después del pago:', error);
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
    // No permitir reabrir el modal si ya se completó el pago
    if (this.pagado) {
      alert('El pago ya fue completado exitosamente.');
      return;
    }

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
    
    if (this.subasta.activa) {
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
      const fechaSubasta = this.parsearFechaSubasta(this.subasta.fecha);
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
          console.log(`🏆 Nuevo ganador en lote ${index} (ID: ${lote.id}): Cliente ${ganadorId} con $${pujaGanadora.monto}`);
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
          console.log(`📭 Lote ${index} (ID: ${lote.id}) - Sin pujas, inicializado sin ganador`);
        } else {
          this.ganadores[index].clienteId = 0;
          this.ganadores[index].monto = 0; 
        }
        
        console.log(`📭 Lote ${index} (ID: ${lote.id}) - Sin pujas`);
      }
    });
  }

  /**
   * Verifica que las notificaciones de chat se hayan enviado correctamente
   * después de crear la invitación de chat post-pago
   */
  private verificarNotificacionesChat(usuario1Id: number, usuario2Id: number): void {
    console.log('🔔 Verificando notificaciones de chat para usuarios:', usuario1Id, usuario2Id);
    
    // Verificar notificaciones del ganador (usuario actual)
    this.notificacionService.obtenerNotificacionesPublico(usuario1Id).subscribe({
      next: (notificaciones: notificacionUsuarioDto[]) => {
        const notificacionesChat = notificaciones.filter(n => n.esMensajeChat);
        console.log(`🔔 Notificaciones de chat para usuario ${usuario1Id}:`, notificacionesChat.length);
        
        if (notificacionesChat.length > 0) {
          console.log('✅ Notificación de chat enviada exitosamente al ganador');
        } else {
          console.warn('⚠️ No se encontraron notificaciones de chat para el ganador');
        }
      },
      error: (error) => {
        console.error('❌ Error al verificar notificaciones del ganador:', error);
      }
    });

    // Verificar notificaciones de la casa de remate
    this.notificacionService.obtenerNotificacionesPublico(usuario2Id).subscribe({
      next: (notificaciones: notificacionUsuarioDto[]) => {
        const notificacionesChat = notificaciones.filter(n => n.esMensajeChat);
        console.log(`🔔 Notificaciones de chat para casa de remate ${usuario2Id}:`, notificacionesChat.length);
        
        if (notificacionesChat.length > 0) {
          console.log('✅ Notificación de chat enviada exitosamente a la casa de remate');
        } else {
          console.warn('⚠️ No se encontraron notificaciones de chat para la casa de remate');
        }
      },
      error: (error) => {
        console.error('❌ Error al verificar notificaciones de la casa de remate:', error);
      }
    });
  }
}
