import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ChatService } from '../../services/chat.service';
import { NotificacionService } from '../../services/notificacion.service';
import { notificacionUsuarioDto } from '../../models/notificacionDto';
import { Router } from '@angular/router';

@Component({
  selector: 'app-test-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule],  template: `
    <div class="test-chat-container">
      <h2>Prueba de Chat Privado</h2>
      
      <div class="form-group">
        <label>Usuario 1 ID:</label>
        <input type="number" [(ngModel)]="usuario1Id" pInputText />
      </div>
      
      <div class="form-group">
        <label>Usuario 1 Nombre:</label>
        <input type="text" [(ngModel)]="usuario1Nombre" pInputText />
      </div>
      
      <div class="form-group">
        <label>Usuario 2 ID:</label>
        <input type="number" [(ngModel)]="usuario2Id" pInputText />
      </div>
      
      <div class="form-group">
        <label>Usuario 2 Nombre:</label>
        <input type="text" [(ngModel)]="usuario2Nombre" pInputText />
      </div>
      
      <div class="actions">
        <p-button 
          label="Crear Chat Privado" 
          (click)="crearChat()"
          [disabled]="!usuario1Id || !usuario2Id || !usuario1Nombre || !usuario2Nombre">
        </p-button>
        
        <p-button 
          label="Ver Notificaciones Usuario 1" 
          (click)="verNotificaciones(usuario1Id)"
          severity="secondary"
          [disabled]="!usuario1Id">
        </p-button>
        
        <p-button 
          label="Ver Notificaciones Usuario 2" 
          (click)="verNotificaciones(usuario2Id)"
          severity="secondary"
          [disabled]="!usuario2Id">
        </p-button>
      </div>
      
      <div *ngIf="mensaje" class="mensaje">
        {{ mensaje }}
      </div>
      
      <div *ngIf="chatId" class="chat-info">
        <p>Chat creado con ID: {{ chatId }}</p>
        <p>Los usuarios recibirán notificaciones para unirse al chat.</p>
      </div>
      
      <div *ngIf="notificaciones.length > 0" class="notificaciones">
        <h3>Notificaciones para Usuario {{ usuarioActual }}:</h3>
        <div *ngFor="let notif of notificaciones" class="notificacion" 
             [class.chat-notification]="notif.esMensajeChat">
          <h4>{{ notif.titulo }}</h4>
          <p>{{ notif.mensaje }}</p>
          <p><small>{{ notif.fechaHora | date:'short' }}</small></p>          <p-button 
            *ngIf="notif.esMensajeChat && notif.chatId"
            label="Abrir Chat" 
            (click)="abrirChat(notif.chatId!)"
            size="small">
          </p-button>
        </div>
      </div>
    </div>
  `,  styles: [`
    .test-chat-container {
      padding: 20px;
      max-width: 700px;
      margin: 0 auto;
    }
    
    .form-group {
      margin-bottom: 15px;
    }
    
    .form-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
    }
    
    .actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 20px;
    }
    
    .mensaje {
      margin-top: 15px;
      padding: 10px;
      background-color: #e8f5e8;
      border: 1px solid #4caf50;
      border-radius: 4px;
    }
    
    .chat-info {
      margin-top: 15px;
      padding: 10px;
      background-color: #e3f2fd;
      border: 1px solid #2196f3;
      border-radius: 4px;
    }
    
    .notificaciones {
      margin-top: 20px;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 15px;
    }
    
    .notificacion {
      border: 1px solid #eee;
      border-radius: 4px;
      padding: 10px;
      margin-bottom: 10px;
      background-color: #f9f9f9;
    }
    
    .chat-notification {
      background-color: #fff3cd;
      border-color: #ffeaa7;
    }
    
    .notificacion h4 {
      margin: 0 0 5px 0;
      color: #333;
    }
    
    .notificacion p {
      margin: 5px 0;
    }
  `]
})
export class TestChatComponent {
  usuario1Id: number = 1;
  usuario1Nombre: string = 'Juan';
  usuario2Id: number = 2;
  usuario2Nombre: string = 'María';
  mensaje: string = '';
  chatId: string = '';
  notificaciones: notificacionUsuarioDto[] = [];
  usuarioActual: number = 0;
  constructor(
    private chatService: ChatService,
    private notificacionService: NotificacionService,
    private router: Router
  ) {}
  crearChat(): void {
    this.mensaje = '';
    this.chatId = '';
    
    // Validar que los usuarios sean diferentes
    if (this.usuario1Id === this.usuario2Id) {
      this.mensaje = 'Error: Los usuarios deben ser diferentes';
      return;
    }
      this.chatService.crearInvitacionChat(
      this.usuario1Id,
      this.usuario1Nombre,
      this.usuario2Id,
      this.usuario2Nombre
    ).then((resultado: any) => {
      console.log('Chat creado:', resultado);
      if (resultado.success) {
        this.chatId = resultado.chatId ?? '';
        this.mensaje = `Chat creado exitosamente: ${resultado.message}`;
      } else {
        this.mensaje = `Error: ${resultado.message}`;
      }
    }).catch((error: any) => {
      console.error('Error al crear chat:', error);
      this.mensaje = 'Error al crear el chat: ' + (error.error?.message || error.message);
    });
  }

  verNotificaciones(usuarioId: number): void {
    this.usuarioActual = usuarioId;
    this.notificacionService.obtenerNotificacionesPublico(usuarioId).subscribe({
      next: (notificaciones) => {
        this.notificaciones = notificaciones;
        console.log('Notificaciones obtenidas para usuario', usuarioId, ':', notificaciones);
      },
      error: (error) => {
        console.error('Error al obtener notificaciones:', error);
        this.mensaje = 'Error al obtener notificaciones';
        this.notificaciones = [];
      }
    });
  }  abrirChat(chatId: string): void {
    if (chatId) {
      // Navegar al chat como página completa
      this.router.navigate(['/chat', chatId]);
    }
  }
}
