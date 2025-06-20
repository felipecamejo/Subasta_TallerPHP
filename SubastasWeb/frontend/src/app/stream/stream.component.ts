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
import { ChatComponent } from '../chat/chat.component';
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
  imports: [CommonModule, InputTextModule, FormsModule, ButtonModule, DialogModule, PayPalComponent, ChatComponent],
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
  chatVisible: boolean = false;
  chatRoomId: string = '';
  chatCurrentUser: { id: string, name: string } | null = null;
  chatMessages: Array<{ fromUserId: number, message: string, timestamp: string }> = [];
  
  public timerState: TimerState = {
    timer: "00:00:00",
    timerActivo: false
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

        
        if(this.subasta.videoId && this.subasta.videoId.trim() !== '') {
          console.log('Inicializando video con ID:', this.subasta.videoId);
          this.initializeVideo(this.subasta.videoId);
        } else {
          console.log('No hay videoId válido para inicializar');
          console.log('Condición falló - videoId:', !!this.subasta.videoId, 'trim:', this.subasta.videoId?.trim());
        }
        
        this.cargarPujas(this.indexLotes);

        if (this.subasta.activa && this.subasta.fecha && !this.timerInitialized) {
          this.timerInitialized = true;
          
          requestAnimationFrame(() => {
            this.iniciarTimer();
          });
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
    if (!this.subasta || !this.subasta.fecha || this.subasta.activa) {
      console.warn('No se puede iniciar la subasta: subasta ya activa o datos faltantes');
      return;
    }

    this.boton = true;
    this.subasta.activa = true;

    this.subastaService.updateSubasta(this.subasta).subscribe({
      next: () => {
        console.log('Subasta actualizada correctamente');
        if (!this.timerInitialized) {
          this.timerInitialized = true;
          requestAnimationFrame(() => {
            this.iniciarTimer();
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


  iniciarTimer() {
    if (this.timerState.timerActivo) {
      console.warn('Timer ya está activo, ignorando nueva inicialización');
      return;
    }

    this.detenerTimer();

    if (!this.subasta?.fecha) {
      console.warn('No hay fecha de subasta definida');
      return;
    }

    const fechaInicio = new Date(this.subasta.fecha).getTime();
    
    if (isNaN(fechaInicio)) {
      console.error('Fecha de subasta inválida:', this.subasta.fecha);
      return;
    }

    const duracionMs = this.subasta.duracionMinutos * 60 * 1000;
    const fechaFin = fechaInicio + duracionMs;

    console.log('Iniciando timer para subasta:', {
      fechaInicio: new Date(fechaInicio),
      fechaFin: new Date(fechaFin),
      duracion: this.subasta.duracionMinutos
    });

    this.timerState.timerActivo = true;

    this.timerState.timerSubscription = interval(TIMER_CONSTANTS.INTERVAL_MS).pipe(
      takeWhile(() => this.timerState.timerActivo)
    ).subscribe({
      next: () => {
        try {
          const ahora = Date.now();
          
          if (ahora < fechaInicio) {
            const diff = Math.floor((fechaInicio - ahora) / TIMER_CONSTANTS.INTERVAL_MS);
            this.timerState.timer = this.formatearTiempo(diff);
          } else if (ahora <= fechaFin) {
            const diff = Math.floor((fechaFin - ahora) / TIMER_CONSTANTS.INTERVAL_MS);
            this.timerState.timer = this.formatearTiempo(diff);
          } else {
            this.timerState.timer = TIMER_CONSTANTS.FINISHED_MESSAGE;

            if(this.isCurrentUser()) {

              this.paypalMonto = this.pujaActual;
              this.pagando = true;
              
              // Inicializar chat entre el cliente ganador y la casa de remate
              this.initializeChat();

              const chatId = 0; // Usando 0 como valor numérico para el chatId

              this.notificacionService.crearNotificacion("Subasta finalizada", "Usted ha ganado la subasta por el lote " + this.lotes[this.indexLotes].id, this.clienteID || 0, true, chatId).subscribe({
                next: (notificacion) => {
                  console.log('Notificación creada:', notificacion);
                },
                error: (error) => {
                  console.error('Error al crear notificación:', error);
                }
              });

              this.notificacionService.crearNotificacion("Subasta finalizada", "Su lote " + this.lotes[this.indexLotes].id + " ha sido ganado por el usuario: " + this.clienteID, this.subasta?.casaremate.usuario_id || 0, true, chatId).subscribe({
                next: (notificacion) => {
                  console.log('Notificación creada:', notificacion);
                },
                error: (error) => {
                  console.error('Error al crear notificación:', error);
                }
              });

            } 

            this.detenerTimer();
            
            if (this.subasta && this.subasta.activa) {
              this.subasta.activa = false;
              this.boton = false;
            }
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
  }

  detenerTimer(): void {
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

        // Enviar via WebSocket primero para respuesta inmediata
        this.sendWebSocketBid(puja);

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
            console.error('Error al crear la puja:', err);
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
        console.log('Timer actualizado via WebSocket:', timerData);
        // Sincronizar timer si es necesario
      }
    });

    // Escuchar sincronización de estado
    const stateSubscription = this.websocketService.onAuctionStateSync().subscribe({
      next: (stateData) => {
        console.log('🔄 Sincronizando estado de la subasta:', stateData);
        this.handleAuctionStateSync(stateData);
      }
    });

    // Escuchar nuevos mensajes de chat
    const chatMessageSubscription = this.websocketService.onNewMessage().subscribe({
      next: (messageData) => {
        console.log('Mensaje de chat recibido:', messageData);
        this.chatMessages.push({
          fromUserId: messageData.fromUserId,
          message: messageData.message,
          timestamp: messageData.timestamp
        });
      },
      error: (err) => console.error('Error en WebSocket chat:', err)
    });

    this.websocketSubscriptions.push(
      auctionJoinedSubscription,
      bidSubscription,
      userJoinedSubscription,
      loteUpdateSubscription,
      timerSubscription,
      stateSubscription,
      chatMessageSubscription
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

  // Métodos para el chat
  initializeChat(): void {
    if (!this.clienteID || !this.subasta?.casaremate.usuario_id) {
      console.error('No se puede inicializar el chat: faltan IDs de usuario o casa de remate');
      return;
    }
    
    // Crear un ID único para el chat entre el cliente y la casa de remate
    this.chatRoomId = `chat_${this.clienteID}_${this.subasta.casaremate.usuario_id}`;
    
    // Configurar el usuario actual
    this.chatCurrentUser = {
      id: this.clienteID.toString(),
      name: 'Usuario ' + this.clienteID
    };
    
    // Inicializar el chat en el servicio
    this.chatService.initializeChat(
      this.chatRoomId,
      Number(this.clienteID),
      this.chatCurrentUser.name
    );
    
    // Mostrar el chat
    this.chatVisible = true;
    
    console.log('Chat inicializado:', this.chatRoomId);
  }
  
  toggleChat(): void {
    if (!this.chatVisible && this.isCurrentUser()) {
      this.initializeChat();
    } else {
      this.chatVisible = !this.chatVisible;
    }
  }
  
  closeChat(): void {
    this.chatVisible = false;
    this.chatService.clearChat();
  }
  
  isCurrentUser(): boolean {
    const storedUserId = localStorage.getItem('usuario_id');
    return storedUserId !== null && this.clienteID !== null && this.clienteID === Number(storedUserId);
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
   * Maneja el pago exitoso de PayPal
   */
  async onPaymentSuccess(paymentData: any): Promise<void> {
    console.log('💰 Pago exitoso:', paymentData);
    
    try {
      // Cerrar modal de pago
      this.pagando = false;
      
      // Crear chat post-pago si no existe
      if (this.clienteID && this.subasta?.casaremate && this.subasta.id) {
        const chatResult = await this.chatService.crearInvitacionChat(
          this.clienteID,
          `Usuario ${this.clienteID}`,
          this.subasta.casaremate.usuario_id || 0, // Usar el ID de la casa de remate
          this.subasta.casaremate.usuario?.nombre || 'Casa de Remate'
        );


        
        console.log('✅ Chat creado post-pago:', chatResult);
        
        // Inicializar el chat creado
        this.initializeChat();
        
        // Mostrar mensaje de éxito
        alert('¡Pago exitoso! Se ha creado un chat con la casa de remate para coordinar la entrega.');
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
}



