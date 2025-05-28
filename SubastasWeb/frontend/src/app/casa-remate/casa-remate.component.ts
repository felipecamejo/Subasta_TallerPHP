import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { RatingModule } from 'primeng/rating';
import { ReactiveFormsModule } from '@angular/forms';
import { FormGroup, FormControl } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { DialogModule } from 'primeng/dialog';


@Component({
  selector: 'app-casa-remate',
  imports: [DialogModule, InputGroupModule, InputGroupAddonModule, FormsModule, CommonModule, ButtonModule, RatingModule, ReactiveFormsModule, TableModule],
  templateUrl: './casa-remate.component.html',
  styleUrl: './casa-remate.component.scss'
})
export class CasaRemateComponent {
  estrellas = new FormGroup({
    value: new FormControl(2)  
  });

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
