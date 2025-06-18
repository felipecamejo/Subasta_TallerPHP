import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { RatingModule } from 'primeng/rating';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { FormGroup } from '@angular/forms';
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
  imports: [
    DialogModule,
    InputGroupModule,
    InputGroupAddonModule,
    FormsModule,
    CommonModule,
    ButtonModule,
    RatingModule,
    ReactiveFormsModule,
    TableModule
  ],
  templateUrl: './casa-remate.component.html',
  styleUrl: './casa-remate.component.scss',
  providers: [MessageService]
})
export class CasaRemateComponent {
  modoEdicion: boolean = false;
  listaCasaRemates: casaRemateDto[] = [];
  promedioCalificacion: number = 0;
  estrellas: FormGroup;

  model: casaRemateDto = {
    usuario_id: 0,
    idFiscal: '',
    calificacion: 0,
    calificaciones: [],
    usuario: {
      id: 0,
      nombre: '',
      email: '',
      imagen: '',
      telefono: '',
      cedula: '',
      contrasenia: '',
      latitud: 0,
      longitud: 0,
      rematador: { usuario: {} as any },
      cliente: { usuario: {} as any },
      casaremate: { usuario: {} as any }
    },
    vendedor: undefined,
    rematadores: [],
    subastas: []
  };

  title: string = 'Casa de Remates';

  constructor(
    private _service: CasaRematesService,
    private messageService: MessageService,
    private fb: FormBuilder
  ) {
    this.estrellas = this.fb.group({
      value: [0]
    });
  }

  ngOnInit(): void {
    this.getCasaRemate();
    console.log('Casa de remate cargada:', this.model);
  }

  getCasaRemate() {
    this._service.getCasaRematesPorId(1).subscribe({
      next: (data: casaRemateDto) => {
        this.model = data;
        this.promedioCalificacion = this.model.calificacion;
        this.estrellas.patchValue({ value: this.promedioCalificacion });
      },
      error: (response: any) => {
        // error opcional
      }
    });
  }

  guardar(): void {
    if (this.modoEdicion) {
      this._service.putActualizarCasaRemates(this.model).subscribe(() => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Casa de remate actualizada' });
      });
    } else {
      this._service.postCrearCasaRemates(this.model).subscribe(() => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Casa de remate creada' });
      });
    }
  }

  totalRecords: number = 0;
  modalSubasta: boolean = false;
  modalArticulo: boolean = false;

  lalala: any = [
    {
      nombre: 'holi',
      especificacion: 'laburante',
      disponibilidad: true,
      condicion: 'Impeclable',
      nombreVendedor: 'Roberto'
    },
    {
      nombre: 'chau',
      especificacion: 'vago',
      disponibilidad: false,
      condicion: 'Roto',
      nombreVendedor: 'Salvador'
    }
  ];

  mostrarArticulo() {
    this.modalArticulo = true;
  }

  mostrarSubasta() {
    this.modalSubasta = true;
  }

  saveSubasta() {}

  saveArticulo() {}
}
