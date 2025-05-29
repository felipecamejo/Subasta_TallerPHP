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

  constructor( 
    private route: ActivatedRoute,
    private subastaService: SubastaService 
  ){}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    console.log('ID from route:', id);
    this.subastaService.getSubasta(id).subscribe(data => {
      this.subasta = data;
      
      this.remainingSeconds = this.subasta.duracionSegundos;

      this.timerActivo = this.subasta.activa;

      if (this.timerActivo && this.remainingSeconds > 0) {
        this.startTimer();
      } else {
        this.updateTimerDisplay()
      }
    });
  }

  startTimer() {
    this.countdownSub = interval(1000).subscribe(() => {
      if (this.remainingSeconds > 0 && this.timerActivo) {
        this.remainingSeconds--;
        this.updateTimerDisplay();
      } else {
        this.timerActivo = false;
        this.updateTimerDisplay();
        this.countdownSub.unsubscribe();
      }
    });
  }

  updateTimerDisplay() {
    const minutos = Math.floor(this.remainingSeconds / 60);
    const segundos = this.remainingSeconds % 60;
    this.timer = `${minutos}:${segundos.toString().padStart(2, '0')}`;
  }

  ngOnDestroy() {
    if (this.countdownSub) {
      this.countdownSub.unsubscribe();
    }
  }
}
