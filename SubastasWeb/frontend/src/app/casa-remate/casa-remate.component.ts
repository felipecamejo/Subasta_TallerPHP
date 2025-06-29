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
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { CasaRematesService } from '../../services/casa-remates.service';
import { SubastaService } from '../../services/subasta.service';
import { LoteService } from '../../services/lote.service';
import { casaRemateDto } from '../../models/casaRemateDto';
import { subastaDto } from '../../models/subastaDto';
import { loteDto } from '../../models/loteDto';
import { MessageService } from 'primeng/api';
import { CrearArticuloModalComponent } from '../crear-articulo-modal/crear-articulo-modal.component';
import { CrearSubastaModalComponent } from '../crear-subasta-modal/crear-subasta-modal.component';
import { CasaRemateEditarModalComponent } from '../casa-remate-editar-modal/casa-remate-editar-modal.component';
import { CrearLoteModalComponent } from '../crear-lote-modal/crear-lote-modal.component';


@Component({
  selector: 'app-casa-remate',
  standalone: true,
  imports: [DialogModule, InputGroupModule, InputGroupAddonModule, FormsModule, CommonModule, ButtonModule, RatingModule, ReactiveFormsModule, TableModule, ToastModule, TooltipModule, CrearArticuloModalComponent, CrearSubastaModalComponent, CasaRemateEditarModalComponent, CrearLoteModalComponent],
  templateUrl: './casa-remate.component.html',
  styleUrl: './casa-remate.component.scss',
  providers: [MessageService]
})
export class CasaRemateComponent {
  // Referencias a los modales
  @ViewChild(CrearArticuloModalComponent) crearArticuloModal!: CrearArticuloModalComponent;
  @ViewChild(CrearSubastaModalComponent) crearSubastaModal!: CrearSubastaModalComponent;
  @ViewChild(CasaRemateEditarModalComponent) casaRemateEditarModal!: CasaRemateEditarModalComponent;
  @ViewChild(CrearLoteModalComponent) crearLoteModal!: CrearLoteModalComponent;
  // ACA PUEDO DECLARAR LAS VARIABLES QUE NECESITO PARA EL COMPONENTE
  modoEdicion: boolean = false; // bandera para saber si estoy editando
  listaCasaRemates: casaRemateDto[] = [];
  modalCrearArticulo: boolean = false;
  modalCrearSubasta: boolean = false;
  
  // Nuevas propiedades para subastas y lotes
  subastas: subastaDto[] = [];
  lotes: loteDto[] = [];
  cargandoDatos: boolean = false;
  
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
    private subastaService: SubastaService,
    private loteService: LoteService,
    private messageService: MessageService,
    private fb: FormBuilder
  ) {
    
  }

  ngOnInit(): void {
    // Si estás editando, por ejemplo desde un route con ID:
    this.getCasaRemate();
    this.cargarDatos();
    console.log("Casa de remate cargada:", this.model);
  }

  cargarDatos(): void {
    // Primero cargar subastas, luego lotes
    this.cargandoDatos = true;
    this.cargarSubastas();
  }

  refrescarDatos(): void {
    // Método para refrescar todos los datos
    this.cargandoDatos = true;
    this.cargarDatos();
    this.messageService.add({
      severity: 'info',
      summary: 'Actualizando',
      detail: 'Actualizando datos...'
    });
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
    // Opcional: si los artículos afectan los lotes, recargar datos
    this.messageService.add({
      severity: 'info',
      summary: 'Modal cerrado',
      detail: 'Modal de artículos cerrado'
    });
  }

  abrirModalSubasta() {
    this.crearSubastaModal.abrir();
  }
  
  cerrarModalSubasta() {
    this.modalCrearSubasta = false;
    // Recargar las subastas tras cerrar el modal
    this.cargarSubastas();
    this.messageService.add({
      severity: 'success',
      summary: 'Actualizado',
      detail: 'Lista de subastas actualizada'
    });
  }

  abrirModalLote() {
    this.crearLoteModal.abrir();
  }
  
  cerrarModalLote() {
    // Recargar los lotes tras cerrar el modal
    this.cargarLotes();
    this.messageService.add({
      severity: 'success',
      summary: 'Actualizado',
      detail: 'Lista de lotes actualizada'
    });
  }

  abrirModalEditarCasaRemate() {
    // Pasar los datos actuales al modal
    this.casaRemateEditarModal.casaRemateData = this.model;
    this.casaRemateEditarModal.abrir();
  }

  onCasaRemateEditSave(casaRemateData: any) {
    console.log('Datos recibidos del modal:', casaRemateData);
    
    // Obtener el usuario_id del localStorage
    const usuarioId = localStorage.getItem('usuario_id');
    console.log('Usuario ID del localStorage:', usuarioId);
    
    if (!usuarioId) {
      this.messageService.add({
        severity: 'error', 
        summary: 'Error', 
        detail: 'No se encontró el ID del usuario en el localStorage'
      });
      return;
    }

    // Preparar los datos para enviar al backend
    const dataToSend = {
      nombre: casaRemateData.nombre,
      email: casaRemateData.email,
      telefono: casaRemateData.telefono,
      imagen: casaRemateData.imagen,
      latitud: casaRemateData.latitud,
      longitud: casaRemateData.longitud,
      idFiscal: casaRemateData.idFiscal
    };

    console.log('Datos a enviar al backend:', dataToSend);
    console.log('URL de la petición:', `/api/casa-remates/${usuarioId}`);

    // Enviar al backend usando la nueva ruta
    this._service.putActualizarCasaRematesPorUsuario(parseInt(usuarioId), dataToSend).subscribe({
      next: (response) => {
        console.log('Respuesta del servidor:', response);
        this.messageService.add({
          severity: 'success', 
          summary: 'Éxito', 
          detail: 'Casa de remate actualizada correctamente'
        });
        
        // Actualizar el modelo local con la respuesta del servidor
        this.model = response;
        
        // Opcional: Recargar los datos desde el servidor
        // this.getCasaRemate();
      },
      error: (error) => {
        console.error('Error completo:', error);
        this.messageService.add({
          severity: 'error', 
          summary: 'Error', 
          detail: `Error al actualizar la casa de remate: ${error.message || 'Error desconocido'}`
        });
      }
    });
  }

  cerrarModalEditarCasaRemate() {
    // Método para cerrar el modal si es necesario
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

  cargarSubastas(): void {
    this.subastaService.getSubastas().subscribe({
      next: (subastas) => {
        // Filtrar solo las subastas de esta casa de remate
        const casaRemateId = this.model.usuario_id || 2; // usar el ID de la casa actual
        this.subastas = subastas.filter(subasta => {
          // Usar la estructura correcta del DTO
          return subasta.casa_remate?.usuario_id === casaRemateId;
        });
        
        console.log('Casa Remate ID:', casaRemateId);
        console.log('Todas las subastas:', subastas);
        console.log('Subastas filtradas:', this.subastas);
        
        // Una vez cargadas las subastas, cargar los lotes
        this.cargarLotes();
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

  cargarLotes(): void {
    this.loteService.getLotes().subscribe({
      next: (lotes) => {
        // Primero filtrar los lotes que tienen subasta
        const lotesConSubasta = lotes.filter(lote => lote.subasta?.id);
        
        // Luego filtrar por las subastas que pertenecen a esta casa de remate
        const idsSubastasDeEstaCasa = this.subastas.map(subasta => subasta.id);
        this.lotes = lotesConSubasta.filter(lote => 
          idsSubastasDeEstaCasa.includes(lote.subasta?.id || 0)
        );
        
        console.log('Lotes cargados:', this.lotes);
        this.cargandoDatos = false; // Datos cargados completamente
        
        this.messageService.add({
          severity: 'success',
          summary: 'Completado',
          detail: `Se cargaron ${this.subastas.length} subastas y ${this.lotes.length} lotes`
        });
      },
      error: (error) => {
        console.error('Error al cargar lotes:', error);
        this.cargandoDatos = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los lotes'
        });
      }
    });
  }

}
