import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, BehaviorSubject } from 'rxjs';

// Interfaces para tipado
export interface BidData {
  auctionId: number;
  userId: number;
  userName: string;
  bidAmount: number;
  loteId: number;
  timestamp: string;
}

export interface MessageData {
  chatId: string;
  fromUserId: number;
  toUserId: number;
  message: string;
  fromUserName: string;
  timestamp: string;
}

export interface UserData {
  userId: number;
  userName: string;
  usersCount?: number;
}

export interface LoteData {
  newLoteIndex: number;
  loteData: any;
}

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket: Socket;
  private connectionStatus = new BehaviorSubject<boolean>(false);
  public connectionStatus$ = this.connectionStatus.asObservable();

  constructor() {
    this.socket = io('http://localhost:3001');
    this.setupConnectionEvents();
  }

  private setupConnectionEvents() {
    this.socket.on('connect', () => {
      console.log('Conectado al servidor WebSocket');
      this.connectionStatus.next(true);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Desconectado del servidor WebSocket:', reason);
      this.connectionStatus.next(false);
      
      // Reconexión automática si no fue desconexión manual
      if (reason !== 'io client disconnect') {
        setTimeout(() => {
          console.log('Intentando reconectar...');
          this.socket.connect();
        }, 3000);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Error de conexión WebSocket:', error);
      this.connectionStatus.next(false);
    });
  }

  joinAuction(auctionId: number, userId: number, userName: string) {
    this.socket.emit('join_auction', { auctionId, userId, userName });
  }

  leaveAuction(auctionId: number, userId: number, userName: string) {
    this.socket.emit('leave_auction', { auctionId, userId, userName });
  }

  sendBid(auctionId: number, userId: number, userName: string, bidAmount: number, loteId: number) {
    this.socket.emit('new_bid', {
      auctionId,
      userId,
      userName,
      bidAmount,
      loteId,
      timestamp: new Date().toISOString()
    });
  }

  onBidReceived(): Observable<BidData> {
    return new Observable(observer => {
      this.socket.on('bid_received', (data: BidData) => observer.next(data));
    });
  }

  onUserJoined(): Observable<UserData> {
    return new Observable(observer => {
      this.socket.on('user_joined', (data: UserData) => observer.next(data));
    });
  }

  onUserLeft(): Observable<UserData> {
    return new Observable(observer => {
      this.socket.on('user_left', (data: UserData) => observer.next(data));
    });
  }

  onLoteUpdated(): Observable<LoteData> {
    return new Observable(observer => {
      this.socket.on('lote_updated', (data: LoteData) => observer.next(data));
    });
  }

  onAuctionJoined(): Observable<{ auctionId: number }> {
    return new Observable(observer => {
      this.socket.on('joined_auction', (data: { auctionId: number }) => observer.next(data));
    });
  }

  sendLoteChange(auctionId: number, newLoteIndex: number, loteData: any) {
    this.socket.emit('lote_changed', {
      auctionId,
      newLoteIndex,
      loteData
    });
  }

  joinChat(chatId: string, userId: number, userName: string) {
    this.socket.emit('join_chat', { chatId, userId, userName });
  }

  sendMessage(chatId: string, fromUserId: number, toUserId: number, message: string, fromUserName: string) {
    this.socket.emit('send_message', {
      chatId,
      fromUserId,
      toUserId,
      message,
      fromUserName,
      timestamp: new Date().toISOString()
    });
  }
  onNewMessage(): Observable<MessageData> {
    return new Observable(observer => {
      this.socket.on('new_message', (data: MessageData) => observer.next(data));
    });
  }

  sendTimerUpdate(auctionId: number, timerData: any) {
    this.socket.emit('auction_timer_update', { auctionId, timerData });
  }

  onTimerUpdated(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('timer_updated', (data: any) => observer.next(data));
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  reconnect() {
    this.socket.connect();
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}