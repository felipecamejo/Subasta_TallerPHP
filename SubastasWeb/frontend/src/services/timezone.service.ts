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
  
  // Almacenar el offset en minutos para cálculos rápidos
  private timezoneOffsetMinutes: number = new Date().getTimezoneOffset();

  constructor(private http: HttpClient) {
    // Intentar obtener zona horaria guardada
    const savedTimezone = localStorage.getItem('userTimezone');
    if (savedTimezone) {
      this.userTimezoneSubject.next(savedTimezone);
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

    // También actualizar el offset
    const date = new Date();
    const timezoneDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    this.timezoneOffsetMinutes = (date.getTime() - timezoneDate.getTime()) / (60 * 1000);
  }

  /**
   * Obtiene la zona horaria actual del usuario
   */
  public getUserTimezone(): string {
    return this.userTimezoneSubject.value;
  }

  /**
   * Convierte una fecha UTC a la zona horaria del usuario
   */
  public convertToUserTimezone(utcDate: Date | string): Date {
    const date = new Date(utcDate);
    
    // El offset está en minutos y es negativo para zonas al este de UTC
    // Ajustamos el tiempo sumando los minutos del offset
    return new Date(date.getTime() - (this.timezoneOffsetMinutes * 60 * 1000));
  }

  /**
   * Convierte una fecha de la zona horaria del usuario a UTC
   */
  public convertToUTC(localDate: Date): Date {
    return new Date(localDate.getTime() + (this.timezoneOffsetMinutes * 60 * 1000));
  }

  /**
   * Formatea una fecha según la zona horaria del usuario
   */
  public formatDate(date: Date | string, format: string = 'full'): string {
    const userDate = this.convertToUserTimezone(date);
    
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
}
