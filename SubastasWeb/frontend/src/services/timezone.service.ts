import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, of } from 'rxjs';
import { environment } from '../environments/environment';

interface TimezoneLocation {
  lat: number;
  lng: number;
  timezone: string;
}

@Injectable({
  providedIn: 'root'
})
export class TimezoneService {
  private userTimezoneSubject = new BehaviorSubject<string>(this.getDefaultTimezone());
  public userTimezone$: Observable<string> = this.userTimezoneSubject.asObservable();
  
  // Zona horaria base del sistema (UTC-3, Uruguay/Argentina)
  private readonly BASE_TIMEZONE = 'America/Montevideo';
  private readonly BASE_OFFSET_HOURS = -3; // UTC-3
  
  // Almacenar el offset del usuario en minutos para cálculos rápidos
  private userTimezoneOffsetMinutes: number = 0;

  constructor(private http: HttpClient) {
    // Intentar obtener zona horaria guardada
    const savedTimezone = localStorage.getItem('userTimezone');
    if (savedTimezone) {
      this.userTimezoneSubject.next(savedTimezone);
      this.updateUserTimezoneOffset(savedTimezone);
    } else {
      // Si no existe, detectar y guardar
      this.detectAndSetUserTimezone();
    }
  }

  /**
   * Detecta la zona horaria del navegador del usuario
   */
  private getDefaultTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  }

  /**
   * Detecta y establece la zona horaria del usuario
   */
  public detectAndSetUserTimezone(): void {
    const detectedTimezone = this.getDefaultTimezone();
    this.setUserTimezone(detectedTimezone);
  }

  /**
   * Establece manualmente la zona horaria
   */
  public setUserTimezone(timezone: string): void {
    localStorage.setItem('userTimezone', timezone);
    this.userTimezoneSubject.next(timezone);
    this.updateUserTimezoneOffset(timezone);
  }

  /**
   * Actualiza el offset de la zona horaria del usuario
   */
  private updateUserTimezoneOffset(timezone: string): void {
    // Simplificar el cálculo del offset
    const date = new Date();
    const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
    
    // Crear una fecha en la zona horaria específica
    const localTime = new Date(utcTime).toLocaleString('en-CA', { 
      timeZone: timezone,
      hour12: false 
    });
    const timezoneTime = new Date(localTime).getTime();
    
    // Calcular la diferencia en minutos
    this.userTimezoneOffsetMinutes = (timezoneTime - utcTime) / (60 * 1000);
  }

  /**
   * Obtiene la zona horaria actual del usuario
   */
  public getUserTimezone(): string {
    return this.userTimezoneSubject.value;
  }

  /**
   * Convierte una fecha desde UTC-3 (hora base del sistema) a UTC
   * Usar este método cuando recibas una fecha desde el backend
   */
  public convertFromBaseToUTC(baseDate: Date | string): Date {
    const date = new Date(baseDate);
    // UTC-3 = UTC + 3 horas, así que para convertir a UTC restamos 3 horas
    return new Date(date.getTime() + (3 * 60 * 60 * 1000));
  }

  /**
   * Convierte una fecha desde UTC a UTC-3 (hora base del sistema)
   * Usar este método cuando envíes una fecha al backend
   */
  public convertFromUTCToBase(utcDate: Date | string): Date {
    const date = new Date(utcDate);
    // Para convertir de UTC a UTC-3, restamos 3 horas
    return new Date(date.getTime() - (3 * 60 * 60 * 1000));
  }

  /**
   * Convierte una fecha UTC a la zona horaria del usuario
   */
  public convertUTCToUserTimezone(utcDate: Date | string): Date {
    const date = new Date(utcDate);
    const userTimezone = this.getUserTimezone();
    
    // Usar toLocaleString para obtener la fecha en la zona horaria del usuario
    const dateString = date.toLocaleString('en-CA', {
      timeZone: userTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    // Parsear el string resultante
    return new Date(dateString);
  }

  /**
   * Convierte una fecha de la zona horaria del usuario a UTC
   */
  public convertUserTimezoneToUTC(localDate: Date): Date {
    const userTimezone = this.getUserTimezone();
    
    // Crear la fecha como si fuera UTC
    const utcDate = new Date(Date.UTC(
      localDate.getFullYear(),
      localDate.getMonth(),
      localDate.getDate(),
      localDate.getHours(),
      localDate.getMinutes(),
      localDate.getSeconds(),
      localDate.getMilliseconds()
    ));
    
    // Ajustar por el offset de la zona horaria del usuario
    const offsetMinutes = this.userTimezoneOffsetMinutes;
    return new Date(utcDate.getTime() - (offsetMinutes * 60 * 1000));
  }

  /**
   * Método principal para mostrar fechas al usuario
   * Convierte desde UTC-3 (backend) -> UTC -> Zona horaria del usuario
   */
  public convertFromBaseToUserTimezone(baseDate: Date | string): Date {
    const utcDate = this.convertFromBaseToUTC(baseDate);
    return this.convertUTCToUserTimezone(utcDate);
  }

  /**
   * Método principal para enviar fechas al backend
   * Convierte desde Zona horaria del usuario -> UTC -> UTC-3 (backend)
   */
  public convertFromUserTimezoneToBase(userDate: Date): Date {
    const utcDate = this.convertUserTimezoneToUTC(userDate);
    return this.convertFromUTCToBase(utcDate);
  }

  /**
   * Formatea una fecha según la zona horaria del usuario
   * @param date Fecha en formato UTC-3 (desde el backend)
   * @param format Formato de salida
   */
  public formatDate(date: Date | string, format: string = 'full'): string {
    const userDate = this.convertFromBaseToUserTimezone(date);
    
    const options: Intl.DateTimeFormatOptions = {};
    
    switch(format) {
      case 'full':
        options.dateStyle = 'full';
        options.timeStyle = 'long';
        break;
      case 'datetime':
        options.dateStyle = 'medium';
        options.timeStyle = 'short';
        break;
      case 'date':
        options.dateStyle = 'medium';
        break;
      case 'time':
        options.timeStyle = 'short';
        break;
    }
    
    return new Intl.DateTimeFormat('es-UY', options).format(userDate);
  }

  /**
   * Formatea una fecha directamente en la zona horaria del usuario (sin conversión desde base)
   * @param date Fecha ya en la zona horaria correcta
   * @param format Formato de salida
   */
  public formatDateDirect(date: Date | string, format: string = 'full'): string {
    const dateObj = new Date(date);
    const userTimezone = this.getUserTimezone();
    
    const options: Intl.DateTimeFormatOptions = {
      timeZone: userTimezone
    };
    
    switch(format) {
      case 'full':
        options.dateStyle = 'full';
        options.timeStyle = 'long';
        break;
      case 'datetime':
        options.dateStyle = 'medium';
        options.timeStyle = 'short';
        break;
      case 'date':
        options.dateStyle = 'medium';
        break;
      case 'time':
        options.timeStyle = 'short';
        break;
    }
    
    return new Intl.DateTimeFormat('es-UY', options).format(dateObj);
  }

  /**
   * Obtiene una lista de zonas horarias disponibles desde la API
   */
  public getAvailableTimezones(): Observable<string[]> {
    return this.http.get<string[]>(`${environment.apiUrl}/api/timezones`);
  }
  /**
   * Determina la zona horaria basada en coordenadas geográficas
   * @param lat Latitud
   * @param lng Longitud
   * @returns Observable con la zona horaria determinada
   */
  public getTimezoneFromCoordinates(lat: number, lng: number): Observable<string> {
    // Usamos el método de estimación basado en coordenadas
    return of(this.estimateTimezoneFromCoordinates(lat, lng));
  }
  
  /**
   * Estima la zona horaria basada en coordenadas (método de fallback)
   * @param lat Latitud
   * @param lng Longitud
   * @returns Zona horaria estimada
   */
  private estimateTimezoneFromCoordinates(lat: number, lng: number): string {
    // Tabla de referencia para zonas horarias comunes en América Latina
    const timezoneLocations: TimezoneLocation[] = [
      { lat: -34.9033, lng: -56.1882, timezone: 'America/Montevideo' },    // Montevideo
      { lat: -34.6037, lng: -58.3816, timezone: 'America/Argentina/Buenos_Aires' }, // Buenos Aires
      { lat: -23.5505, lng: -46.6333, timezone: 'America/Sao_Paulo' },     // Sao Paulo
      { lat: -33.4489, lng: -70.6693, timezone: 'America/Santiago' },      // Santiago
      { lat: -16.5000, lng: -68.1500, timezone: 'America/La_Paz' },        // La Paz
      { lat: -25.2637, lng: -57.5759, timezone: 'America/Asuncion' },      // Asunción
      { lat: -12.0432, lng: -77.0282, timezone: 'America/Lima' },          // Lima
      { lat: 4.7110, lng: -74.0721, timezone: 'America/Bogota' },          // Bogotá
      { lat: 19.4326, lng: -99.1332, timezone: 'America/Mexico_City' },    // Ciudad de México
      { lat: 40.7128, lng: -74.0060, timezone: 'America/New_York' },       // Nueva York
      { lat: 40.4168, lng: -3.7038, timezone: 'Europe/Madrid' },           // Madrid
      { lat: 51.5074, lng: -0.1278, timezone: 'Europe/London' },           // Londres
    ];
    
    // Encontrar la ubicación más cercana en nuestra lista
    let closestLocation = timezoneLocations[0];
    let minDistance = this.calculateDistance(lat, lng, closestLocation.lat, closestLocation.lng);
    
    for (let i = 1; i < timezoneLocations.length; i++) {
      const distance = this.calculateDistance(lat, lng, timezoneLocations[i].lat, timezoneLocations[i].lng);
      if (distance < minDistance) {
        minDistance = distance;
        closestLocation = timezoneLocations[i];
      }
    }
    
    return closestLocation.timezone;
  }
  
  /**
   * Calcula la distancia entre dos puntos usando la fórmula de Haversine
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Radio de la tierra en km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
      
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distancia en km
  }
  
  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }
  
  /**
   * Establece la zona horaria según la ubicación del usuario
   * @param lat Latitud
   * @param lng Longitud
   */
  public setTimezoneFromLocation(lat: number, lng: number): void {
    this.getTimezoneFromCoordinates(lat, lng).subscribe(timezone => {
      this.setUserTimezone(timezone);
    });
  }

  /**
   * Obtiene la fecha actual en UTC-3 (zona base del sistema)
   */
  public getCurrentBaseTime(): Date {
    const now = new Date();
    return this.convertFromUTCToBase(now);
  }

  /**
   * Obtiene la fecha actual en la zona horaria del usuario
   * Como JavaScript Date ya está en la zona horaria local, simplemente devolvemos la fecha actual
   */
  public getCurrentUserTime(): Date {
    return new Date(); // JavaScript Date ya está en zona horaria local
  }

  /**
   * Obtiene la fecha actual real del navegador (sin conversiones)
   * Útil para debugging y verificación
   */
  public getCurrentLocalTime(): Date {
    return new Date();
  }

  /**
   * Obtiene la fecha actual formateada en la zona horaria del navegador
   */
  public formatCurrentLocalTime(): string {
    const now = new Date();
    return now.toLocaleString('es-UY', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }

  /**
   * Valida si una fecha de subasta es válida (futura)
   * @param auctionDate Fecha de subasta en formato UTC-3 (desde backend)
   */
  public isValidAuctionDate(auctionDate: Date | string): boolean {
    const auctionDateUTC = this.convertFromBaseToUTC(auctionDate);
    const now = new Date();
    return auctionDateUTC > now;
  }

  /**
   * Calcula el tiempo restante hasta una subasta
   * @param auctionDate Fecha de subasta en formato UTC-3 (desde backend)
   * @returns Tiempo restante en milisegundos
   */
  public getTimeUntilAuction(auctionDate: Date | string): number {
    const auctionDateUTC = this.convertFromBaseToUTC(auctionDate);
    const now = new Date();
    return Math.max(0, auctionDateUTC.getTime() - now.getTime());
  }

  /**
   * Formatea el tiempo restante en formato legible
   * @param milliseconds Tiempo en milisegundos
   */
  public formatTimeRemaining(milliseconds: number): string {
    if (milliseconds <= 0) {
      return 'Finalizada';
    }

    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}
