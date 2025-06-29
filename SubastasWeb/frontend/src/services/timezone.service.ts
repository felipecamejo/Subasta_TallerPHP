/*
 * EXPLICACIÓN DE ZONAS HORARIAS - ENFOQUE SIMPLIFICADO:
 * 
 * PROBLEMA ORIGINAL:
 * - El backend almacena fechas en hora local de Uruguay (America/Montevideo)
 * - Al enviar strings como "2025-06-30 20:00:00", JavaScript los interpreta según la zona local del navegador
 * - Esto causa diferencias incorrectas entre zonas horarias
 * 
 * NUEVA SOLUCIÓN - FLUJO DE 3 PASOS:
 * 1. BACKEND LOCAL → UTC: Interpretar la fecha como hora local de Uruguay y convertir a UTC
 * 2. UTC → ZONA USUARIO: Desde UTC, mostrar en la zona horaria del usuario
 * 3. FORMATEAR: Usar Intl.DateTimeFormat para mostrar correctamente
 * 
 * EJEMPLO CON SUBASTA A LAS 20:00 EN URUGUAY:
 * - Paso 1: "2025-06-30 20:00:00" (Uruguay) → "2025-06-30T23:00:00Z" (UTC)
 * - Paso 2: UTC → mostrar en zona del usuario
 *   - Uruguay: 20:00 (UTC-3)
 *   - Chile: 19:00 (UTC-4) 
 *   - Argentina: 20:00 (UTC-3)
 */

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

    // DEBUG: Ejecutar prueba automática para ver los logs
    setTimeout(() => {
      this.runTimezoneTest();
    }, 1000);
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

    // Actualizar el offset correctamente
    const date = new Date();
    const timezoneDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    // Corregir el cálculo del offset: el offset debe ser positivo para zonas al oeste de UTC
    this.timezoneOffsetMinutes = (timezoneDate.getTime() - date.getTime()) / (60 * 1000);
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
  public convertUTCToUserTimezone(utcDate: Date): Date {
    const userTimezone = this.getUserTimezone();
    
    // Crear la fecha en la zona horaria del usuario
    const userTimeString = utcDate.toLocaleString('sv-SE', { timeZone: userTimezone });
    return new Date(userTimeString);
  }

  /**
   * Alias para mantener compatibilidad con código existente
   * @deprecated Usar convertUTCToUserTimezone en su lugar
   */
  public convertToUserTimezone(utcDate: Date | string): Date {
    const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
    return this.convertUTCToUserTimezone(date);
  }

  /**
   * Convierte una fecha de la zona horaria del usuario a UTC
   */
  public convertToUTC(localDate: Date): Date {
    const userTimezone = this.getUserTimezone();
    
    // Crear un string de fecha en formato ISO sin zona horaria
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    const hours = String(localDate.getHours()).padStart(2, '0');
    const minutes = String(localDate.getMinutes()).padStart(2, '0');
    const seconds = String(localDate.getSeconds()).padStart(2, '0');
    
    const dateString = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    
    // Crear la fecha interpretándola como si fuera en la zona horaria del usuario
    const tempDate = new Date(dateString);
    const userOffset = new Date(tempDate.toLocaleString('en-US', { timeZone: userTimezone })).getTime() - tempDate.getTime();
    
    return new Date(tempDate.getTime() - userOffset);
  }

  /**
   * Convierte una fecha del backend (hora local Uruguay) a UTC
   * @param backendDateString Fecha en formato "YYYY-MM-DD HH:mm:ss" que está en hora local de Uruguay
   * @returns Date object en UTC
   */
  public convertBackendLocalTimeToUTC(backendDateString: string): Date {
    // Enfoque simplificado: Agregar explícitamente el offset de Uruguay
    let isoString = backendDateString;
    if (!backendDateString.includes('T')) {
      isoString = backendDateString.replace(' ', 'T');
    }
    
    // Uruguay está en UTC-3, así que agregamos -03:00 al string
    // Esto le dice a JavaScript que interprete la fecha como UTC-3
    const dateWithTimezone = isoString + '-03:00';
    
    // Crear la fecha - JavaScript automáticamente convertirá a UTC
    return new Date(dateWithTimezone);
  }

  /**
   * Formatea una fecha del backend siguiendo el flujo: Backend Local → UTC → Zona Usuario
   */
  public formatDate(date: Date | string, format: string = 'full'): string {
    let utcDate: Date;
    
    if (typeof date === 'string') {
      // Paso 1: Convertir la fecha local del backend a UTC
      utcDate = this.convertBackendLocalTimeToUTC(date);
    } else {
      // Si ya es un objeto Date, asumimos que está en UTC
      utcDate = date;
    }
    
    // Paso 2: Formatear en la zona horaria del usuario
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
    
    return new Intl.DateTimeFormat('es-UY', options).format(utcDate);
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
   * Crea una fecha especificando la zona horaria de origen
   * @param dateString String de fecha en formato ISO o "YYYY-MM-DD HH:mm:ss"
   * @param sourceTimezone Zona horaria de origen (por defecto America/Montevideo)
   * @returns Date object correctamente interpretado
   */
  public createDateFromTimezone(dateString: string, sourceTimezone: string = 'America/Montevideo'): Date {
    let isoString = dateString;
    
    if (!dateString.includes('T')) {
      isoString = dateString.replace(' ', 'T');
    }
    
    // Crear una fecha temporal asumiendo que es UTC
    const tempDate = new Date(isoString + 'Z'); // Agregar Z para que sea interpretada como UTC
    
    // Obtener cómo se vería esta fecha UTC en la zona horaria de origen
    const sourceTime = new Date(tempDate.toLocaleString('en-US', { timeZone: sourceTimezone }));
    
    // Calcular la diferencia entre UTC y la zona de origen
    const offsetMs = tempDate.getTime() - sourceTime.getTime();
    
    // La fecha original debería ser: fecha_interpretada - offset
    // Porque si la fecha local es X, entonces UTC = X + offset
    return new Date(tempDate.getTime() + offsetMs);
  }

  /**
   * Método para debugging del nuevo flujo de conversiones
   * @param backendDateString Fecha del backend a debuggear
   * @param label Etiqueta para identificar el debug
   */
  public debugTimezone(backendDateString: string, label: string = ''): void {
    console.log(`🕐 Debug Timezone ${label}:`);
    console.log(`  📅 Fecha original del backend: ${backendDateString}`);
    
    // Paso 1: Convertir a UTC
    const utcDate = this.convertBackendLocalTimeToUTC(backendDateString);
    console.log(`  🌍 Convertida a UTC: ${utcDate.toISOString()}`);
    
    // Paso 2: Mostrar en diferentes zonas horarias
    const userTimezone = this.getUserTimezone();
    console.log(`  👤 Zona horaria del usuario: ${userTimezone}`);
    console.log(`  📍 En Uruguay: ${utcDate.toLocaleString('es-UY', { timeZone: 'America/Montevideo' })}`);
    console.log(`  📍 En Chile: ${utcDate.toLocaleString('es-CL', { timeZone: 'America/Santiago' })}`);
    console.log(`  📍 En Argentina: ${utcDate.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}`);
    console.log(`  🎯 En zona del usuario (${userTimezone}): ${utcDate.toLocaleString('es-UY', { timeZone: userTimezone })}`);
  }

  /**
   * Crea una fecha UTC desde una fecha del backend (hora local Uruguay)
   * @param backendDateString Fecha del backend en formato "YYYY-MM-DD HH:mm:ss"
   * @returns Date object en UTC
   */
  public createDateFromBackend(backendDateString: string): Date {
    return this.convertBackendLocalTimeToUTC(backendDateString);
  }

  /**
   * Formatea una fecha del backend para mostrar en la zona horaria del usuario
   * @param backendDate Fecha que viene del backend (en hora local de Uruguay)
   * @param format Formato de salida
   * @returns String formateado en la zona horaria del usuario
   */
  public formatBackendDate(backendDate: Date | string, format: string = 'datetime'): string {
    return this.formatDate(backendDate, format);
  }

  /**
   * Ejecuta una prueba automática de zona horaria para debugging
   */
  private runTimezoneTest(): void {
    console.log('🚀 INICIANDO PRUEBA AUTOMÁTICA DE ZONA HORARIA');
    console.log('================================================');
    
    // Probar con una fecha de ejemplo
    const fechaEjemplo = "2025-06-30 20:00:00";
    this.debugTimezone(fechaEjemplo, "PRUEBA AUTOMÁTICA");
    
    console.log('================================================');
    console.log('🔍 Si ves este mensaje, los logs están funcionando!');
    console.log('💡 Para Chile: debería mostrar 19:00 (1 hora antes que Uruguay)');
  }
}
