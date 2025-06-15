import { Component, ElementRef, OnInit, OnDestroy, ViewChild, Input, Output, EventEmitter, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

interface ChatUser {
  id: string;
  name: string;
  avatar?: string;
}

interface ChatMessage {
  id: string;
  text: string;
  senderName: string;
  senderAvatar: string;
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
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @Input() currentChat: ChatUser | null = null;
  @Input() currentUserId: string = 'user1';
  @Output() close = new EventEmitter<void>();

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  minimized: boolean = false;
  messages: ChatMessage[] = [];
  newMessage: string = '';
  isTyping: boolean = false;
  typingUsers = new Set<string>();
  private typingSubject = new Subject<boolean>();

  constructor(private chatService: ChatService) {
    // Mensajes de ejemplo para visualización
    this.messages = [
      {
        id: '1',
        text: '¡Hola! Me interesa el artículo que subastaste',
        senderName: 'Juan Pérez',
        senderAvatar: 'assets/avatars/user1.png',
        timestamp: new Date(),
        isOwn: false
      },
      {
        id: '2',
        text: '¡Hola! Claro, ¿qué te gustaría saber?',
        senderName: 'Yo',
        senderAvatar: 'assets/avatars/me.png',
        timestamp: new Date(),
        isOwn: true
      }
    ];

    // Configurar el debounce para el estado de escritura
    this.typingSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(isTyping => {
      this.chatService.sendTypingStatus(this.currentUserId, isTyping);
    });
  }

  ngOnInit(): void {
    // Suscribirse a los mensajes
    this.chatService.messages$.subscribe(messages => {
      this.messages = messages.map(msg => ({
        ...msg,
        isOwn: msg.senderId === this.currentUserId,
        timestamp: new Date(msg.timestamp || new Date()),
        senderAvatar: 'assets/default-avatar.png'
      }));
      this.scrollToBottom();
    });

    // Suscribirse a los usuarios escribiendo
    this.chatService.typingUsers$.subscribe(users => {
      this.typingUsers = users;
    });
  }

  ngOnDestroy(): void {
    this.typingSubject.complete();
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  toggleMinimize(): void {
    this.minimized = !this.minimized;
  }

  closeChat(event: MouseEvent): void {
    event.stopPropagation();
    this.close.emit();
  }

  onMessageInput(): void {
    this.typingSubject.next(true);
    setTimeout(() => this.typingSubject.next(false), 2000);
  }

  sendMessage(): void {
    if (this.newMessage.trim()) {
      const message: ChatMessage = {
        id: Date.now().toString(),
        text: this.newMessage,
        senderName: 'Yo',
        senderAvatar: 'assets/avatars/me.png',
        timestamp: new Date(),
        isOwn: true
      };
      
      this.messages.push(message);
      this.newMessage = '';
    }
  }

  formatMessageTime(date: Date): string {
    const now = new Date();
    const messageDate = new Date(date);
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

  private scrollToBottom(): void {
    try {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    } catch (err) {
      console.error('Error al hacer scroll:', err);
    }
  }
}
