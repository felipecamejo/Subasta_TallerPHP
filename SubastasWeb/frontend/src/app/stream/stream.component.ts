import { Component, OnDestroy } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SubastaService } from '../../services/subasta.service';
import { subastaDto } from '../../models/subastaDto';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OnInit } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { takeWhile } from 'rxjs/operators'; 
import { loteDto } from '../../models/loteDto';
import { PujaService } from '../../services/puja.service'
import { pujaDto } from '../../models/pujaDto';


interface PujaRequest {
  fechaHora: string;
  montoTotal: number;
  cliente_id: number | null;
  lote_id: number;
}

interface TimerState {
  timer: string;
  timerActivo: boolean;
  timerSubscription?: Subscription;
}

const TIMER_CONSTANTS = {
  INTERVAL_MS: 1000,
  SECONDS_PER_MINUTE: 60,
  MINUTES_PER_HOUR: 60,
  SECONDS_PER_HOUR: 3600,
  FINISHED_MESSAGE: 'Finalizada'
} as const;

@Component({
  selector: 'app-stream',
  standalone: true,
  imports: [CommonModule, InputTextModule, FormsModule, ButtonModule],
  templateUrl: './stream.component.html',
  styleUrls: ['./stream.component.scss']
})
export class StreamComponent implements OnInit, OnDestroy {

  subasta: subastaDto | null = null;
  lotes: loteDto[] = [];
  pujas: pujaDto[] = [];
  
  indexLotes: number = 0;
  
  private timerState: TimerState = {
    timer: "00:00:00",
    timerActivo: false
  };
  
  private subastaSubscription?: Subscription;
  boton: boolean = false;

  pujaActual: number = 0;
  pujaRapida: number | null = null;
  pujaComun: number | null = null;

  get timer(): string {
    return this.timerState.timer;
  }

  get timerActivo(): boolean {
    return this.timerState.timerActivo;
  }

  constructor(
    private route: ActivatedRoute,
    private subastaService: SubastaService,
    private pujaService: PujaService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    
    if (!id || isNaN(id)) {
      console.error('ID de subasta inválido');
      return;
    }

    this.subastaSubscription?.unsubscribe();

    this.subastaSubscription = this.subastaService.getSubasta(id).subscribe({
      next: (data) => {
        this.subasta = data;
        this.boton = this.subasta.activa;

        this.lotes = (this.subasta.lotes || []).map(lote => ({
          ...lote,
          subasta: {
            id: this.subasta!.id,
            fecha: this.subasta!.fecha,
            duracionMinutos: this.subasta!.duracionMinutos,
            nombre: this.subasta!.nombre
          }
        }));

        this.pujas = (this.lotes[this.indexLotes]?.pujas as pujaDto[]) || [];
        
        if (this.subasta.activa) {
          this.iniciarTimer();
        }
      },
      error: (err) => {
        console.error('Error al cargar subasta:', err);
      }
    });
  }

  iniciarSubasta() {
    if (!this.subasta || !this.subasta.fecha || this.subasta.activa) return;

    this.boton = true;
    this.subasta.activa = true;

    this.subastaService.updateSubasta(this.subasta).subscribe(() => {
      setTimeout(() => {
        this.iniciarTimer();
      }, 0);
    });
  }

  iniciarTimer() {
    this.detenerTimer();

    if (!this.subasta?.fecha) return;

    const fechaInicio = new Date(this.subasta.fecha).getTime();
    const duracionMs = this.subasta.duracionMinutos * 60 * 1000;
    const fechaFin = fechaInicio + duracionMs;

    this.timerState.timerActivo = true;

    this.timerState.timerSubscription = interval(TIMER_CONSTANTS.INTERVAL_MS).pipe(
      takeWhile(() => this.timerState.timerActivo)
    ).subscribe(() => {
      const ahora = Date.now();
      
      if (ahora < fechaInicio) {
        const diff = Math.floor((fechaInicio - ahora) / TIMER_CONSTANTS.INTERVAL_MS);
        this.timerState.timer = this.formatearTiempo(diff);
      } else if (ahora <= fechaFin) {
        const diff = Math.floor((fechaFin - ahora) / TIMER_CONSTANTS.INTERVAL_MS);
        this.timerState.timer = this.formatearTiempo(diff);
      } else {
        this.timerState.timer = TIMER_CONSTANTS.FINISHED_MESSAGE;
        this.detenerTimer();
      }
    });
  }

  detenerTimer(): void {
    this.timerState.timerActivo = false;
    this.timerState.timerSubscription?.unsubscribe();
    this.timerState.timerSubscription = undefined;
  }

  formatearTiempo(segundos: number): string {
    const horas = Math.floor(segundos / TIMER_CONSTANTS.SECONDS_PER_HOUR);
    const minutos = Math.floor((segundos % TIMER_CONSTANTS.SECONDS_PER_HOUR) / TIMER_CONSTANTS.SECONDS_PER_MINUTE);
    const seg = segundos % TIMER_CONSTANTS.SECONDS_PER_MINUTE;
    return `${horas.toString().padStart(2, '0')}:` +
          `${minutos.toString().padStart(2, '0')}:` +
          `${seg.toString().padStart(2, '0')}`;
  }

  ngOnDestroy(): void {
    this.detenerTimer();
    this.subastaSubscription?.unsubscribe();
  }

  //-------------------------------------------pujas--------------------------------------

  private validarPuja(monto: number | null): { valida: boolean; error?: string } {
    if (!monto || monto <= 0) {
      return { valida: false, error: 'El monto debe ser mayor a 0' };
    }

    const loteActual = this.lotes[this.indexLotes];
    if (!loteActual) {
      return { valida: false, error: 'No hay lote seleccionado' };
    }

    if (monto < loteActual.pujaMinima) {
      return { valida: false, error: `El monto debe ser mayor a ${loteActual.pujaMinima}` };
    }

    return { valida: true };
  }

  private crearPujaBase(monto: number): PujaRequest {
    return {
      fechaHora: new Date().toISOString(),
      montoTotal: monto,
      cliente_id: null,
      lote_id: Number(this.lotes[this.indexLotes].id)
    };
  }

  crearPujaRapida(): void {
    const validacion = this.validarPuja(this.pujaRapida);
    
    if (!validacion.valida) {
      console.error('Error de validación:', validacion.error);
      return;
    }

    const puja = this.crearPujaBase(this.pujaRapida!);
    this.enviarPuja(puja);
  }

  crearPujaComun(): void {
    const validacion = this.validarPuja(this.pujaComun);
    
    if (!validacion.valida) {
      console.error('Error de validación:', validacion.error);
      return;
    }

    const puja = this.crearPujaBase(this.pujaComun!);
    this.enviarPuja(puja);
  }

  private enviarPuja(puja: PujaRequest): void {
    console.log('Enviando puja:', puja);

    this.pujaService.crearPuja(puja).subscribe({
      next: (data) => {
        console.log('Puja creada exitosamente:', data);
        this.actualizarDatos();
        this.limpiarCamposPuja();
      },
      error: (err) => {
        console.error('Error al crear la puja:', err);
      }
    });
  }

  private actualizarDatos(): void {
    // En lugar de llamar ngOnInit(), es mejor actualizar solo los datos necesarios
    const id = Number(this.route.snapshot.paramMap.get('id'));
    
    this.subastaService.getSubasta(id).subscribe({
      next: (data) => {
        this.subasta = data;
        this.lotes = (this.subasta.lotes || []).map(lote => ({
          ...lote,
          subasta: {
            id: this.subasta!.id,
            fecha: this.subasta!.fecha,
            duracionMinutos: this.subasta!.duracionMinutos,
            nombre: this.subasta!.nombre
          }
        }));
        this.pujas = (this.lotes[this.indexLotes]?.pujas as pujaDto[]) || [];
      },
      error: (err) => {
        console.error('Error al actualizar datos:', err);
      }
    });
  }

  private limpiarCamposPuja(): void {
    this.pujaRapida = null;
    this.pujaComun = null;
  }
}



