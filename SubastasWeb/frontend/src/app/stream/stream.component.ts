import { Component } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { FooterComponent } from '../footer/footer.component';
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
  timer: string = '0:00';
  private countdownSub!: Subscription;
  private remainingSeconds!: number;

  subasta!: subastaDto;
  timerActivo: boolean = false;

  boton: boolean = false;

  constructor( 
    private route: ActivatedRoute,
    private subastaService: SubastaService 
  ){}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.subastaService.getSubasta(id).subscribe(data => {
      this.subasta = data;

      if (this.subasta.activa) {
        this.startTimer();
      } else {
        this.timer = '0:00';
      }
    });
  }

  iniciarBoton() {
    this.subasta.activa = true;
    this.startTimer();

    this.subastaService.updateSubasta(this.subasta).subscribe(() => {
      this.boton = true;
      this.startTimer();
    });
  }

  startTimer() {
    const inicio = new Date(this.subasta.fecha).getTime();
    const ahora = Date.now();
    const transcurrido = Math.floor((ahora - inicio) / 1000); 

    this.remainingSeconds = this.subasta.duracionSegundos - transcurrido;

    if (!this.subasta.activa) {
      this.timer = '0:00';
      this.timerActivo = false;
      return;
    }

    this.timerActivo = true;
    this.updateTimerDisplay();

    this.countdownSub = interval(1000).subscribe(() => {
      this.remainingSeconds--;

      if (this.remainingSeconds <= 0) {
        this.timerActivo = false;
        this.timer = '0:00';
        this.countdownSub.unsubscribe();
        this.subastaService.updateSubasta(this.subasta);
      } else {
        this.updateTimerDisplay();
      }
    });
  }

  updateTimerDisplay() {
    const segundosTotales = Math.max(this.remainingSeconds, 0);
    const minutos = Math.floor(segundosTotales / 60);
    const segundos = segundosTotales % 60;
    this.timer = `${minutos}:${segundos.toString().padStart(2, '0')}`;
  }

  ngOnDestroy() {
    if (this.countdownSub) {
      this.countdownSub.unsubscribe();
    }
  }
}
