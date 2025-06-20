import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { WebsocketService } from './webSocketService';
import { UrlService } from './url.service';

interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: Date | string;
  leido?: boolean;
  tipo?: string;
}

interface InvitacionChatRequest {
  invitanteId: number;
  invitanteNombre: string;
  invitadoId: number;
  invitadoNombre: string;
}

interface InvitacionChatResponse {
  success: boolean;
  message: string;
  chatId?: string;
}

interface ValidacionChatResponse {
  valid: boolean;
  chatId?: string;
  otroUsuario?: {
    id: number;
    nombre: string;
  };
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  public messages$ = this.messagesSubject.asObservable();
  
  private typingUsersSubject = new BehaviorSubject<Set<string>>(new Set());
  public typingUsers$ = this.typingUsersSubject.asObservable();

  private parseTimestamp(timestamp: any): Date {
    // Si ya es un objeto Date válido, devolverlo
    if (timestamp instanceof Date && !isNaN(timestamp.getTime())) {
      return timestamp;
    }
    
    // Si es string en formato 'YYYY-MM-DD HH:mm:ss' o ISO, convertirlo
    if (typeof timestamp === 'string') {
      // Limpiar el string y verificar formato
      const cleanTimestamp = timestamp.trim();
      
      // Formato típico de MySQL: 'YYYY-MM-DD HH:mm:ss'
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(cleanTimestamp)) {
        // Convertir a formato ISO agregando 'T'
        const isoString = cleanTimestamp.replace(' ', 'T');
        const date = new Date(isoString);
        
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      
      // Para formato ISO (como '2025-06-18T17:46:55+00:00')
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
    console.warn('ChatService: No se pudo parsear el timestamp:', timestamp);
    return new Date();
  }
  
  private chatId: string = '';
  private currentUserId: number = 0;
  private currentUserName: string = '';

  constructor(
    private websocketService: WebsocketService,
    private http: HttpClient,
    private urlService: UrlService
  ) {
    // Suscribirse a los mensajes de WebSocket
    this.websocketService.onNewMessage().subscribe(messageData => {
      console.log('ChatService: Mensaje recibido de WebSocket:', messageData);
      if (messageData.chatId === this.chatId) {
        const newMessage: ChatMessage = {
          id: Date.now().toString(),
          text: messageData.message,
          senderId: messageData.fromUserId.toString(),
          senderName: messageData.fromUserName,
          timestamp: messageData.timestamp
        };
        
        const currentMessages = this.messagesSubject.getValue();
        console.log('Agregando mensaje de WebSocket al observable');
        this.messagesSubject.next([...currentMessages, newMessage]);
      }
    });
  }

  // Inicializar un chat con un ID específico
  async initializeChat(chatId: string, userId: number, userName: string): Promise<void> {
    console.log('=== INICIALIZANDO CHAT SERVICE ===');
    console.log('Chat ID:', chatId);
    console.log('Usuario ID:', userId);
    console.log('Usuario nombre:', userName);
    
    this.chatId = chatId;
    this.currentUserId = userId;
    this.currentUserName = userName;
    
    console.log('Variables del servicio configuradas:');
    console.log('- this.chatId:', this.chatId);
    console.log('- this.currentUserId:', this.currentUserId);
    console.log('- this.currentUserName:', this.currentUserName);
    
    // Limpiar mensajes anteriores
    this.messagesSubject.next([]);
    console.log('Mensajes anteriores limpiados');
    
    // Conectar a WebSocket
    console.log('Conectando a WebSocket...');
    this.websocketService.joinChat(chatId, userId, userName);
    
    // Cargar mensajes históricos
    console.log('Cargando mensajes históricos...');
    await this.cargarMensajesHistoricos();
    
    // Forzar emisión de mensajes después de cargar
    console.log('Forzando emisión de mensajes después de cargar históricos...');
    const mensajesActuales = this.messagesSubject.getValue();
    console.log('Mensajes actuales antes de forzar emisión:', mensajesActuales.length);
    this.messagesSubject.next([...mensajesActuales]);
    
    console.log('=== CHAT SERVICE INICIALIZADO ===');
  }

  // Cargar mensajes históricos desde la base de datos
  private async cargarMensajesHistoricos(): Promise<void> {
    console.log('=== CARGANDO MENSAJES HISTÓRICOS ===');
    console.log('Chat ID:', this.chatId);
    console.log('Usuario ID:', this.currentUserId);
    console.log('Base URL:', this.urlService.baseUrl);
    
    // Validar que tengamos los datos necesarios
    if (!this.chatId || !this.currentUserId) {
      console.error('ERROR: No se puede cargar mensajes sin chatId o userId');
      console.log('chatId:', this.chatId);
      console.log('currentUserId:', this.currentUserId);
      this.messagesSubject.next([]);
      return;
    }
    
    try {
      const params = new HttpParams()
        .set('usuario_id', this.currentUserId.toString())
        .set('limit', '50');

      const url = `${this.urlService.baseUrl}/chat/${this.chatId}/mensajes`;
      console.log('URL completa para cargar mensajes:', url);
      console.log('Parámetros completos:', params.toString());
      console.log('Headers que se enviarán:', {
        'Content-Type': 'application/json'
      });

      console.log('Haciendo petición HTTP GET...');
      console.log('Petición exacta:', `GET ${url}?${params.toString()}`);
      
      const response = await firstValueFrom(
        this.http.get<any>(url, { params })
      );

      console.log('=== RESPUESTA DE MENSAJES HISTÓRICOS ===');
      console.log('Response completa:', response);
      console.log('Response.success:', response.success);
      console.log('Response.mensajes:', response.mensajes);
      console.log('Response.mensajes type:', typeof response.mensajes);
      console.log('Response.mensajes isArray:', Array.isArray(response.mensajes));
      console.log('Cantidad de mensajes en respuesta:', response.mensajes?.length || 0);

      if (response.success && response.mensajes && Array.isArray(response.mensajes)) {
        console.log('=== PROCESANDO MENSAJES HISTÓRICOS ===');
        console.log('Cantidad de mensajes recibidos:', response.mensajes.length);
        
        if (response.mensajes.length === 0) {
          console.log('El backend devolvió un array vacío de mensajes');
          this.messagesSubject.next([]);
          return;
        }
        
        const mensajesRaw = response.mensajes;
        console.log('Mensajes raw antes de procesar:', mensajesRaw);
        
        const mensajesHistoricos: ChatMessage[] = mensajesRaw
          .reverse() // Invertir para orden cronológico
          .map((msg: any, index: number) => {
            console.log(`Procesando mensaje ${index + 1}:`, msg);
            
            const mensajeProcesado = {
              id: msg.id.toString(),
              text: msg.contenido,
              senderId: msg.usuario.id.toString(),
              senderName: msg.usuario.nombre,
              timestamp: this.parseTimestamp(msg.enviado_at),
              leido: msg.leido,
              tipo: msg.tipo
            };
            
            console.log(`Mensaje ${index + 1} procesado:`, mensajeProcesado);
            return mensajeProcesado;
          });

        console.log('=== MENSAJES HISTÓRICOS FINALES ===');
        console.log('Total de mensajes procesados:', mensajesHistoricos.length);
        console.log('Mensajes históricos procesados:', mensajesHistoricos);
        
        // Actualizar el observable INMEDIATAMENTE
        console.log('Actualizando observable con mensajes históricos...');
        this.messagesSubject.next(mensajesHistoricos);
        
        // Verificar que se actualizó
        const verificacion = this.messagesSubject.getValue();
        console.log('Verificación - mensajes en observable después de next():', verificacion);
        console.log('Cantidad en observable:', verificacion.length);
        
        // Forzar segunda emisión para asegurar que los suscriptores reciban los datos
        setTimeout(() => {
          console.log('Forzando segunda emisión de mensajes históricos...');
          this.messagesSubject.next([...mensajesHistoricos]);
        }, 100);
        
        console.log('Observable actualizado con mensajes históricos exitosamente');
      } else {
        console.log('=== RESPUESTA INVÁLIDA O SIN MENSAJES ===');
        console.log('Success:', response.success);
        console.log('Mensajes presentes:', !!response.mensajes);
        console.log('Mensajes es array:', Array.isArray(response.mensajes));
        console.log('Respuesta completa del servidor:', JSON.stringify(response, null, 2));
        
        if (!response.success) {
          console.error('El servidor respondió con success: false');
          console.error('Mensaje de error del servidor:', response.message || 'Sin mensaje de error');
        }
        
        console.log('Inicializando observable vacío...');
        this.messagesSubject.next([]);
      }
    } catch (error) {
      console.error('=== ERROR AL CARGAR MENSAJES HISTÓRICOS ===');
      console.error('Error completo:', error);
      console.error('Error message:', error instanceof Error ? error.message : 'Error desconocido');
      console.error('Error status:', (error as any)?.status);
      console.error('Error statusText:', (error as any)?.statusText);
      console.error('Error url:', (error as any)?.url);
      
      // Si es un error HTTP, mostrar más detalles
      if ((error as any)?.error) {
        console.error('Error body:', (error as any)?.error);
      }
      
      console.log('URL que falló:', `${this.urlService.baseUrl}/chat/${this.chatId}/mensajes`);
      console.log('ChatId usado:', this.chatId);
      console.log('UserId usado:', this.currentUserId);
      
      // Verificar si es un problema de formato de chatId
      if (this.chatId && !this.chatId.match(/^private_\d+_\d+$/)) {
        console.error('⚠️ FORMATO DE CHATID INVÁLIDO:', this.chatId);
        console.error('Esperado: private_123_456, Recibido:', this.chatId);
      }
      
      // No lanzar error para no bloquear el chat
      console.log('Inicializando observable vacío debido al error...');
      this.messagesSubject.next([]);
    }
  }

  // Enviar un mensaje
  async sendMessage(fromUserId: number, toUserId: number, message: string, fromUserName: string): Promise<void> {
    console.log('=== CHAT SERVICE: ENVIANDO MENSAJE ===');
    console.log('Parámetros recibidos:', { fromUserId, toUserId, message, fromUserName });
    console.log('Chat ID actual:', this.chatId);
    console.log('Usuario actual:', this.currentUserId);
    
    if (!message.trim()) {
      console.log('ERROR: Mensaje vacío');
      return;
    }
    
    if (!this.chatId) {
      console.log('ERROR: No hay chatId configurado');
      return;
    }
    
    console.log('Validaciones pasadas, procediendo con el envío...');
    
    try {
      const url = `${this.urlService.baseUrl}/chat/${this.chatId}/mensaje`;
      const body = {
        usuario_id: fromUserId,
        contenido: message
      };
      
      console.log('URL de la petición:', url);
      console.log('Body de la petición:', body);
      console.log('Base URL del servicio:', this.urlService.baseUrl);
      
      console.log('Enviando petición HTTP POST...');
      
      // Primero persistir en la base de datos
      const response = await firstValueFrom(
        this.http.post<any>(url, body)
      );

      console.log('=== RESPUESTA DEL SERVIDOR ===');
      console.log('Response completa:', response);
      console.log('Response.success:', response.success);

      if (response.success) {
        console.log('=== CREANDO NUEVO MENSAJE PARA OBSERVABLE ===');
        // Agregar el mensaje inmediatamente al observable local
        const newMessage: ChatMessage = {
          id: response.mensaje?.id?.toString() || Date.now().toString(),
          text: message,
          senderId: fromUserId.toString(),
          senderName: fromUserName,
          timestamp: new Date()
        };
        
        console.log('Nuevo mensaje creado:', newMessage);
        
        const currentMessages = this.messagesSubject.getValue();
        console.log('Mensajes actuales antes de agregar:', currentMessages.length);
        console.log('Mensajes actuales:', currentMessages);
        
        const updatedMessages = [...currentMessages, newMessage];
        console.log('Mensajes actualizados:', updatedMessages);
        console.log('Total después de agregar:', updatedMessages.length);
        
        this.messagesSubject.next(updatedMessages);
        console.log('Observable actualizado con next()');
        
        // Verificar que el observable se actualizó
        const verifyMessages = this.messagesSubject.getValue();
        console.log('Verificación: mensajes en observable después de next():', verifyMessages.length);
        
        // Luego enviar por WebSocket para notificación en tiempo real
        this.websocketService.sendMessage(
          this.chatId,
          fromUserId,
          toUserId,
          message,
          fromUserName
        );
        
        console.log('Mensaje agregado al observable local y enviado por WebSocket');
      } else {
        throw new Error(response.message || 'Error al enviar mensaje');
      }
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      throw error;
    }
  }

  // Enviar estado de escritura
  sendTypingStatus(userId: string, isTyping: boolean): void {
    // Implementar cuando el WebSocket tenga esta funcionalidad
    const typingUsers = this.typingUsersSubject.getValue();
    
    if (isTyping) {
      typingUsers.add(userId);
    } else {
      typingUsers.delete(userId);
    }
    
    this.typingUsersSubject.next(new Set(typingUsers));
  }

  // Limpiar los mensajes al cerrar el chat
  clearChat(): void {
    this.messagesSubject.next([]);
    this.typingUsersSubject.next(new Set());
    this.chatId = '';
    this.currentUserId = 0;
    this.currentUserName = '';
  }

  // Crear invitación de chat
  async crearInvitacionChat(
    invitanteId: number, 
    invitanteNombre: string, 
    invitadoId: number, 
    invitadoNombre: string
  ): Promise<InvitacionChatResponse> {
    try {
      const request: InvitacionChatRequest = {
        invitanteId,
        invitanteNombre,
        invitadoId,
        invitadoNombre
      };

      const response = await firstValueFrom(
        this.http.post<InvitacionChatResponse>(`${this.urlService.baseUrl}/chat/invitacion`, request)
      );
      return response;
    } catch (error) {
      console.error('Error al crear invitación de chat:', error);
      throw error;
    }
  }

  // Validar acceso al chat
  async validarAccesoChat(chatId: string, usuarioId: number): Promise<ValidacionChatResponse> {
    try {
      const params = new HttpParams().set('usuario_id', usuarioId.toString());
      const response = await firstValueFrom(
        this.http.get<any>(`${this.urlService.baseUrl}/chat/${chatId}/validar`, { params })
      );
      
      // Si el backend solo devuelve {valid: true}, necesitamos extraer la info del otro usuario del chatId
      if (response.valid) {
        const usuarios = this.extraerUsuariosDelChatId(chatId);
        if (usuarios) {
          const otroUsuarioId = usuarios.usuario1Id === usuarioId ? usuarios.usuario2Id : usuarios.usuario1Id;
          
          // Obtener información del otro usuario (simplificado)
          return {
            valid: true,
            chatId: chatId,
            otroUsuario: {
              id: otroUsuarioId,
              nombre: `Usuario ${otroUsuarioId}` // El backend no devuelve el nombre, usar placeholder
            }
          };
        }
      }
      
      return { valid: false, message: 'Acceso denegado al chat' };
    } catch (error) {
      console.error('Error al validar acceso al chat:', error);
      return { valid: false, message: 'Error al validar chat' };
    }
  }

  // Cargar más mensajes (para paginación)
  async cargarMasMensajes(page: number = 2): Promise<boolean> {
    try {
      const params = new HttpParams()
        .set('usuario_id', this.currentUserId.toString())
        .set('page', page.toString())
        .set('limit', '50');

      const response = await firstValueFrom(
        this.http.get<any>(`${this.urlService.baseUrl}/chat/${this.chatId}/mensajes`, { params })
      );

      if (response.success && response.mensajes && response.mensajes.length > 0) {
        const nuevosMensajes: ChatMessage[] = response.mensajes
          .reverse()
          .map((msg: any) => ({
            id: msg.id.toString(),
            text: msg.contenido,
            senderId: msg.usuario.id.toString(),
            senderName: msg.usuario.nombre,
            timestamp: this.parseTimestamp(msg.enviado_at),
            leido: msg.leido,
            tipo: msg.tipo
          }));

        const mensajesActuales = this.messagesSubject.getValue();
        this.messagesSubject.next([...nuevosMensajes, ...mensajesActuales]);
        
        return response.pagination.has_more_pages;
      }
      return false;
    } catch (error) {
      console.error('Error al cargar más mensajes:', error);
      return false;
    }
  }

  /**
   * Generar chatId basado en dos usuarios
   */
  generarChatId(usuario1Id: number, usuario2Id: number): string {
    const menorId = Math.min(usuario1Id, usuario2Id);
    const mayorId = Math.max(usuario1Id, usuario2Id);
    return `private_${menorId}_${mayorId}`;
  }

  /**
   * Extraer IDs de usuario del chatId
   */
  extraerUsuariosDelChatId(chatId: string): { usuario1Id: number; usuario2Id: number } | null {
    const match = chatId.match(/^private_(\d+)_(\d+)$/);
    if (match) {
      return {
        usuario1Id: parseInt(match[1]),
        usuario2Id: parseInt(match[2])
      };
    }
    return null;
  }

  /**
   * Obtener información del chat
   */
  async obtenerInfoChat(chatId: string, usuarioId: number): Promise<any> {
    try {
      const params = new HttpParams().set('usuario_id', usuarioId.toString());
      const response = await firstValueFrom(
        this.http.get<any>(`${this.urlService.baseUrl}/chat/${chatId}/info`, { params })
      );
      return response;
    } catch (error) {
      console.error('Error al obtener información del chat:', error);
      throw error;
    }
  }

  /**
   * Finalizar chat y opcionalmente calificar usuario
   */
  async finalizarChat(
    chatId: string, 
    usuarioId: number, 
    usuarioValorableId?: number, 
    calificacion?: number, 
    tipoValorable?: 'cliente' | 'casa_remate'
  ): Promise<any> {
    try {
      const body: any = {
        usuario_id: usuarioId
      };

      // Agregar parámetros de calificación si se proporcionan
      if (usuarioValorableId && calificacion && tipoValorable) {
        body.usuario_valorable_id = usuarioValorableId;
        body.calificacion = calificacion;
        body.tipo_valorable = tipoValorable;
      }

      const response = await firstValueFrom(
        this.http.post<any>(`${this.urlService.baseUrl}/chat/${chatId}/finalizar-chat`, body)
      );
      return response;
    } catch (error) {
      console.error('Error al finalizar chat:', error);
      throw error;
    }
  }

  /**
   * Verificar si el chat puede ser finalizado (después del pago)
   */
  puedeFinalizarChat(): boolean {
    // Lógica para verificar si se completó el pago
    // Por ahora retorna true, se puede mejorar
    return true;
  }

  /**
   * Verificar si se pueden hacer valoraciones
   */
  puedeValorar(chatId: string): boolean {
    // Verificar si el chat está finalizado
    // Por ahora retorna true, se puede mejorar
    return true;
  }

  /**
   * Obtener estado actual del servicio (para debugging)
   */
  obtenerEstadoActual(): any {
    return {
      chatId: this.chatId,
      currentUserId: this.currentUserId,
      currentUserName: this.currentUserName,
      mensajesCount: this.messagesSubject.getValue().length
    };
  }

  /**
   * Forzar emisión del observable de mensajes (para debugging)
   */
  forzarEmisionMensajes(): void {
    const currentMessages = this.messagesSubject.getValue();
    console.log('Forzando emisión con mensajes:', currentMessages);
    this.messagesSubject.next([...currentMessages]);
  }

  // Verificar estado del chat (si está finalizado y si necesita valoración)
  async verificarEstadoChat(chatId: string, usuarioId: number): Promise<any> {
    try {
      console.log('🌐 Haciendo petición al backend para verificar estado del chat:', chatId, 'usuario:', usuarioId);
      
      const params = new HttpParams()
        .set('usuario_id', usuarioId.toString());
      
      const response = await firstValueFrom(
        this.http.get<any>(`${this.urlService.baseUrl}/chat/${chatId}/estado`, { params })
      );
      
      console.log('✅ Respuesta del backend recibida:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Error al verificar estado del chat:', error);
      console.log('URL intentada:', `${this.urlService.baseUrl}/chat/${chatId}/estado`);
      console.log('Parámetros:', { usuario_id: usuarioId.toString() });
      
      // Si el endpoint no existe (404), devolver valores por defecto
      if (error.status === 404) {
        console.warn('⚠️ Endpoint /chat/{chatId}/estado no implementado en el backend. Usando valores por defecto.');
        return {
          chatFinalizado: false,
          necesitaValoracion: false,
          yaValoro: false
        };
      }
      
      // Para otros errores, también devolver valores por defecto
      return {
        chatFinalizado: false,
        necesitaValoracion: false,
        yaValoro: false
      };
    }
  }
}
