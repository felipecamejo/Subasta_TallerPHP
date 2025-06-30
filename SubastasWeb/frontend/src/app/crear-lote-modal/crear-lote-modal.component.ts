import { Component, EventEmitter, Output, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { LoteService } from '../../services/lote.service';
import { SubastaService } from '../../services/subasta.service';
import { subastaDto } from '../../models/subastaDto';

@Component({
  selector: 'app-crear-lote-modal',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    DropdownModule,
    CheckboxModule,
    ToastModule
  ],
  templateUrl: './crear-lote-modal.component.html',
  styleUrl: './crear-lote-modal.component.scss',
  providers: [MessageService]
})
export class CrearLoteModalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() loteCreado = new EventEmitter<void>();
  @Input() actualizarSubastas = new EventEmitter<void>(); // Input para recibir señal de actualización

  visible = false;
  form: FormGroup;
  subastas: subastaDto[] = [];
  loading = false;

  constructor(
    private fb: FormBuilder,
    private loteService: LoteService,
    private subastaService: SubastaService,
    private messageService: MessageService
  ) {
    this.form = this.fb.group({
      valorBase: [0, [Validators.required, Validators.min(0.01)]],
      pujaMinima: [0, [Validators.required, Validators.min(0.01)]],
      subasta_id: [null, Validators.required],
      umbral: [0, [Validators.required, Validators.min(0)]],
      pago: [false]
    });
  }

  ngOnInit(): void {
    this.cargarSubastas();
    
    // Suscribirse a actualizaciones de subastas
    if (this.actualizarSubastas) {
      this.actualizarSubastas.subscribe(() => {
        console.log('Recibida señal para actualizar subastas en modal de lote');
        this.cargarSubastas();
      });
    }
  }

  cargarSubastas(): void {
    this.subastaService.getSubastas().subscribe({
      next: (subastas) => {
        // Filtrar solo las subastas de la casa de remate actual
        const casaRemateId = localStorage.getItem('casa_remate_id');
        if (casaRemateId) {
          this.subastas = subastas.filter(subasta => 
            subasta.casa_remate?.usuario_id?.toString() === casaRemateId
          );
        } else {
          this.subastas = subastas;
        }
        console.log('Subastas cargadas:', this.subastas);
      },
      error: (error) => {
        console.error('Error al cargar subastas:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las subastas'
        });
      }
    });
  }

  abrir() {
    this.visible = true;
    this.form.reset({
      valorBase: 0,
      pujaMinima: 0,
      subasta_id: null,
      umbral: 0,
      pago: false
    });
    
    // Recargar subastas cada vez que se abre el modal
    this.cargarSubastas();
  }

  // Método público para actualizar subastas desde el componente padre
  actualizarListaSubastas(): void {
    console.log('Actualizando lista de subastas en modal de lote...');
    this.cargarSubastas();
  }

  cerrar() {
    this.visible = false;
    this.close.emit();
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.loading = true;
      
      const loteData = {
        valorBase: this.form.value.valorBase,
        pujaMinima: this.form.value.pujaMinima,
        subasta_id: this.form.value.subasta_id,
        umbral: this.form.value.umbral,
        pago: this.form.value.pago
      };

      console.log('Datos del lote a enviar:', loteData);

      this.loteService.crearLote(loteData).subscribe({
        next: (response: any) => {
          console.log('Lote creado exitosamente:', response);
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Lote creado correctamente'
          });
          this.loteCreado.emit(); // Emitir evento para notificar al padre
          this.cerrar();
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Error al crear lote:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Error al crear el lote'
          });
          this.loading = false;
        }
      });
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });
    }
  }
}
