import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TimezoneService } from '../../../services/timezone.service';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

interface TimezoneOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-timezone-selector',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DropdownModule,
    ButtonModule,
    ToastModule
  ],
  providers: [MessageService],
  template: `
    <div class="timezone-selector">
      <h3>Configuración de Zona Horaria</h3>
      <p>Zona horaria actual: <strong>{{ currentTimezone }}</strong></p>
      
      <div class="timezone-dropdown">
        <p-dropdown 
          [options]="timezones" 
          [(ngModel)]="selectedTimezone" 
          optionLabel="label" 
          placeholder="Selecciona tu zona horaria"
          [filter]="true"
          filterBy="label">
        </p-dropdown>
      </div>
      
      <div class="timezone-actions">
        <p-button 
          label="Usar zona horaria del sistema" 
          icon="pi pi-sync" 
          (onClick)="useSystemTimezone()"
          styleClass="p-button-secondary p-button-sm">
        </p-button>
        
        <p-button 
          label="Guardar" 
          icon="pi pi-save" 
          (onClick)="saveTimezone()"
          [disabled]="!isTimezoneChanged()"
          styleClass="p-button-sm">
        </p-button>
      </div>
      
      <div class="timezone-info">
        <p>La hora actual en tu zona horaria es: <strong>{{ currentTime }}</strong></p>
      </div>
      
      <p-toast></p-toast>
    </div>
  `,
  styles: [`
    .timezone-selector {
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
      margin-bottom: 1rem;
    }
    
    .timezone-dropdown {
      margin: 1rem 0;
    }
    
    .timezone-actions {
      display: flex;
      gap: 1rem;
      margin: 1rem 0;
    }
    
    .timezone-info {
      margin-top: 1rem;
      font-size: 0.9rem;
      color: #666;
    }
  `]
})
export class TimezoneSelectorComponent implements OnInit {
  selectedTimezone: TimezoneOption | null = null;
  timezones: TimezoneOption[] = [];
  currentTimezone: string = '';
  currentTime: string = '';
  
  private updateTimeInterval: any;

  constructor(
    private timezoneService: TimezoneService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    // Obtener la zona horaria actual
    this.currentTimezone = this.timezoneService.getUserTimezone();
    
    // Cargar zonas horarias disponibles
    this.loadAvailableTimezones();
    
    // Actualizar hora cada minuto
    this.updateCurrentTime();
    this.updateTimeInterval = setInterval(() => this.updateCurrentTime(), 60000);
  }

  ngOnDestroy(): void {
    if (this.updateTimeInterval) {
      clearInterval(this.updateTimeInterval);
    }
  }

  private updateCurrentTime(): void {
    this.currentTime = this.timezoneService.formatDate(new Date(), 'time');
  }

  private loadAvailableTimezones(): void {
    // Podríamos cargarlas desde el backend, pero por ahora usaremos una lista predefinida
    const commonTimezones = [
      'America/Montevideo',
      'America/Argentina/Buenos_Aires',
      'America/Sao_Paulo',
      'America/Santiago',
      'America/La_Paz',
      'America/Asuncion',
      'America/Lima',
      'America/Bogota',
      'America/Mexico_City',
      'America/New_York',
      'Europe/Madrid',
      'Europe/London',
      'UTC'
    ];
    
    // Convertir a opciones de dropdown
    this.timezones = commonTimezones.map(tz => ({
      label: this.formatTimezoneLabel(tz),
      value: tz
    }));
    
    // Preseleccionar la zona actual
    const currentTz = this.timezones.find(tz => tz.value === this.currentTimezone);
    if (currentTz) {
      this.selectedTimezone = currentTz;
    }
    
    // También podríamos cargar la lista completa desde el backend
    /*
    this.timezoneService.getAvailableTimezones().subscribe(
      (timezones) => {
        this.timezones = timezones.map(tz => ({
          label: this.formatTimezoneLabel(tz),
          value: tz
        }));
        
        const currentTz = this.timezones.find(tz => tz.value === this.currentTimezone);
        if (currentTz) {
          this.selectedTimezone = currentTz;
        }
      },
      (error) => {
        console.error('Error loading timezones', error);
      }
    );
    */
  }

  private formatTimezoneLabel(timezone: string): string {
    // Formatear para mostrar el nombre de la ciudad y el offset
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      timeZoneName: 'long'
    };
    const formatter = new Intl.DateTimeFormat('es-UY', options);
    const formatted = formatter.format(now);
    
    // Extraer solo la parte de zona horaria
    const tzPart = formatted.split(',').pop()?.trim() || timezone;
    
    return `${timezone.replace('_', ' ')} (${tzPart})`;
  }

  saveTimezone(): void {
    if (this.selectedTimezone) {
      this.timezoneService.setUserTimezone(this.selectedTimezone.value);
      this.currentTimezone = this.selectedTimezone.value;
      this.updateCurrentTime();
      
      this.messageService.add({
        severity: 'success',
        summary: 'Zona horaria actualizada',
        detail: `Tu zona horaria ha sido establecida a ${this.selectedTimezone.label}`,
        life: 3000
      });
    }
  }

  useSystemTimezone(): void {
    this.timezoneService.detectAndSetUserTimezone();
    this.currentTimezone = this.timezoneService.getUserTimezone();
    
    // Actualizar selección en dropdown
    const systemTz = this.timezones.find(tz => tz.value === this.currentTimezone);
    if (systemTz) {
      this.selectedTimezone = systemTz;
    }
    
    this.updateCurrentTime();
    
    this.messageService.add({
      severity: 'info',
      summary: 'Zona horaria del sistema',
      detail: `Se ha establecido la zona horaria de tu dispositivo: ${this.currentTimezone}`,
      life: 3000
    });
  }

  isTimezoneChanged(): boolean {
    return this.selectedTimezone?.value !== this.currentTimezone;
  }
}
