import { Component } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SubastaService } from '../../services/subasta.service';
import { subastaDto } from '../../models/subastaDto';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OnInit } from '@angular/core';
import { interval, Subscription } from 'rxjs';


@Component({
  selector: 'app-stream',
  standalone: true,
  imports: [CommonModule, InputTextModule, FormsModule, ButtonModule],
  templateUrl: './stream.component.html',
  styleUrls: ['./stream.component.scss']
})
export class StreamComponent implements OnInit {
  
  subasta!: subastaDto;
  
  

  constructor( 
    private route: ActivatedRoute,
    private subastaService: SubastaService ,
  ){}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.subastaService.getSubasta(id).subscribe(data => {
      this.subasta = data;
      
      if (this.subasta.activa) {
        this.boton = true;
        this.iniciarTimer();
      }

    });
  }

  timer: string = "00:00:00";
  private timerSubscription?: Subscription;
  timerActivo: boolean = false;
  boton: boolean = false;

  iniciarSubasta() {
    if (!this.subasta || !this.subasta.fecha || this.subasta.activa) return;

    this.boton = true;
    this.subasta.activa = true;

    this.subastaService.updateSubasta(this.subasta).subscribe({
      next: () => {
        this.iniciarTimer(); 
      },
      error: (err) => {
        console.error('Error al actualizar la subasta:', err);
      }
    });
  }

  iniciarTimer() {
    if (this.timerActivo || this.timerSubscription) {
      return;
    }

    const fechaInicio = new Date(this.subasta.fecha).getTime();
    const duracionMs = this.subasta.duracionMinutos * 60 * 1000;
    const fechaFin = fechaInicio + duracionMs;

    this.timerActivo = true;

    this.timerSubscription = interval(1000).subscribe(() => {
      const ahora = Date.now();
      let nuevoTimer = '';

      if (ahora < fechaInicio) {
        let diff = Math.floor((fechaInicio - ahora) / 1000);
        nuevoTimer = this.formatearTiempo(diff);
      } else if (ahora >= fechaInicio && ahora <= fechaFin) {
        let diff = Math.floor((fechaFin - ahora) / 1000);
        nuevoTimer = this.formatearTiempo(diff);
      } else {
        nuevoTimer = 'finalizada';
        this.timerActivo = false;
        this.timerSubscription?.unsubscribe();
      }

      this.timer = nuevoTimer;
    });

    console.log('Timer iniciado correctamente');
  }

  formatearTiempo(segundos: number): string {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const seg = segundos % 60;
    return `${horas.toString().padStart(2, '0')}:` +
          `${minutos.toString().padStart(2, '0')}:` +
          `${seg.toString().padStart(2, '0')}`;
  }

  ngOnDestroy(): void {
    this.timerSubscription?.unsubscribe();
  }
}
  

