import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { WebsocketService } from './webSocketService';

interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: Date | string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  public messages$ = this.messagesSubject.asObservable();
  
  private typingUsersSubject = new BehaviorSubject<Set<string>>(new Set());
  public typingUsers$ = this.typingUsersSubject.asObservable();
  
  private chatId: string = '';

  constructor(private websocketService: WebsocketService) {
    // Suscribirse a los mensajes de WebSocket
    this.websocketService.onNewMessage().subscribe(messageData => {
      if (messageData.chatId === this.chatId) {
        const newMessage: ChatMessage = {
          id: Date.now().toString(),
          text: messageData.message,
          senderId: messageData.fromUserId.toString(),
          senderName: messageData.fromUserName,
          timestamp: messageData.timestamp
        };
        
        const currentMessages = this.messagesSubject.getValue();
        this.messagesSubject.next([...currentMessages, newMessage]);
      }
    });
  }

  // Inicializar un chat con un ID específico
  initializeChat(chatId: string, userId: number, userName: string): void {
    this.chatId = chatId;
    this.messagesSubject.next([]);
    this.websocketService.joinChat(chatId, userId, userName);
  }

  // Enviar un mensaje
  sendMessage(fromUserId: number, toUserId: number, message: string, fromUserName: string): void {
    if (!message.trim() || !this.chatId) return;
    
    this.websocketService.sendMessage(
      this.chatId,
      fromUserId,
      toUserId,
      message,
      fromUserName
    );
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
  }
}
