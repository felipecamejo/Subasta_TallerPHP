import { Component, ElementRef, OnInit, OnDestroy, ViewChild, Input, Output, EventEmitter, AfterViewChecked, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatService } from '../../services/chat.service';
import { WebsocketService } from '../../services/webSocketService';
import { Subject, debounceTime, distinctUntilChanged, Subscription, take } from 'rxjs';

interface ChatMessage {
  id: string;
  text: string;
  senderName: string;
  timestamp: Date;
  isOwn: boolean;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked, AfterViewInit {
  @Output() close = new EventEmitter<void>();

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('messageInput') private messageInput!: ElementRef;

  // Propiedades para el chat desde la ruta
  chatId: string = '';
  nombreOtroUsuario: string = '';
  chatValido: boolean = true;
  cargandoValidacion: boolean = false;
  errorValidacion: string = '';
  currentUserId: string = '';
  chatFinalizado: boolean = false;
  mensajesSuscripcionConfigurada: boolean = false;
  autoScrollEnabled: boolean = true; // Control para auto-scroll
  
  // Propiedades para el modal de valoración
  mostrarModalValoracion: boolean = false;
  otroUsuarioId: number = 0;
  otroUsuarioTipo: 'cliente' | 'casa_remate' = 'cliente';
  valoracionSeleccionada: number = 0;
  enviandoValoracion: boolean = false;
  necesitaValorarChatFinalizado: boolean = false;
  
  // Propiedades para la sección de valoración en el chat
  mostrarValoracion: boolean = false;
  puntuacionCliente: number = 0;
  puntuacionCasa: number = 0;
  comentarioCliente: string = '';
  comentarioCasa: string = '';
  
  // Suscripciones
  private subscriptions: Subscription[] = [];
  
  messages: ChatMessage[] = [];
  newMessage: string = '';
  private typingSubject = new Subject<boolean>();

  constructor(
    private chatService: ChatService,
    private websocketService: WebsocketService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    // Limpiar los mensajes de ejemplo al inicializar como página completa
    this.messages = [];

    // Configurar el debounce para el estado de escritura
    this.typingSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(isTyping => {
      this.chatService.sendTypingStatus(this.currentUserId, isTyping);
    });
  }

  ngOnInit(): void {
    // Obtener ID del usuario actual ANTES de todo
    this.currentUserId = localStorage.getItem('usuario_id') || '';
    
    if (!this.currentUserId) {
      console.error('No se encontró usuario_id en localStorage');
      return;
    }

    // Obtener parámetros de la ruta y validar
    const routeSubscription = this.route.params.subscribe(params => {
      this.chatId = params['chatId'];
      if (this.chatId && this.currentUserId) {
        this.validarYInicializarChat();
      }
    });
    this.subscriptions.push(routeSubscription);

    // Configurar suscripción a mensajes WebSocket
    this.configurarWebSocketSubscriptions();

    // Configurar el debounce para el estado de escritura
    const typingSubscription = this.typingSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(isTyping => {
      this.chatService.sendTypingStatus(this.currentUserId, isTyping);
    });
    this.subscriptions.push(typingSubscription);
  }

  /**
   * Validar acceso al chat e inicializarlo si es válido
   */
  private validarYInicializarChat(): void {
    if (!this.chatId || !this.currentUserId) {
      return;
    }

    this.cargandoValidacion = true;
    this.errorValidacion = '';

    this.chatService.validarAccesoChat(
      this.chatId, 
      parseInt(this.currentUserId)
    ).then((validacion: any) => {
      this.cargandoValidacion = false;
      if (validacion.valid && validacion.otroUsuario) {
        this.chatValido = true;
        this.nombreOtroUsuario = validacion.otroUsuario.nombre;
        
        // Configurar suscripción ANTES de inicializar el ChatService
        this.configurarSuscripcionMensajes();
        this.inicializarChatWebSocket();
        
        // Verificar si el chat está finalizado y necesita valoración
        this.verificarEstadoChatYValoracion();
      } else {
        this.chatValido = false;
        this.errorValidacion = validacion.message || 'No tienes acceso a este chat';
      }
    }).catch((error: any) => {
      this.cargandoValidacion = false;
      this.chatValido = false;
      this.errorValidacion = 'Error al validar el chat';
      console.error('Error al validar chat:', error);
    });
  }

  /**
   * Configurar suscripciones a WebSocket
   */
  private configurarWebSocketSubscriptions(): void {
    const messageSubscription = this.websocketService.onNewMessage().subscribe(message => {
      if (message.chatId === this.chatId) {
        // Mensaje recibido por WebSocket
      }
    });
    this.subscriptions.push(messageSubscription);
  }

  /**
   * Configurar suscripción a mensajes del ChatService
   */
  private configurarSuscripcionMensajes(): void {
    if (this.mensajesSuscripcionConfigurada) {
      return;
    }
    
    // Suscribirse a los mensajes del ChatService
    const messagesSubscription = this.chatService.messages$.subscribe({
      next: (messages) => {
        const previousLength = this.messages.length;
        
        if (messages.length === 0) {
          this.messages = [];
        } else {
          // Crear una nueva referencia del array para forzar change detection
          this.messages = messages.map(msg => ({
            id: msg.id,
            text: msg.text,
            senderName: msg.senderName,
            timestamp: this.parseTimestamp(msg.timestamp),
            isOwn: msg.senderId === this.currentUserId
          }));
        }
        
        // Forzar change detection
        this.cdr.markForCheck();
        this.cdr.detectChanges();
        
        // Solo hacer scroll automático si:
        // 1. Es la carga inicial (previousLength === 0)
        // 2. Llegó un nuevo mensaje Y el usuario está cerca del final
        if ((previousLength === 0 && messages.length > 0) || 
            (messages.length > previousLength && this.autoScrollEnabled && this.isNearBottom())) {
          setTimeout(() => {
            this.scrollToBottom();
          }, 50);
        }
      },
      error: (error) => {
        console.error('Error en suscripción de mensajes:', error);
      }
    });
    
    this.subscriptions.push(messagesSubscription);
    this.mensajesSuscripcionConfigurada = true;
  }

  /**
   * Inicializar conexión WebSocket para el chat
   */
  private async inicializarChatWebSocket(): Promise<void> {
    if (!this.chatId || !this.currentUserId) return;

    const nombreUsuario = localStorage.getItem('usuario_nombre') || 'Usuario';
    
    try {
      // Inicializar chat con persistencia (esto carga mensajes históricos)
      await this.chatService.initializeChat(
        this.chatId,
        parseInt(this.currentUserId),
        nombreUsuario
      );
      
      // Verificar que los mensajes se carguen correctamente
      this.verificarYForzarCargaMensajes();
      
      // Dar tiempo para que los mensajes históricos se carguen y emitan
      setTimeout(() => {
        this.cdr.detectChanges();
      }, 500);

    } catch (error) {
      console.error('Error al inicializar chat con persistencia:', error);
      
      // Fallback: inicializar solo WebSocket
      this.websocketService.joinChat(
        this.chatId,
        parseInt(this.currentUserId),
        nombreUsuario
      );
    }
  }

  /**
   * Inicializa el chat cuando se accede desde una notificación (método legacy)
   */
  private inicializarChatDesdeRuta(): void {
    if (!this.chatId || !this.currentUserId) return;

    const nombreUsuario = localStorage.getItem('usuario_nombre') || 'Usuario';
    
    // Unirse al chat
    this.websocketService.joinChat(
      this.chatId,
      parseInt(this.currentUserId),
      nombreUsuario
    );

    console.log(`Usuario ${nombreUsuario} se unió al chat ${this.chatId}`);
  }

  ngOnDestroy(): void {
    this.typingSubject.complete();
    
    // Limpiar todas las suscripciones
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];

    // Limpiar el chat
    this.chatService.clearChat();
  }

  ngAfterViewChecked() {
    // No hacer scroll automático en ngAfterViewChecked para evitar interferir con el scroll manual
    // El scroll automático se maneja cuando llegan nuevos mensajes o cuando el usuario está cerca del final
  }

  ngAfterViewInit(): void {
    if (this.chatValido && !this.cargandoValidacion && !this.chatFinalizado) {
      this.scrollToBottom();
      // Enfocar el input cuando se inicializa el componente, solo si el chat está activo
      if (this.messageInput?.nativeElement) {
        setTimeout(() => this.messageInput.nativeElement.focus(), 100);
      }
    }
  }

  onMessageInput(): void {
    // Verificar si el chat está activo antes de permitir escribir
    if (!this.chatValido || this.cargandoValidacion || this.chatFinalizado) {
      // Limpiar el input si no es válido escribir
      this.newMessage = '';
      return;
    }
    
    // Por ahora simplemente manejamos el input sin indicador de tipeo
    // Se puede implementar más tarde si es necesario
  }

  sendMessage(): void {
    // Verificar si el chat está finalizado
    if (this.chatFinalizado) {
      alert('No se pueden enviar mensajes: el chat ha sido finalizado');
      return;
    }

    // Verificar si el chat es válido
    if (!this.chatValido) {
      alert('No se pueden enviar mensajes: el chat no es válido');
      return;
    }

    // Verificar si el chat está siendo validado
    if (this.cargandoValidacion) {
      alert('El chat se está inicializando, espera un momento...');
      return;
    }

    // Verificar que el mensaje no esté vacío
    if (!this.newMessage.trim()) {
      return;
    }

    // Verificar que tengamos chatId
    if (!this.chatId) {
      alert('Error: No se pudo identificar el chat');
      return;
    }

    // Habilitar auto-scroll cuando el usuario envía un mensaje
    this.autoScrollEnabled = true;
    this.enviarMensajePersistente();
  }

  /**
   * Enviar mensaje usando persistencia real
   */
  private async enviarMensajePersistente(): Promise<void> {
    const textoMensaje = this.newMessage.trim();
    if (!textoMensaje) {
      return;
    }

    try {
      // VERIFICACIÓN CRÍTICA: Asegurar que el ChatService esté inicializado
      if (!this.chatValido || this.cargandoValidacion) {
        alert('El chat no está completamente inicializado. Espera un momento y vuelve a intentar.');
        this.newMessage = textoMensaje; // Restaurar el mensaje
        return;
      }

      // VERIFICACIÓN ADICIONAL: Asegurar que el ChatService esté configurado
      const servicioInicializado = await this.asegurarChatServiceInicializado();
      if (!servicioInicializado) {
        alert('Error al inicializar el chat. Por favor, recarga la página.');
        this.newMessage = textoMensaje; // Restaurar el mensaje
        return;
      }
      
      if (!this.mensajesSuscripcionConfigurada) {
        this.configurarSuscripcionMensajes();
      }

      // Asegurar que el ChatService esté inicializado
      const chatServiceInicializado = await this.asegurarChatServiceInicializado();
      if (!chatServiceInicializado) {
        alert('Error al inicializar el chat. Por favor, recarga la página e intenta nuevamente.');
        return;
      }

      const destinatarioId = this.obtenerDestinatarioId();
      const nombreUsuario = localStorage.getItem('usuario_nombre') || 'Usuario';

      // Limpiar el input inmediatamente para mejor UX
      const mensajeAEnviar = this.newMessage;
      this.newMessage = '';

      const resultado = await this.chatService.sendMessage(
        parseInt(this.currentUserId),
        destinatarioId,
        textoMensaje,
        nombreUsuario
      );

      // VERIFICACIÓN POST-ENVÍO: Verificar estado de mensajes
      setTimeout(() => {
        // Verificar si el array del componente tiene el mensaje
        const mensajeEncontrado = this.messages.find(msg => 
          msg.text === textoMensaje && msg.isOwn === true
        );
        
        this.cdr.detectChanges();
      }, 500);

      // Verificación adicional más tardía
      setTimeout(() => {
        if (this.messages.length === 0 || !this.messages.find(msg => msg.text === textoMensaje)) {
          this.forzarActualizacionMensajes();
        }
      }, 2000);

    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      
      // Restaurar el mensaje en caso de error
      this.newMessage = textoMensaje;
      alert('Error al enviar mensaje. Inténtalo de nuevo.');
    }
  }

  /**
   * Extrae el ID del destinatario del chatId
   */
  private obtenerDestinatarioId(): number {
    // El chatId tiene formato "private_123_456"
    const partes = this.chatId.split('_');
    if (partes.length === 3) {
      const id1 = parseInt(partes[1]);
      const id2 = parseInt(partes[2]);
      const miId = parseInt(this.currentUserId);
      return miId === id1 ? id2 : id1;
    }
    console.error('Formato de chatId inválido:', this.chatId);
    return 0;
  }

  /**
   * Cerrar chat y volver atrás
   */
  closeChat(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    
    // Si estamos en la ruta del chat, volver atrás
    if (this.chatId) {
      this.router.navigate(['/']);
    } else {
      this.close.emit();
    }
  }

  private parseTimestamp(timestamp: any): Date {
    // Si ya es un objeto Date válido, devolverlo
    if (timestamp instanceof Date && !isNaN(timestamp.getTime())) {
      return timestamp;
    }
    
    // Si es un Date inválido, intentar obtener el valor original
    if (timestamp instanceof Date && isNaN(timestamp.getTime())) {
      // No podemos recuperar el valor original de un Date inválido
      console.warn('Recibido Date inválido, usando fecha actual');
      return new Date();
    }
    
    // Si es string en formato 'YYYY-MM-DD HH:mm:ss', convertirlo
    if (typeof timestamp === 'string') {
      // Limpiar el string y verificar formato
      const cleanTimestamp = timestamp.trim();
      
      // Formato típico de MySQL: 'YYYY-MM-DD HH:mm:ss'
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(cleanTimestamp)) {
        // Convertir a formato ISO agregando 'T' y zona horaria local
        const isoString = cleanTimestamp.replace(' ', 'T');
        const date = new Date(isoString);
        
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      
      // Intentar parsing directo si no coincide con el formato esperado
      const fallbackDate = new Date(cleanTimestamp);
      if (!isNaN(fallbackDate.getTime())) {
        return fallbackDate;
      }
    }
    
    // Si es número (timestamp unix), convertir
    if (typeof timestamp === 'number') {
      return new Date(timestamp);
    }
    
    // Fallback: devolver fecha actual si todo falla
    console.warn('No se pudo parsear el timestamp:', timestamp);
    return new Date();
  }

  formatMessageTime(date: any): string {
    const now = new Date();
    const messageDate = this.parseTimestamp(date);
    
    // Verificar que la fecha sea válida
    if (isNaN(messageDate.getTime())) {
      return 'Fecha inválida';
    }
    
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return messageDate.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }

  /**
   * Limpiar indicador de tipeo del otro usuario
   */
  private clearOtherUserTyping(): void {
    // Método simplificado - no se necesita por ahora
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer?.nativeElement && this.autoScrollEnabled) {
        const element = this.messagesContainer.nativeElement;
        setTimeout(() => {
          element.scrollTop = element.scrollHeight;
        }, 50);
      }
    } catch (err) {
      console.error('Error al hacer scroll:', err);
    }
  }

  /**
   * Scroll manual al final del chat (cuando el usuario hace clic en el botón)
   */
  scrollToBottomManual(): void {
    this.autoScrollEnabled = true;
    this.scrollToBottom();
  }

  /**
   * Verificar si el usuario está cerca del final del scroll
   */
  private isNearBottom(): boolean {
    if (!this.messagesContainer?.nativeElement) return true;
    
    const element = this.messagesContainer.nativeElement;
    const threshold = 100; // píxeles desde el final
    return element.scrollTop + element.clientHeight >= element.scrollHeight - threshold;
  }

  /**
   * Manejar el evento de scroll para controlar auto-scroll
   */
  onMessagesScroll(): void {
    if (!this.messagesContainer?.nativeElement) return;
    
    const wasAutoScrollEnabled = this.autoScrollEnabled;
    
    // Si el usuario está cerca del final, habilitar auto-scroll
    // Si está viendo mensajes más arriba, deshabilitar auto-scroll
    this.autoScrollEnabled = this.isNearBottom();
    
    // Log para debug (remover en producción)
    if (wasAutoScrollEnabled !== this.autoScrollEnabled) {
      console.log('Auto-scroll cambiado:', this.autoScrollEnabled ? 'habilitado' : 'deshabilitado');
    }
  }

  /**
   * Abrir modal para finalizar chat y valorar
   */
  abrirModalFinalizarChat(): void {
    // Verificar si el chat está activo antes de permitir finalizarlo
    if (!this.chatValido) {
      alert('No se puede finalizar el chat: el chat no es válido');
      return;
    }

    if (this.cargandoValidacion) {
      alert('Espera a que se complete la validación del chat');
      return;
    }

    if (this.chatFinalizado) {
      alert('El chat ya ha sido finalizado');
      return;
    }

    // Extraer información del otro usuario del chatId
    const usuarios = this.chatService.extraerUsuariosDelChatId(this.chatId);
    if (!usuarios) {
      alert('Error al obtener información del chat');
      return;
    }

    const currentUserIdNum = parseInt(this.currentUserId);
    this.otroUsuarioId = usuarios.usuario1Id === currentUserIdNum ? usuarios.usuario2Id : usuarios.usuario1Id;
    
    // Por ahora asumimos que es cliente, se podría mejorar con más contexto
    this.otroUsuarioTipo = 'cliente';
    this.valoracionSeleccionada = 0;
    this.mostrarModalValoracion = true;
  }

  /**
   * Cerrar modal de valoración
   */
  cerrarModalValoracion(): void {
    // Si el modal se abrió automáticamente por un chat finalizado, 
    // no permitir cerrar sin valorar
    if (this.necesitaValorarChatFinalizado && this.valoracionSeleccionada === 0) {
      const confirmar = confirm(
        'Este chat fue finalizado por el otro usuario y necesitas valorar antes de continuar. ' +
        '¿Estás seguro que quieres cerrar sin valorar? Podrás valorar más tarde.'
      );
      if (!confirmar) {
        return;
      }
    }
    
    this.mostrarModalValoracion = false;
    this.valoracionSeleccionada = 0;
    this.enviandoValoracion = false;
  }

  /**
   * Seleccionar valoración (estrellas)
   */
  seleccionarValoracion(estrellas: number): void {
    this.valoracionSeleccionada = estrellas;
  }

  /**
   * Finalizar chat solo (sin valoración)
   */
  async finalizarChatSinValoracion(): Promise<void> {
    if (!this.chatId || !this.currentUserId) return;
    
    this.enviandoValoracion = true;
    try {
      const response = await this.chatService.finalizarChat(
        this.chatId, 
        parseInt(this.currentUserId)
      );
      
      if (response.success) {
        this.chatFinalizado = true;
        this.cerrarModalValoracion();
        alert('Chat finalizado exitosamente.');
      } else {
        alert('Error al finalizar el chat: ' + response.message);
      }
    } catch (error) {
      console.error('Error al finalizar chat:', error);
      alert('Error al finalizar el chat');
    }
    this.enviandoValoracion = false;
  }

  /**
   * Finalizar chat con valoración
   */
  async finalizarChatConValoracion(): Promise<void> {
    if (!this.chatId || !this.currentUserId) return;
    if (this.valoracionSeleccionada === 0) {
      alert('Por favor selecciona una valoración');
      return;
    }
    
    this.enviandoValoracion = true;
    try {
      const response = await this.chatService.finalizarChat(
        this.chatId,
        parseInt(this.currentUserId),
        this.otroUsuarioId,
        this.valoracionSeleccionada,
        this.otroUsuarioTipo
      );
      
      if (response.success) {
        this.chatFinalizado = true;
        this.necesitaValorarChatFinalizado = false; // Ya valoró, no mostrar más el modal
        this.cerrarModalValoracion();
        const mensaje = response.calificacion_agregada 
          ? `Chat finalizado y valoración agregada. Promedio: ${response.promedio_valoracion}⭐`
          : 'Chat finalizado exitosamente.';
        alert(mensaje);
      } else {
        alert('Error al finalizar el chat: ' + response.message);
      }
    } catch (error) {
      console.error('Error al finalizar chat:', error);
      alert('Error al finalizar el chat');
    }
    this.enviandoValoracion = false;
  }

  /**
   * Cambiar tipo de usuario a valorar
   */
  cambiarTipoUsuario(tipo: 'cliente' | 'casa_remate'): void {
    this.otroUsuarioTipo = tipo;
  }

  /**
   * Forzar inicialización del ChatService si no está configurado
   */
  private async asegurarChatServiceInicializado(): Promise<boolean> {
    // Verificar si el ChatService tiene el chatId configurado
    const estadoActual = this.chatService.obtenerEstadoActual();
    
    if (!estadoActual.chatId || estadoActual.chatId !== this.chatId) {
      try {
        const nombreUsuario = localStorage.getItem('usuario_nombre') || 'Usuario';
        await this.chatService.initializeChat(
          this.chatId,
          parseInt(this.currentUserId),
          nombreUsuario
        );
        
        // Configurar suscripción después de inicializar
        this.configurarSuscripcionMensajes();
        
        return true;
      } catch (error) {
        console.error('Error al inicializar ChatService:', error);
        return false;
      }
    }
    
    return true;
  }

  /**
   * Verificar y forzar carga de mensajes si es necesario
   */
  private async verificarYForzarCargaMensajes(): Promise<void> {
    // Esperar un poco para que el ChatService termine de cargar
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Verificar si tenemos mensajes
    const estadoChat = this.chatService.obtenerEstadoActual();
    
    if (this.messages.length === 0 && estadoChat.mensajesCount > 0) {
      // Intentar forzar emisión desde el ChatService
      this.chatService.forzarEmisionMensajes();
      
      // También forzar actualización de vista
      this.forzarActualizacionVista();
      
      // Esperar un poco más y verificar nuevamente
      setTimeout(() => {
        if (this.messages.length === 0) {
          // Intentar reconfigurar la suscripción como último recurso
          this.mensajesSuscripcionConfigurada = false;
          this.configurarSuscripcionMensajes();
          this.chatService.forzarEmisionMensajes();
          this.forzarActualizacionVista();
        }
      }, 500);
    }
  }

  // Métodos para la valoración
  setPuntuacion(tipo: 'cliente' | 'casa', puntuacion: number): void {
    if (tipo === 'cliente') {
      this.puntuacionCliente = puntuacion;
    } else {
      this.puntuacionCasa = puntuacion;
    }
  }

  enviarValoracionCliente(): void {
    if (this.puntuacionCliente === 0) {
      return;
    }

    // Aquí iría la lógica para enviar la valoración del cliente
    console.log('Enviando valoración del cliente:', {
      puntuacion: this.puntuacionCliente,
      comentario: this.comentarioCliente,
      chatId: this.chatId
    });
  }

  enviarValoracionCasa(): void {
    if (this.puntuacionCasa === 0) {
      return;
    }

    // Aquí iría la lógica para enviar la valoración de la casa
    console.log('Enviando valoración de la casa:', {
      puntuacion: this.puntuacionCasa,
      comentario: this.comentarioCasa,
      chatId: this.chatId
    });
  }

  /**
   * Track by function para ngFor de mensajes (mejora performance)
   */
  trackByMessageId(index: number, message: ChatMessage): string {
    return message.id;
  }

  /**
   * Forzar actualización manual de la vista
   */
  private forzarActualizacionVista(): void {
    // Crear una nueva referencia del array
    this.messages = [...this.messages];
    
    // Forzar change detection múltiples veces
    this.cdr.markForCheck();
    this.cdr.detectChanges();
    
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 50);
  }

  /**
   * Forzar actualización de mensajes desde ChatService
   */
  private forzarActualizacionMensajes(): void {
    this.chatService.forzarEmisionMensajes();
    
    // También forzar una nueva suscripción si es necesario
    setTimeout(() => {
      // Forzar una actualización manual del array de mensajes
      this.chatService.messages$.pipe(
        take(1)
      ).subscribe((messages: any[]) => {
        // Crear completamente nuevo array
        const nuevosMensajes = messages.map(msg => ({
          id: msg.id,
          text: msg.text,
          senderName: msg.senderName,
          timestamp: this.parseTimestamp(msg.timestamp),
          isOwn: msg.senderId === this.currentUserId
        }));
        
        // Reemplazar completamente el array
        this.messages = [...nuevosMensajes];
        
        // Forzar change detection agresivo
        this.cdr.markForCheck();
        this.cdr.detectChanges();
        
        setTimeout(() => {
          this.cdr.markForCheck();
          this.cdr.detectChanges();
        }, 50);
      });
    }, 500);
  }

  /**
   * Verificar si el chat está finalizado y si necesita valoración
   */
  private async verificarEstadoChatYValoracion(): Promise<void> {
    if (!this.chatId || !this.currentUserId) {
      console.log('❌ No se puede verificar estado: chatId=' + this.chatId + ', currentUserId=' + this.currentUserId);
      return;
    }

    try {
      console.log('🔍 Verificando estado del chat:', this.chatId, 'para usuario:', this.currentUserId);
      const response = await this.chatService.verificarEstadoChat(this.chatId, parseInt(this.currentUserId));
      console.log('📋 Respuesta del backend:', response);
      
      if (response.chatFinalizado) {
        console.log('✅ Chat está finalizado');
        this.chatFinalizado = true;
        
        // Si el chat está finalizado y este usuario aún no ha valorado
        if (response.necesitaValoracion && !response.yaValoro) {
          console.log('⭐ Usuario necesita valorar - mostrando modal');
          this.necesitaValorarChatFinalizado = true;
          
          // Configurar información para la valoración
          const usuarios = this.chatService.extraerUsuariosDelChatId(this.chatId);
          if (usuarios) {
            const currentUserIdNum = parseInt(this.currentUserId);
            this.otroUsuarioId = usuarios.usuario1Id === currentUserIdNum ? usuarios.usuario2Id : usuarios.usuario1Id;
            
            // Usar la información del backend si está disponible
            if (response.otroUsuario) {
              this.otroUsuarioId = response.otroUsuario.id;
              this.otroUsuarioTipo = response.otroUsuario.tipo || 'cliente';
            } else {
              // Fallback: Por ahora asumimos que es cliente
              this.otroUsuarioTipo = 'cliente';
            }
            
            this.valoracionSeleccionada = 0;
            
            console.log('🎯 Configuración para valoración:', {
              otroUsuarioId: this.otroUsuarioId,
              otroUsuarioTipo: this.otroUsuarioTipo
            });
            
            // Abrir el modal automáticamente después de un pequeño delay
            setTimeout(() => {
              console.log('🚀 Abriendo modal de valoración...');
              this.mostrarModalValoracion = true;
            }, 1000);
          } else {
            console.log('❌ No se pudieron extraer usuarios del chatId');
          }
        } else {
          console.log('ℹ️ Usuario no necesita valorar:', {
            necesitaValoracion: response.necesitaValoracion,
            yaValoro: response.yaValoro
          });
        }
      } else {
        console.log('ℹ️ Chat no está finalizado');
      }
    } catch (error) {
      console.error('❌ Error al verificar estado del chat:', error);
    }
  }

  /**
   * Abrir modal para valorar un chat ya finalizado
   */
  abrirModalValoracionPendiente(): void {
    if (!this.necesitaValorarChatFinalizado) {
      return;
    }

    // Configurar información para la valoración si aún no está configurada
    if (this.otroUsuarioId === 0) {
      const usuarios = this.chatService.extraerUsuariosDelChatId(this.chatId);
      if (usuarios) {
        const currentUserIdNum = parseInt(this.currentUserId);
        this.otroUsuarioId = usuarios.usuario1Id === currentUserIdNum ? usuarios.usuario2Id : usuarios.usuario1Id;
        this.otroUsuarioTipo = 'cliente';
      }
    }
    
    this.valoracionSeleccionada = 0;
    this.mostrarModalValoracion = true;
  }
}
