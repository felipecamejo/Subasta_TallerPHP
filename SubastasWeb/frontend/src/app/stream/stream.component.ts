import { Component, OnDestroy } from '@angular/core';
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
  tiempoRestanteSegundos?: number; // Para sincronización
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

  get timer(): string {
    return this.timerState.timer;
  }

  get timerActivo(): boolean {
    return this.timerState.timerActivo;
  }

  get timerDisplayText(): string {
    if (!this.subasta?.activa && !this.timerState.timerActivo) {
      return "Sin iniciar";
    }
    return this.timerState.timer;
  }

  get timerCssClass(): string {
    if (!this.subasta?.activa && !this.timerState.timerActivo) {
      return "timer-input sin-iniciar";
    } else if (this.timerState.timerActivo) {
      return "timer-input activo";
    } else if (this.timerState.timer === TIMER_CONSTANTS.FINISHED_MESSAGE) {
      return "timer-input finalizada";
    }
    return "timer-input";
  }

  get puedeNavegerLotes(): boolean {
    return !!(this.subasta?.activa && this.timerState.timerActivo);
  }

  get puedeIniciarSubasta(): boolean {
    return !!(this.subasta && !this.subasta.activa && this.subasta.duracionMinutos && this.subasta.duracionMinutos > 0);
  }

  constructor(
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private subastaService: SubastaService,
    private pujaService: PujaService,
    private websocketService: WebsocketService,
    private notificacionService: NotificacionService,
    private chatService: ChatService
  ) {
  }

  modalVideo: boolean = false;
  video: string = '';

  public initializeVideo(videoId: string | undefined): void {

    this.modalVideo = false;

    //DN8P7kukaGo

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
          this.sendLoteChangeToWebSocket(); // Notificar via WebSocket
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
          this.sendLoteChangeToWebSocket(); // Notificar via WebSocket
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
        this.boton = this.subasta.activa;
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

        console.log('Lotes cargados:', this.lotes);
        //console.log('🔍 DEBUG - Subasta completa:', this.subasta);
        //console.log('🔍 DEBUG - Rematador:', this.subasta.rematador);
        //console.log('🔍 DEBUG - Usuario logueado:', localStorage.getItem('usuario_id'));

        
        if(this.subasta.videoId && this.subasta.videoId.trim() !== '') {
          console.log('Inicializando video con ID:', this.subasta.videoId);
          this.initializeVideo(this.subasta.videoId);
        } else {
          console.log('No hay videoId válido para inicializar');
          console.log('Condición falló - videoId:', !!this.subasta.videoId, 'trim:', this.subasta.videoId?.trim());
        }
        
        this.cargarPujas(this.indexLotes);

        if (this.subasta.activa && this.subasta.duracionMinutos && !this.timerInitialized) {
          this.timerInitialized = true;
          
          if (this.isRematador()) {
            // Si soy rematador y la subasta está activa, asumir duración completa
            // (En una implementación real, deberías guardar el tiempo restante en el backend)
            const tiempoInicialSegundos = this.subasta.duracionMinutos * 60;
            this.timerState.timer = this.formatearTiempo(tiempoInicialSegundos);
            this.timerState.tiempoRestanteSegundos = tiempoInicialSegundos;
            
            requestAnimationFrame(() => {
              this.iniciarTimer();
            });
          } else {
            // Si no soy rematador, mostrar estado "esperando sincronización"
            this.timerState.timer = "Sincronizando...";
            this.timerState.timerActivo = true; // Marcar como activo para recibir actualizaciones
            // El timer se sincronizará cuando reciba la primera actualización por WebSocket
          }
        }

        // Configurar WebSocket
        this.setupWebSocketConnection();
      },
      error: (err) => {
        console.error('Error al cargar subasta:', err);
      }
    });
  }

  iniciarSubasta() {
    if (!this.subasta || this.subasta.activa) {
      console.warn('No se puede iniciar la subasta: subasta ya activa o datos faltantes');
      return;
    }

    if (!this.subasta.duracionMinutos || this.subasta.duracionMinutos <= 0) {
      console.warn('No se puede iniciar la subasta: duración inválida');
      alert('Error: La subasta debe tener una duración válida en minutos');
      return;
    }

    this.boton = true;
    this.subasta.activa = true;

    this.subastaService.updateSubasta(this.subasta).subscribe({
      next: () => {
        console.log('Subasta actualizada correctamente');
        if (!this.timerInitialized) {
          this.timerInitialized = true;
          // Mostrar el tiempo inicial basado en la duración
          const tiempoInicialSegundos = this.subasta!.duracionMinutos * 60;
          this.timerState.timer = this.formatearTiempo(tiempoInicialSegundos);
          this.timerState.tiempoRestanteSegundos = tiempoInicialSegundos;
          
          requestAnimationFrame(() => {
            this.iniciarTimer();
            // Si soy rematador, enviar estado inicial del timer
            if (this.isRematador()) {
              this.sendTimerUpdateToWebSocket(tiempoInicialSegundos);
            }
          });
        }
      },
      error: (err) => {
        console.error('Error al actualizar subasta:', err);
        this.boton = false;
        this.subasta!.activa = false;
      }
    });
  }

  pagando: boolean = false;
  paypalMonto: number = 0;


  iniciarTimer(tiempoInicialSegundos?: number) {
    if (this.timerState.timerActivo) {
      console.warn('Timer ya está activo, ignorando nueva inicialización');
      return;
    }

    this.detenerTimer();

    if (!this.subasta?.duracionMinutos) {
      console.warn('No hay duración de subasta definida');
      return;
    }

    // Usar tiempo inicial proporcionado o la duración completa
    let tiempoRestanteSegundos = tiempoInicialSegundos ?? (this.subasta.duracionMinutos * 60);
    this.timerState.tiempoRestanteSegundos = tiempoRestanteSegundos;

    console.log('Iniciando timer con tiempo restante:', tiempoRestanteSegundos, 'segundos');

    this.timerState.timerActivo = true;
    
    // Mostrar tiempo inicial
    this.timerState.timer = this.formatearTiempo(tiempoRestanteSegundos);

    // Solo el rematador ejecuta el timer maestro
    const esRematador = this.isRematador();
    console.log('🔍 Es rematador?', esRematador);

    if (esRematador) {
      // REMATADOR: Ejecuta el timer maestro y envía actualizaciones
      this.timerState.timerSubscription = interval(TIMER_CONSTANTS.INTERVAL_MS).pipe(
        takeWhile(() => this.timerState.timerActivo)
      ).subscribe({
        next: () => {
          try {
            if (this.timerState.tiempoRestanteSegundos! > 0) {
              this.timerState.tiempoRestanteSegundos!--;
              this.timerState.timer = this.formatearTiempo(this.timerState.tiempoRestanteSegundos!);
              
              // Enviar actualización cada 3 segundos para optimizar WebSocket
              if (this.timerState.tiempoRestanteSegundos! % 3 === 0 || this.timerState.tiempoRestanteSegundos! <= 10) {
                this.sendTimerUpdateToWebSocket(this.timerState.tiempoRestanteSegundos!);
              }
            } else {
              this.timerState.timer = TIMER_CONSTANTS.FINISHED_MESSAGE;
              this.timerState.tiempoRestanteSegundos = 0;
              
              // Notificar finalización
              this.sendTimerUpdateToWebSocket(0);
              this.manejarFinalizacionSubasta();
              this.detenerTimer();
            }
          } catch (error) {
            console.error('Error en timer:', error);
            this.detenerTimer();
          }
        },
        error: (error) => {
          console.error('Error en suscripción del timer:', error);
          this.detenerTimer();
        }
      });
    } else {
      // USUARIOS: Ejecutan timer local que se sincroniza con actualizaciones del rematador
      console.log('👀 Usuario: Iniciando timer local sincronizado');
      this.iniciarTimerLocalUsuario();
    }
  }

  detenerTimer(): void {
    this.timerState.timerActivo = false;
    if (this.timerState.timerSubscription) {
      this.timerState.timerSubscription.unsubscribe();
      this.timerState.timerSubscription = undefined;
    }
  }

  /**
   * Inicia un timer local para usuarios que se sincroniza con las actualizaciones del rematador
   */
  private iniciarTimerLocalUsuario(): void {
    console.log('🕐 Usuario: Iniciando timer local con tiempo inicial:', this.timerState.tiempoRestanteSegundos);
    
    if (!this.timerState.tiempoRestanteSegundos || this.timerState.tiempoRestanteSegundos <= 0) {
      console.warn('⚠️ No se puede iniciar timer local: tiempo inválido');
      return;
    }

    this.timerState.timerSubscription = interval(TIMER_CONSTANTS.INTERVAL_MS).pipe(
      takeWhile(() => this.timerState.timerActivo)
    ).subscribe({
      next: () => {
        try {
          if (this.timerState.tiempoRestanteSegundos! > 0) {
            this.timerState.tiempoRestanteSegundos!--;
            this.timerState.timer = this.formatearTiempo(this.timerState.tiempoRestanteSegundos!);
            
            console.log('🕐 Usuario timer local:', this.timerState.timer);
          } else {
            this.timerState.timer = TIMER_CONSTANTS.FINISHED_MESSAGE;
            this.timerState.tiempoRestanteSegundos = 0;
            this.timerState.timerActivo = false;
            this.detenerTimer();
          }
        } catch (error) {
          console.error('Error en timer local del usuario:', error);
          this.detenerTimer();
        }
      },
      error: (error) => {
        console.error('Error en suscripción del timer local:', error);
        this.detenerTimer();
      }
    });
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

  ngOnDestroy(): void {
    this.detenerTimer();
    this.subastaSubscription?.unsubscribe();
    this.timerInitialized = false;

    // Limpiar suscripciones WebSocket
    this.websocketSubscriptions.forEach(sub => sub.unsubscribe());
    this.websocketSubscriptions = [];

    // Salir de la subasta WebSocket
    if (this.subasta?.id) {
      this.websocketService.leaveAuction(
        this.subasta.id,
        this.clienteID || 0,
        'Usuario'
      );
    }
  }

  //-------------------------------------------pujas--------------------------------------

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
    this.pujaRapida = this.pujaActual+ 1

    const validacion = this.validarPuja(this.pujaRapida);
    
    if (!validacion.valida) {
      console.error('Error de validación:', validacion.error);
      return;
    }

    const puja = this.crearPujaBase(this.pujaRapida!);
    this.enviarPuja(puja);
  }

  crearPujaComun(): void {
    console.log('Puja común:', this.pujaComun);
    const validacion = this.validarPuja(this.pujaComun);
    
    if (!validacion.valida) {
      console.error('Error de validación:', validacion.error);
      return;
    }

    const puja = this.crearPujaBase(this.pujaComun!);
    this.enviarPuja(puja);
  }

  clienteID: number | null = null;
  clienteMail: string | null = null;

  private enviarPuja(puja: PujaRequest): void {
    console.log('🔍 Enviando puja completa:', puja);
    console.log('🔍 Datos de la puja:', {
      fechaHora: puja.fechaHora,
      monto: puja.monto,
      cliente_id: puja.cliente_id,
      lote_id: puja.lote_id,
      loteActual: this.lotes[this.indexLotes]
    });

    // Validar datos antes de enviar
    if (!puja.lote_id || puja.lote_id <= 0) {
      console.error('❌ Error: lote_id inválido:', puja.lote_id);
      alert('Error: ID de lote inválido');
      return;
    }

    // Validar que el usuario esté logueado
    const usuarioId = localStorage.getItem('usuario_id');
    if (!usuarioId) {
      console.error('❌ Error: Usuario no está logueado');
      alert('Debe iniciar sesión para realizar una puja');
      return;
    }

    // Actualizar el cliente_id con el usuario logueado si es null
    if (puja.cliente_id === null) {
      puja.cliente_id = Number(usuarioId);
      console.log('🔄 Actualizando cliente_id con usuario logueado:', puja.cliente_id);
    }

    this.subastaService.getClienteMail(puja.cliente_id).subscribe({
      next: (mail) => {
        if (!mail) {
          console.error('No se pudo obtener el email del cliente');
          return;
        }
        this.clienteMail = mail;
        console.log('Email del cliente:', this.clienteMail);
        
        const email: mailDto = {
          email: this.clienteMail,
          asunto: `Puja realizada en la subasta ${this.subasta?.nombre || 'desconocida'}`,
          mensaje: `Se ha realizado una puja de $${puja.monto} en el lote ${this.lotes[this.indexLotes].id} de la subasta ${this.subasta?.nombre || 'desconocida'}.`
        };

        this.subastaService.enviarMail(email).subscribe({
          next: (response) => {
            console.log('Email enviado exitosamente:', response);
          },
          error: (error) => {
            console.error('Error al enviar email:', error);
          }
        });

        this.clienteID = puja.cliente_id;

        // Primero persistir en base de datos, luego enviar por WebSocket
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

            // Solo enviar por WebSocket después de la persistencia exitosa
            this.sendWebSocketBid(puja);

            if (this.lotes[this.indexLotes].umbral < data.monto && !this.umbralSuperado) {
              this.umbralSuperado = true;

              const casaRemateId = this.subasta?.casaremate?.usuario_id;
              if (casaRemateId) {
                this.notificacionService.crearNotificacion(
                  "Umbral Superado", 
                  `El lote ID: ${this.lotes[this.indexLotes].id} ha superado su umbral de $${this.lotes[this.indexLotes].umbral}. Nueva puja: $${data.monto}`, 
                  casaRemateId, 
                  false, 
                  0
                ).subscribe({
                  next: (notificacion) => {
                    console.log('Notificación de umbral superado creada:', notificacion);
                  },
                  error: (error) => {
                    console.error('Error al crear notificación de umbral:', error);
                  }
                });
              } else {
                console.warn('No se pudo encontrar el ID del usuario del rematador para enviar la notificación de umbral');
              }
            }

            this.actualizarDatosSinSobrescribir();
            this.limpiarCamposPuja();
          },
          error: (err) => {
            console.error('Error al crear la puja en BD:', err);
            // No enviar por WebSocket si la persistencia falló
            alert('Error al procesar la puja. Por favor, intente nuevamente.');
          }
        });
      },
      error: (err) => {
        console.error('Error al obtener el email del cliente:', err);
      }
    });
  }

  private actualizarDatos(): void {
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
        this.cargarPujas(this.indexLotes);
      },
      error: (err) => {
        console.error('Error al actualizar datos:', err);
      }
    });
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

  private limpiarCamposPuja(): void {
    this.pujaComun = null;
  }
 
  //==================== WEBSOCKET INTEGRATION ====================

  private setupWebSocketConnection(): void {
    if (!this.subasta?.id) return;

    console.log('🧪 WebSocket conectado?', this.websocketService.isConnected());
    console.log('🧪 Socket ID:', this.websocketService.getSocketId());

    // Esperar un poco para que la conexión se establezca
    setTimeout(() => {
      console.log('🧪 WebSocket conectado después del timeout?', this.websocketService.isConnected());
      
      // Unirse a la subasta en WebSocket
      this.websocketService.joinAuction(
        this.subasta!.id!,
        this.clienteID || 999, // temporal, debería venir del usuario logueado
        'TestUser' // temporal, debería venir del usuario logueado
      );

      console.log('🧪 Enviado join_auction para subasta:', this.subasta!.id);
    }, 1000);

    // Escuchar confirmación de unión a subasta
    const auctionJoinedSubscription = this.websocketService.onAuctionJoined().subscribe({
      next: (data) => {
        console.log('✅ Confirmación: Te uniste a la subasta', data.auctionId);
      }
    });

    // Escuchar nuevas pujas en tiempo real
    const bidSubscription = this.websocketService.onBidReceived().subscribe({
      next: (bidData) => {
        console.log('Nueva puja recibida via WebSocket:', bidData);
        this.handleNewBidFromWebSocket(bidData);
      },
      error: (err) => console.error('Error en WebSocket bid:', err)
    });

    // Escuchar usuarios que se unen
    const userJoinedSubscription = this.websocketService.onUserJoined().subscribe({
      next: (userData) => {
        console.log('Usuario se unió:', userData);
        // Aquí puedes mostrar notificaciones de usuarios conectados
      }
    });

    // Escuchar cambios de lote
    const loteUpdateSubscription = this.websocketService.onLoteUpdated().subscribe({
      next: (loteData) => {
        console.log('Lote actualizado via WebSocket:', loteData);
        this.handleLoteUpdateFromWebSocket(loteData);
      }
    });

    // Escuchar actualizaciones del timer
    const timerSubscription = this.websocketService.onTimerUpdated().subscribe({
      next: (timerData) => {
        console.log('⏰ Timer actualizado via WebSocket:', timerData);
        this.handleTimerUpdateFromWebSocket(timerData);
      }
    });

    // Escuchar sincronización de estado
    const stateSubscription = this.websocketService.onAuctionStateSync().subscribe({
      next: (stateData) => {
        console.log('🔄 Sincronizando estado de la subasta:', stateData);
        this.handleAuctionStateSync(stateData);
      }
    });

    // Escuchar nuevos mensajes de chat - Removido porque el chat es una página separada
    // const chatMessageSubscription = this.websocketService.onNewMessage().subscribe({
    //   next: (messageData) => {
    //     console.log('Mensaje de chat recibido:', messageData);
    //   },
    //   error: (err) => console.error('Error en WebSocket chat:', err)
    // });

    this.websocketSubscriptions.push(
      auctionJoinedSubscription,
      bidSubscription,
      userJoinedSubscription,
      loteUpdateSubscription,
      timerSubscription,
      stateSubscription
      // chatMessageSubscription - removido
    );
  }

  private handleNewBidFromWebSocket(bidData: any): void {
     console.log('🧪 PUJA RECIBIDA VIA WEBSOCKET:', bidData);
    console.log('🧪 Lote actual:', this.lotes[this.indexLotes]?.id);
    console.log('🧪 Puja es para lote actual?', bidData.loteId === this.lotes[this.indexLotes]?.id);


    // Solo actualizar si la puja es para el lote actual
    if (bidData.loteId !== this.lotes[this.indexLotes]?.id){ 
      console.log('🧪 Puja ignorada: no es para el lote actual');
      return;
    } 

    console.log('🧪 Actualizando puja actual de', this.pujaActual, 'a', bidData.bidAmount);

    // Actualizar puja actual
    if (bidData.bidAmount > this.pujaActual) {
      this.pujaActual = bidData.bidAmount;
      this.pujaRapida = bidData.bidAmount + 1;

      // Crear nueva puja para mostrar en la lista
      const nuevaPuja: pujaDto = {
        id: Date.now(), // temporal
        fechaHora: new Date(bidData.timestamp),
        monto: bidData.bidAmount,
        lote: this.lotes[this.indexLotes],
        factura: null as any,
        cliente: null as any
      };

      this.pujas.push(nuevaPuja);

      // Verificar umbral
      if (this.lotes[this.indexLotes].umbral < bidData.bidAmount && !this.umbralSuperado) {
        this.umbralSuperado = true;
      }
    }
  }

  private handleLoteUpdateFromWebSocket(loteData: any): void {
    // Actualizar índice de lote si cambió
    if (loteData.newLoteIndex !== this.indexLotes) {
      this.indexLotes = loteData.newLoteIndex;
      this.cargarPujas(this.indexLotes);
      this.umbralSuperado = false;
    }
  }

  private handleAuctionStateSync(stateData: any): void {
    console.log('🔄 Aplicando sincronización de estado:', stateData);
    
    // Sincronizar índice de lote si es diferente
    if (stateData.loteIndex !== undefined && stateData.loteIndex !== this.indexLotes) {
      console.log(`🔄 Sincronizando lote: ${this.indexLotes} → ${stateData.loteIndex}`);
      this.indexLotes = stateData.loteIndex;
      this.cargarPujas(this.indexLotes);
      this.umbralSuperado = false;
    }
    
    // Sincronizar puja actual si hay una más reciente
    if (stateData.lastBidData && stateData.lastBidData.loteId === this.lotes[this.indexLotes]?.id) {
      const bidData = stateData.lastBidData;
      console.log(`🔄 Sincronizando última puja: ${bidData.bidAmount}`);
      
      if (bidData.bidAmount > this.pujaActual) {
        this.pujaActual = bidData.bidAmount;
        this.pujaRapida = bidData.bidAmount + 1;
        
        // Agregar la puja a la lista si no existe
        const existingBid = this.pujas.find(p => 
          p.monto === bidData.bidAmount && 
          Math.abs(new Date(p.fechaHora).getTime() - new Date(bidData.timestamp).getTime()) < 5000
        );
        
        if (!existingBid) {
          const nuevaPuja: pujaDto = {
            id: Date.now(), // temporal
            fechaHora: new Date(bidData.timestamp),
            monto: bidData.bidAmount,
            lote: this.lotes[this.indexLotes],
            factura: null as any,
            cliente: null as any
          };
          this.pujas.push(nuevaPuja);
          
          // Verificar umbral
          if (this.lotes[this.indexLotes].umbral < bidData.bidAmount && !this.umbralSuperado) {
            this.umbralSuperado = true;
          }
          
          console.log('✅ Puja sincronizada agregada a la lista');
        }
      }
    }
  }

  private sendWebSocketBid(puja: PujaRequest): void {
    if (!this.subasta?.id) return;

    console.log('🧪 ENVIANDO PUJA VIA WEBSOCKET:', {
      subastaId: this.subasta.id,
      clienteID: this.clienteID || 999,
      monto: puja.monto,
      loteId: puja.lote_id
    });

    this.websocketService.sendBid(
      this.subasta.id,
      this.clienteID || 999, // Usar 999 en lugar de 0 para evitar que sea falsy
      'Usuario', // temporal
      puja.monto,
      puja.lote_id
    );

    console.log('🧪 Puja enviada via WebSocket ✅');
  }

  private sendLoteChangeToWebSocket(): void {
    if (!this.subasta?.id) return;

    const loteData = {
      loteId: this.lotes[this.indexLotes]?.id,
      loteInfo: this.lotes[this.indexLotes]
    };

    console.log('📡 Enviando cambio de lote via WebSocket:', {
      auctionId: this.subasta.id,
      newLoteIndex: this.indexLotes,
      loteData
    });

    this.websocketService.sendLoteChange(
      this.subasta.id,
      this.indexLotes,
      loteData
    );
  }

  /**
   * Envía actualizaciones del timer por WebSocket (solo rematador)
   */
  private sendTimerUpdateToWebSocket(tiempoRestanteSegundos: number): void {
    if (!this.subasta?.id) {
      console.warn('❌ No se puede enviar timer update: no hay subasta ID');
      return;
    }

    console.log('📡 Rematador enviando actualización de timer:', {
      auctionId: this.subasta.id,
      tiempoRestante: tiempoRestanteSegundos,
      timestamp: new Date().toISOString()
    });

    this.websocketService.sendTimerUpdate(
      this.subasta.id,
      tiempoRestanteSegundos
    );
  }

  /**
   * Maneja la finalización de la subasta (solo rematador)
   */
  private manejarFinalizacionSubasta(): void {
    // Encontrar al ganador (quien tiene la puja más alta)
    const ganadorId = this.encontrarGanador();
    
    if(ganadorId && this.esUsuarioGanador(ganadorId)) {
      this.paypalMonto = this.pujaActual;
      this.pagando = true;
      
      const chatId = 0;

      this.notificacionService.crearNotificacion("Subasta finalizada", "Usted ha ganado la subasta por el lote " + this.lotes[this.indexLotes].id, ganadorId, true, chatId).subscribe({
        next: (notificacion) => {
          console.log('Notificación creada:', notificacion);
        },
        error: (error) => {
          console.error('Error al crear notificación:', error);
        }
      });

      this.notificacionService.crearNotificacion("Subasta finalizada", "Su lote " + this.lotes[this.indexLotes].id + " ha sido ganado por el usuario: " + ganadorId, this.subasta?.casaremate.usuario_id || 0, true, chatId).subscribe({
        next: (notificacion) => {
          console.log('Notificación creada:', notificacion);
        },
        error: (error) => {
          console.error('Error al crear notificación:', error);
        }
      });
    }
    
    if (this.subasta && this.subasta.activa) {
      this.subasta.activa = false;
      this.boton = false;
    }
  }

  isCurrentUser(): boolean {
    const storedUserId = localStorage.getItem('usuario_id');
    return storedUserId !== null && this.clienteID !== null && this.clienteID === Number(storedUserId);
  }

  isRematador(): boolean {
    const storedUserId = localStorage.getItem('usuario_id');
    if (!storedUserId || !this.subasta?.rematador) {
      //console.log('🔍 DEBUG isRematador - No hay usuario logueado o no hay rematador');
      return false;
    }

    const userId = Number(storedUserId);
    
    // Verificar diferentes estructuras posibles del rematador
    let rematadorId: number | undefined;
    
    // Opción 1: rematador.usuario.id
    if (this.subasta.rematador.usuario?.id) {
      rematadorId = this.subasta.rematador.usuario.id;
    }
    // Opción 2: rematador.usuario_id
    else if ((this.subasta.rematador as any).usuario_id) {
      rematadorId = (this.subasta.rematador as any).usuario_id;
    }
    // Opción 3: rematador directamente es el ID
    else if (typeof this.subasta.rematador === 'number') {
      rematadorId = this.subasta.rematador;
    }
    
    /*
    console.log('🔍 DEBUG isRematador:', {
      usuarioLogueado: userId,
      rematadorId: rematadorId,
      estructuraRematador: this.subasta.rematador,
      esRematador: userId === rematadorId
    });
    */

    return rematadorId !== undefined && userId === rematadorId;
  }

  /**
   * Encuentra al ganador de la subasta (quien tiene la puja más alta)
   */
  private encontrarGanador(): number | null {
    if (!this.pujas || this.pujas.length === 0) {
      return null;
    }

    // Encontrar la puja con el monto más alto
    const pujaGanadora = this.pujas.reduce((maxPuja, pujaActual) => {
      return pujaActual.monto > maxPuja.monto ? pujaActual : maxPuja;
    });

    // Obtener el cliente_id de la puja ganadora
    // Nota: Necesitarías tener el cliente_id en el objeto pujaDto
    // Por ahora, usaremos la lógica existente del clienteID
    if (pujaGanadora.monto === this.pujaActual) {
      return this.clienteID;
    }

    return null;
  }

  /**
   * Verifica si el usuario actual es el ganador
   */
  private esUsuarioGanador(ganadorId: number): boolean {
    const usuarioActual = localStorage.getItem('usuario_id');
    return usuarioActual !== null && Number(usuarioActual) === ganadorId;
  }

  /**
   * Maneja el pago exitoso de PayPal
   */
  async onPaymentSuccess(paymentData: any): Promise<void> {
    console.log('💰 Pago exitoso:', paymentData);
    
    try {
      // Cerrar modal de pago
      this.pagando = false;
      
      // Obtener el ID del usuario ganador
      const ganadorId = Number(localStorage.getItem('usuario_id')) || this.clienteID;
      const ganadorNombre = localStorage.getItem('usuario_nombre') || `Usuario ${ganadorId}`;
      
      // Crear chat post-pago si no existe
      if (ganadorId && this.subasta?.casaremate && this.subasta.id) {
        const chatResult = await this.chatService.crearInvitacionChat(
          ganadorId,
          ganadorNombre,
          this.subasta.casaremate.usuario_id || 0, // Usar el ID de la casa de remate
          this.subasta.casaremate.usuario?.nombre || 'Casa de Remate'
        );

        console.log('✅ Chat creado post-pago:', chatResult);
        
        // Establecer el chatRoomId y marcar como creado
        this.chatRoomId = chatResult.chatId || `chat_${ganadorId}_${this.subasta.casaremate.usuario_id}`;
        this.chatCreado = true;
        
        // Mostrar mensaje de éxito
        alert('¡Pago exitoso! Se ha creado un chat con la casa de remate. Haz clic en el botón "Abrir Chat" para coordinar la entrega.');
      }
      
    } catch (error) {
      console.error('❌ Error post-pago:', error);
      alert('Pago exitoso, pero hubo un error al crear el chat. Contacte al soporte.');
    }
  }

  /**
   * Maneja errores en el pago de PayPal
   */
  onPaymentError(error: any): void {
    console.error('❌ Error en el pago:', error);
    alert('Error en el pago. Por favor, intente nuevamente.');
  }

  /**
   * Abre el chat en una nueva pestaña usando el chatId creado
   */
  abrirChatEnNuevaPestana(): void {
    if (this.chatRoomId) {
      const chatUrl = `/chat/${this.chatRoomId}`;
      window.open(chatUrl, '_blank');
    } else {
      alert('Chat no disponible. Contacte al soporte.');
    }
  }

  /**
   * Invita a otro usuario a un chat privado
   */
  invitarAChat(usuarioId: number, usuarioNombre: string): void {
    const miId = parseInt(localStorage.getItem('usuario_id') || '0');
    const miNombre = localStorage.getItem('usuario_nombre') || 'Usuario';
    
    if (!miId) {
      console.error('Usuario no autenticado');
      return;
    }

    this.chatService.crearInvitacionChat(
      miId,
      miNombre,
      usuarioId,
      usuarioNombre
    ).then((resultado: any) => {
      console.log('Invitación de chat creada:', resultado);
      // Mostrar mensaje de confirmación
      alert(`Invitación de chat enviada a ${usuarioNombre}`);
    }).catch((error: any) => {
      console.error('Error al crear invitación de chat:', error);
      alert('Error al enviar la invitación de chat');
    });
  }

  /**
   * Maneja actualizaciones del timer que llegan por WebSocket
   */
  private handleTimerUpdateFromWebSocket(timerData: any): void {
    console.log('🔍 Timer update recibido:', timerData);
    console.log('🔍 Soy rematador?', this.isRematador());
    console.log('🔍 Estado actual del timer:', this.timerState);

    // Solo sincronizar si no somos el rematador (para evitar conflictos)
    if (this.isRematador()) {
      console.log('⏰ Ignorando actualización de timer (soy rematador)');
      return;
    }

    console.log('⏰ Usuario sincronizando timer desde WebSocket:', timerData);

    if (timerData.tiempoRestante !== undefined) {
      const nuevoTiempo = timerData.tiempoRestante;
      const tiempoAnterior = this.timerState.tiempoRestanteSegundos;
      
      // Sincronizar el tiempo
      this.timerState.tiempoRestanteSegundos = nuevoTiempo;
      this.timerState.timer = this.formatearTiempo(nuevoTiempo);

      console.log('⏰ Timer sincronizado:', {
        anterior: tiempoAnterior,
        nuevo: nuevoTiempo,
        timer: this.timerState.timer
      });

      // Si el timer se terminó
      if (nuevoTiempo <= 0) {
        this.timerState.timer = TIMER_CONSTANTS.FINISHED_MESSAGE;
        this.timerState.tiempoRestanteSegundos = 0;
        this.timerState.timerActivo = false;
        this.detenerTimer();
        
        if (this.subasta && this.subasta.activa) {
          this.subasta.activa = false;
          this.boton = false;
        }

        // Verificar si el usuario actual es el ganador
        const ganadorId = this.encontrarGanador();
        if(ganadorId && this.esUsuarioGanador(ganadorId)) {
          this.paypalMonto = this.pujaActual;
          this.pagando = true;
        }
      }
      // Si el timer debe estar activo y no está corriendo
      else if (nuevoTiempo > 0 && !this.timerState.timerActivo) {
        this.timerState.timerActivo = true;
        console.log('⏰ Iniciando timer local del usuario');
        this.iniciarTimerLocalUsuario();
      }
      // Si ya está activo pero hay una diferencia significativa (mayor a 5 segundos), reiniciar
      else if (tiempoAnterior && Math.abs(tiempoAnterior - nuevoTiempo) > 5) {
        console.log('⏰ Diferencia significativa detectada, reiniciando timer local');
        this.detenerTimer();
        this.timerState.timerActivo = true;
        this.iniciarTimerLocalUsuario();
      }
    } else {
      console.warn('⚠️ Timer update no tiene tiempoRestante:', timerData);
    }
  }
}



