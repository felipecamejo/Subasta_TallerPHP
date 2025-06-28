import { Component, EventEmitter, Output, Input } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { CheckboxModule } from 'primeng/checkbox';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-crear-articulo-modal',
  imports: [
    DialogModule,
    ReactiveFormsModule,
    InputTextModule,
    InputTextarea,
    CheckboxModule,
    DropdownModule,
    ButtonModule,
    CommonModule
  ],
  templateUrl: './crear-articulo-modal.component.html',
  styleUrl: './crear-articulo-modal.component.scss'
})
export class CrearArticuloModalComponent {
  @Input() loteId!: number;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  visible: boolean = false;
  form: FormGroup;

  condicionesOptions = [
    { label: 'Nuevo', value: 'nuevo' },
    { label: 'Usado - Excelente', value: 'usado_excelente' },
    { label: 'Usado - Bueno', value: 'usado_bueno' },
    { label: 'Usado - Regular', value: 'usado_regular' },
    { label: 'Para Reparar', value: 'para_reparar' }
  ];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      imagenes: ['', Validators.required],
      especificacion: ['', Validators.required],
      disponibilidad: [true],
      condicion: ['', Validators.required],
      vendedor_id: [null, [Validators.required, Validators.min(1)]],
      lote_id: [null, [Validators.required, Validators.min(1)]]
    });
  }

  abrir() {
    this.visible = true;
    // Pre-llenar el lote_id si está disponible
    if (this.loteId) {
      this.form.patchValue({ lote_id: this.loteId });
    }
  }

  cerrar() {
    this.visible = false;
    this.close.emit();
    this.form.reset();
  }

  onSubmit() {
    if (this.form.valid) {
      const formData = this.form.value;
      this.save.emit(formData);
      this.cerrar();
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });
    }
  }
}
