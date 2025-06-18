import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { RatingModule } from 'primeng/rating';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { FormGroup, FormControl } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { DialogModule } from 'primeng/dialog';
import { CasaRematesService } from '../../services/casa-remates.service';
import { casaRemateDto } from '../../models/casaRemateDto';
import { MessageService } from 'primeng/api';



@Component({
  selector: 'app-casa-remate',
  standalone: true,
  imports: [DialogModule, InputGroupModule, InputGroupAddonModule, FormsModule, CommonModule, ButtonModule, RatingModule, ReactiveFormsModule, TableModule],
  templateUrl: './casa-remate.component.html',
  styleUrl: './casa-remate.component.scss',
  providers: [MessageService]
})
export class CasaRemateComponent {

  // ACA PUEDO DECLARAR LAS VARIABLES QUE NECESITO PARA EL COMPONENTE
  modoEdicion: boolean = false; // bandera para saber si estoy editando
  listaCasaRemates: casaRemateDto[] = [];
  promedioCalificacion: number = 0;
  estrellas: FormGroup;
  model: casaRemateDto = {
    id: null,
    nombre: '',
    idFiscal: '',
    email: '',
    telefono: '',
    latitud: 0,
    longitud: 0,
    rematadores: [],
    subastas: [],
    valoracion: null
  };
  title: string = 'Casa de Remates';

  constructor(
    private _service: CasaRematesService,
    private messageService: MessageService,
    private fb: FormBuilder
  ) {
    // Creá el form aquí, con value 0 inicialmente
    this.estrellas = this.fb.group({
      value: [0]
    });
  }

  ngOnInit(): void {
    // Si estás editando, por ejemplo desde un route con ID:
    this.getCasaRemate();
    console.log("Casa de remate cargada:", this.model);
  }
  
  getCasaRemate() {
    this._service.getCasaRematesPorId(1).subscribe({
      next: (data: any) => {
        this.model = data;
        // calculá el promedio luego de asignar los datos
        this.promedioCalificacion = this.obtenerPromedioValoracion();

        // actualizá el form control
        this.estrellas.patchValue({ value: this.promedioCalificacion });
      },
      error: (response: any) => {
        //this._alertService.showError(`Error al obtener ${this.title}, ${response.message}`);
      }
    });
  }

  guardar(): void {
    if (this.modoEdicion) {
      this._service.putActualizarCasaRemates(this.model).subscribe(() => {
        this.messageService.add({severity:'success', summary:'Éxito', detail:'Casa de remate actualizada'});
      });
    } else {
      this._service.postCrearCasaRemates(this.model).subscribe(() => {
        this.messageService.add({severity:'success', summary:'Éxito', detail:'Casa de remate creada'});
      });
    }
  }

  obtenerPromedioValoracion(): number {
    if (!this.model.valoracion || this.model.valoracion.cantidad_opiniones === 0) {
      return 0;
    }
    const promedio = this.model.valoracion.valoracion_total / this.model.valoracion.cantidad_opiniones;
    return Math.round(promedio);
  }

  // Método auxiliar para calcular promedio de un array de números (por si se necesita en el futuro)
  obtenerPromedio(calificaciones: number[]): number {
    if (calificaciones.length === 0) {
      return 0; 
    }
    const suma = calificaciones.reduce((a, b) => a + b, 0);
    return suma / calificaciones.length;
  }

  

  totalRecords: number = 0;

  modalSubasta : boolean = false;
  modalArticulo: boolean = false;

  lalala : any = [
    {
      nombre: "holi",
      especificacion: "laburante",
      disponibilidad: true,
      condicion: "Impeclable",
      nombreVendedor: "Roberto"
    },
    {
      nombre: "chau",
      especificacion: "vago",
      disponibilidad: false,
      condicion: "Roto",
      nombreVendedor: "Salvador"
    }
  ];

  mostrarArticulo() {
    this.modalArticulo = true;
  }

  mostrarSubasta() {
    this.modalSubasta = true;
  }

  saveSubasta() {

  }

  saveArticulo(){

  }

}
