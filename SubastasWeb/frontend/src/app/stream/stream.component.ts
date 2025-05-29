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
  
  subasta!: subastaDto;
  timerActivo: boolean = false;

  boton: boolean = false;

  private intervalId: any;

  constructor( 
    private route: ActivatedRoute,
    private subastaService: SubastaService ,
  ){}

  ngOnInit(): void {
    console.log('ngOnInit ejecutado');
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.subastaService.getSubasta(id).subscribe(data => {
      console.log('Subasta obtenida:', data);
      this.subasta = data;
      
      if (this.subasta.activa) {
        console.log('Subasta ya activa, iniciando timer');
        this.boton = true;
        this.iniciarTimer();
      }
    });
  }

  timer: string = "00:00:00";

  iniciarSubasta() {
    console.log('iniciarSubasta ejecutado');
    if (!this.subasta || !this.subasta.fecha || this.subasta.activa) return;

    this.boton = true;
    this.subasta.activa = true;

    this.subastaService.updateSubasta(this.subasta).subscribe({
      next: () => {
        console.log('Subasta actualizada en backend, iniciando timer');
        this.iniciarTimer(); 
      },
      error: (err) => {
        console.error('Error al actualizar la subasta:', err);
      }
    });
  }

  iniciarTimer() {
  if (!this.boton || this.timerActivo) {
    console.log('Timer ya activo o botón no presionado, no inicio timer');
    return;
  }

  this.timerActivo = true;
  console.log('Timer iniciado');

  const fechaSubasta = new Date(this.subasta.fecha).getTime();

  this.intervalId = setInterval(() => {
    const ahora = Date.now();
    let diferencia = Math.floor((fechaSubasta - ahora) / 1000);

    if (diferencia <= 0) {
      this.timer = '¡Subasta iniciada!';
      this.timerActivo = false;
      clearInterval(this.intervalId);
      console.log('Timer finalizado y limpiado');
      return;
    }

    const horas = Math.floor(diferencia / 3600);
    const minutos = Math.floor((diferencia % 3600) / 60);
    const segundos = diferencia % 60;

    this.timer = 
      `${horas.toString().padStart(2, '0')}:` + 
      `${minutos.toString().padStart(2, '0')}:` + 
      `${segundos.toString().padStart(2, '0')}`;
  }, 1000);
}

 ngOnDestroy() {
  if (this.intervalId) {
    clearInterval(this.intervalId);
    console.log('Interval limpiado en ngOnDestroy');
  }
}
  
}
