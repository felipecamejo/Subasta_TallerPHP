import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { CheckboxModule } from 'primeng/checkbox';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { estadoEnum } from '../../models/estadoEnum';
import { VendedorService } from '../../services/vendedor.service';
import { CategoriaService } from '../../services/categoria.service';
import { LoteService } from '../../services/lote.service';
import { SubastaService } from '../../services/subasta.service';
import { ArticuloService } from '../../services/articulo.service';
import { vendedorDto } from '../../models/vendedorDto';
import { categoriaDto } from '../../models/categoriaDto';
import { loteDto } from '../../models/loteDto';
import { subastaDto } from '../../models/subastaDto';

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
    CommonModule,
    ToastModule
  ],
  templateUrl: './crear-articulo-modal.component.html',
  styleUrl: './crear-articulo-modal.component.scss',
  providers: [MessageService]
})
export class CrearArticuloModalComponent implements OnInit {
  @Input() loteId!: number;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  visible: boolean = false;
  form: FormGroup;
  loading: boolean = false;

  // Datos para los dropdowns
  subastas: subastaDto[] = [];
  lotes: (Pick<loteDto, 'id' | 'valorBase' | 'pujaMinima' | 'pujas' | 'articulos' | 'umbral'| 'pago'> & { descripcionLote?: string })[] = [];
  categorias: categoriaDto[] = [];
  
  condicionesOptions = [
    { label: 'Excelente', value: estadoEnum.EXCELENTE },
    { label: 'Usado', value: estadoEnum.USADO },
  ];

  constructor(
    private fb: FormBuilder,
    private vendedorService: VendedorService,
    private categoriaService: CategoriaService,
    private loteService: LoteService,
    private subastaService: SubastaService,
    private articuloService: ArticuloService,
    private messageService: MessageService
  ) {
    this.form = this.fb.group({
      nombre: ['', Validators.required], // Nombre del artículo
      imagenes: ['', Validators.required],
      especificacion: ['', Validators.required],
      disponibilidad: [true],
      condicion: ['', Validators.required],
      vendedor_nombre: ['', Validators.required], // Campo de texto para vendedor
      categoria_nombre: ['', Validators.required], // Campo de texto para categoría  
      subasta_id: [null, Validators.required], // Dropdown para subasta
      lote_id: [null, Validators.required] // Dropdown para lote (se filtra por subasta)
    });
  }

  ngOnInit(): void {
    this.cargarSubastas();
    this.cargarCategorias();
    
    // Escuchar cambios en la subasta seleccionada para filtrar lotes
    this.form.get('subasta_id')?.valueChanges.subscribe(subastaId => {
      if (subastaId) {
        this.cargarLotesPorSubasta(subastaId);
        this.form.patchValue({ lote_id: null }); // Limpiar lote seleccionado
      }
    });
  }

  /**
   * Cargar todas las subastas disponibles
   */
  private cargarSubastas(): void {
    this.subastaService.getSubastas().subscribe({
      next: (subastas) => {
        this.subastas = subastas;
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

  /**
   * Cargar todas las categorías disponibles
   */
  private cargarCategorias(): void {
    this.categoriaService.getCategorias().subscribe({
      next: (categorias) => {
        this.categorias = categorias;
      },
      error: (error) => {
        console.error('Error al cargar categorías:', error);
        this.messageService.add({
          severity: 'error', 
          summary: 'Error', 
          detail: 'No se pudieron cargar las categorías'
        });
      }
    });
  }

  /**
   * Cargar lotes filtrados por subasta
   */
  private cargarLotesPorSubasta(subastaId: number): void {
    this.subastaService.getSubasta(subastaId).subscribe({
      next: (subasta) => {
        this.lotes = (subasta.lotes || []).map(lote => ({
          ...lote,
          descripcionLote: `Lote #${lote.id} - Base: $${lote.valorBase} - Mín: $${lote.pujaMinima}`
        }));
      },
      error: (error) => {
        console.error('Error al cargar lotes:', error);
        this.messageService.add({
          severity: 'error', 
          summary: 'Error', 
          detail: 'No se pudieron cargar los lotes'
        });
      }
    });
  }

  /**
   * Buscar o crear vendedor por nombre
   */
  private async buscarOCrearVendedor(nombre: string): Promise<number> {
    return new Promise((resolve, reject) => {
      // Primero intentar buscar vendedores existentes
      this.vendedorService.getVendedores().subscribe({
        next: (vendedores) => {
          const vendedorExistente = vendedores.find(v => 
            v.nombre.toLowerCase().trim() === nombre.toLowerCase().trim()
          );
          
          if (vendedorExistente && vendedorExistente.id) {
            resolve(vendedorExistente.id);
          } else {
            // Crear nuevo vendedor
            this.vendedorService.crearVendedor({ nombre: nombre.trim() }).subscribe({
              next: (nuevoVendedor) => {
                if (nuevoVendedor.id) {
                  this.messageService.add({
                    severity: 'success', 
                    summary: 'Vendedor creado', 
                    detail: `Vendedor "${nombre}" creado exitosamente`
                  });
                  resolve(nuevoVendedor.id);
                } else {
                  reject('Error: Vendedor creado sin ID');
                }
              },
              error: (error) => {
                console.error('Error al crear vendedor:', error);
                reject(error);
              }
            });
          }
        },
        error: (error) => {
          console.error('Error al buscar vendedores:', error);
          reject(error);
        }
      });
    });
  }

  /**
   * Buscar o crear categoría por nombre
   */
  private async buscarOCrearCategoria(nombre: string): Promise<number> {
    return new Promise((resolve, reject) => {
      // Buscar en las categorías ya cargadas
      const categoriaExistente = this.categorias.find(c => 
        c.nombre.toLowerCase().trim() === nombre.toLowerCase().trim()
      );
      
      if (categoriaExistente && categoriaExistente.id) {
        resolve(categoriaExistente.id);
      } else {
        // Crear nueva categoría
        this.categoriaService.crearCategoria({ 
          nombre: nombre.trim(),
          categoria_padre_id: null 
        }).subscribe({
          next: (nuevaCategoria) => {
            if (nuevaCategoria.id) {
              this.messageService.add({
                severity: 'success', 
                summary: 'Categoría creada', 
                detail: `Categoría "${nombre}" creada exitosamente`
              });
              // Agregar a la lista local
              this.categorias.push(nuevaCategoria);
              resolve(nuevaCategoria.id);
            } else {
              reject('Error: Categoría creada sin ID');
            }
          },
          error: (error) => {
            console.error('Error al crear categoría:', error);
            reject(error);
          }
        });
      }
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

  async onSubmit() {
    if (this.form.valid) {
      this.loading = true;
      
      try {
        const formData = this.form.value;
        
        // Buscar o crear vendedor
        const vendedorId = await this.buscarOCrearVendedor(formData.vendedor_nombre);
        
        // Buscar o crear categoría
        const categoriaId = await this.buscarOCrearCategoria(formData.categoria_nombre);
        
        // Preparar datos del artículo
        const articuloData = {
          nombre: formData.nombre,
          estado: 'activo', // Estado por defecto
          imagenes: formData.imagenes,
          especificacion: formData.especificacion,
          disponibilidad: formData.disponibilidad,
          condicion: formData.condicion,
          vendedor_id: vendedorId,
          categoria_id: categoriaId,
          lote_id: formData.lote_id
        };
        
        // Crear el artículo
        this.articuloService.crearArticulo(articuloData).subscribe({
          next: (nuevoArticulo) => {
            this.messageService.add({
              severity: 'success', 
              summary: 'Éxito', 
              detail: 'Artículo creado exitosamente'
            });
            this.save.emit(nuevoArticulo);
            this.cerrar();
          },
          error: (error) => {
            console.error('Error al crear artículo:', error);
            this.messageService.add({
              severity: 'error', 
              summary: 'Error', 
              detail: 'No se pudo crear el artículo'
            });
          },
          complete: () => {
            this.loading = false;
          }
        });
        
      } catch (error) {
        console.error('Error en el proceso de creación:', error);
        this.messageService.add({
          severity: 'error', 
          summary: 'Error', 
          detail: 'Error al procesar vendedor o categoría'
        });
        this.loading = false;
      }
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });
    }
  }
}
