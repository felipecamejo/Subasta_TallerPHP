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
      <p>Tu zona horaria actual es: <strong>{{ currentTimezone }}</strong></p>
      
      <div class="timezone-dropdown">
        <label for="timezoneSelector">Selecciona una nueva zona horaria:</label>
        <p-dropdown 
          id="timezoneSelector"
          [options]="timezones" 
          [(ngModel)]="selectedTimezone" 
          optionLabel="label" 
          placeholder="Buscar una zona horaria..."
          [filter]="true"
          filterBy="label">
        </p-dropdown>
      </div>
      
      <div class="timezone-info">
        <p>La hora actual en esta zona horaria es: <strong>{{ currentTime }}</strong></p>
        <p *ngIf="isTimezoneChanged()">Al guardar, todas las fechas y horas se mostrarán en esta zona horaria.</p>
      </div>
      
      <div class="timezone-actions">
        <p-button 
          label="Usar zona horaria del sistema" 
          icon="pi pi-sync" 
          (onClick)="useSystemTimezone()"
          styleClass="p-button-secondary">
        </p-button>
        
        <p-button 
          label="Guardar cambios" 
          icon="pi pi-save" 
          (onClick)="saveTimezone()"
          [disabled]="!isTimezoneChanged()"
          severity="primary">
        </p-button>
      </div>
      
      <p-toast></p-toast>
    </div>
  `,
  styles: [`
    .timezone-selector {
      padding: 1.5rem;
      background: #ffffff;
      border-radius: 6px;
      margin-bottom: 0;
      box-shadow: none;
      font-family: 'Source Sans 3', sans-serif;
    }
    
    h3 {
      margin-top: 0;
      color: #333;
      font-size: 1.2rem;
      margin-bottom: 1rem;
    }
    
    p {
      margin: 0.5rem 0;
      line-height: 1.5;
    }
    
    .timezone-dropdown {
      margin: 1.5rem 0;
      width: 100%;
    }
    
    .timezone-dropdown :deep(.p-dropdown) {
      width: 100%;
    }
    
    .timezone-actions {
      display: flex;
      gap: 0.75rem;
      margin: 1.5rem 0;
      justify-content: space-between;
    }
    
    .timezone-info {
      margin-top: 1.5rem;
      font-size: 0.9rem;
      background-color: #f8f9fa;
      padding: 0.75rem;
      border-radius: 4px;
      border-left: 3px solid #0d6efd;
    }
    
    .timezone-info strong {
      color: #0d6efd;
    }
    
    @media (max-width: 480px) {
      .timezone-actions {
        flex-direction: column;
      }
      
      .timezone-actions :deep(.p-button) {
        width: 100%;
      }
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
