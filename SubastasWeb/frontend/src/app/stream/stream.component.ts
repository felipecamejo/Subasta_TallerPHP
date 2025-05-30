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
import { LoteService } from '../../services/lote.service'
import { loteDto } from '../../models/loteDto';
import { PujaService } from '../../services/puja.service'
import { pujaDto } from '../../models/pujaDto';


@Component({
  selector: 'app-stream',
  standalone: true,
  imports: [CommonModule, InputTextModule, FormsModule, ButtonModule],
  templateUrl: './stream.component.html',
  styleUrls: ['./stream.component.scss']
})
export class StreamComponent implements OnInit, OnDestroy{

  subasta!: subastaDto;
  lotes! : loteDto[];
  pujas! : pujaDto[];

  indexLotes: number = 0;

  anteriorLote() {
    if(this.lotes && this.indexLotes > 0){
      this.indexLotes--;
      this.cargarPujas(this.lotes[this.indexLotes]);
    } 
  }

  siguienteLote() {
    if(this.lotes && this.indexLotes < this.lotes.length-1){
      this.indexLotes++;
      this.cargarPujas(this.lotes[this.indexLotes]);
    }
  }

  // -------------------------------------timer-------------------------------------------------------
  
  timer: string = "00:00:00";
  private timerSubscription?: Subscription;
  private subastaSubscription?: Subscription;
  timerActivo: boolean = false;
  boton: boolean = false;

  pujaActual: number = 0;
  pujaRapida: number = 0;
  pujaComun: number = 0;

  constructor(
    private route: ActivatedRoute,
    private subastaService: SubastaService,
    private loteService: LoteService,
    private pujaService: PujaService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    
    this.subastaSubscription?.unsubscribe();

    this.subastaSubscription = this.subastaService.getSubasta(id).subscribe({
      next: (data) => {
        this.subasta = data;
        this.boton = this.subasta.activa;

        this.loteService.getLotesSubasta(this.subasta.id).subscribe({
          next: (data) => {
            this.lotes = data;

            this.cargarPujas(this.lotes[this.indexLotes]);
            
          },
          error: (err) => {
            console.error('Error al obtener los lotes:', err);
          }

        });
        
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

    this.timerActivo = true;

    this.timerSubscription = interval(1000).pipe(
      takeWhile(() => this.timerActivo)
    ).subscribe(() => {
      const ahora = Date.now();
      
      if (ahora < fechaInicio) {
        const diff = Math.floor((fechaInicio - ahora) / 1000);
        this.timer = this.formatearTiempo(diff);
      } else if (ahora <= fechaFin) {
        const diff = Math.floor((fechaFin - ahora) / 1000);
        this.timer = this.formatearTiempo(diff);
      } else {
        this.timer = 'Finalizada';
        this.detenerTimer();
      }
    });
  }

  detenerTimer(): void {
    this.timerActivo = false;
    this.timerSubscription?.unsubscribe();
    this.timerSubscription = undefined;
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
    this.detenerTimer();
    this.subastaSubscription?.unsubscribe();
  }

  //-------------------------------------------pujas--------------------------------------

  cargarPujas(lote : loteDto){
    this.pujaService.getPujaslote(lote.id).subscribe({
      next: (data) => {
        this.pujas = data; 

        this.pujaActual = 0;

        if(this.pujas) {
          for(let puja of this.pujas){
            if (puja.monto > this.pujaActual){
              this.pujaActual = puja.monto;
            }
          }
        }
        
        if( this.pujaActual == 0 ){
          this.pujaRapida = lote.pujaMinima;
        }else{
          this.pujaRapida = Math.round(Number(this.pujaActual) * 0.40 + Number(this.pujaActual));
        }
                
      },
      error: (err) => {
         console.error('Error al obtener las pujas:', err);
      }
    });
  }

  crearPujaRapida() {

    const puja = {
      fechaHora: new Date().toISOString(),
      montoTotal: Number(this.pujaRapida),
      cliente_id: null,
      lote_id: Number(this.lotes[this.indexLotes].id)
    }

    console.log(puja);

     this.pujaService.crearPuja(puja).subscribe({
      next: (data) => {
          this.cargarPujas(this.lotes[this.indexLotes]);
      },
      error: (err) => {
         console.error('Error al obtener las pujas:', err);
     }
    });

  }

  crearPujaComun(){

    const puja = {
      fechaHora: new Date().toISOString(),
      montoTotal: Number(this.pujaComun),
      cliente_id: null,
      lote_id: Number(this.lotes[this.indexLotes].id)
    }

    console.log(puja);

    this.pujaService.crearPuja(puja).subscribe({
      next: (data) => {
          this.cargarPujas(this.lotes[this.indexLotes]);
      },
      error: (err) => {
         console.error('Error al obtener las pujas:', err);
     }
    });
  }
}

  

