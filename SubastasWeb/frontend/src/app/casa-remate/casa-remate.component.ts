import { Component, ViewChild } from '@angular/core';
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
import { CrearArticuloModalComponent } from '../crear-articulo-modal/crear-articulo-modal.component';
import { CrearSubastaModalComponent } from '../crear-subasta-modal/crear-subasta-modal.component';


@Component({
  selector: 'app-casa-remate',
  standalone: true,
  imports: [DialogModule, InputGroupModule, InputGroupAddonModule, FormsModule, CommonModule, ButtonModule, RatingModule, ReactiveFormsModule, TableModule, CrearArticuloModalComponent, CrearSubastaModalComponent],
  templateUrl: './casa-remate.component.html',
  styleUrl: './casa-remate.component.scss',
  providers: [MessageService]
})
export class CasaRemateComponent {
  // Referencia al modal
  @ViewChild(CrearArticuloModalComponent) crearArticuloModal!: CrearArticuloModalComponent;
  @ViewChild(CrearSubastaModalComponent) crearSubastaModal!: CrearSubastaModalComponent;
  // ACA PUEDO DECLARAR LAS VARIABLES QUE NECESITO PARA EL COMPONENTE
  modoEdicion: boolean = false; // bandera para saber si estoy editando
  listaCasaRemates: casaRemateDto[] = [];
  modalCrearArticulo: boolean = false;
  modalCrearSubasta: boolean = false;
  model: casaRemateDto = {
    usuario_id: null,
    usuario: null,
    idFiscal: '',
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
    
  }

  ngOnInit(): void {
    // Si estás editando, por ejemplo desde un route con ID:
    this.getCasaRemate();
    console.log("Casa de remate cargada:", this.model);
  }
  
  getCasaRemate() {
    this._service.getCasaRematesPorId(2).subscribe({
      next: (data: any) => {
        this.model = data;
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
  
  abrirModalArticulo() {
    this.crearArticuloModal.abrir();
  }
  cerrarModalArticulo() {
    this.modalCrearArticulo = false;
  }

  abrirModalSubasta() {
    this.crearSubastaModal.abrir();
  }
  cerrarModalSubasta() {
    this.modalCrearSubasta = false;
  }


  totalRecords: number = 0;

  modalSubasta : boolean = false;
  modalArticulo: boolean = false;


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
