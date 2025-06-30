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
  categoriasLoading: boolean = false;

  // Datos para los dropdowns
  subastas: subastaDto[] = [];
  lotes: (Pick<loteDto, 'id' | 'valorBase' | 'pujaMinima' | 'pujas' | 'articulos' | 'umbral'| 'pago'> & { descripcionLote?: string })[] = [];
  categorias: categoriaDto[] = [];
  
  estadosOptions = [
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
      estado: ['', Validators.required], // Estado físico: EXCELENTE/USADO
      condicion: [''], // Campo opcional para detalles adicionales
      vendedor_nombre: ['', Validators.required], // Campo de texto para vendedor
      categoria_id: [null, Validators.required], // Dropdown para categoría  
      subasta_id: [null, Validators.required], // Dropdown para subasta
      lote_id: [null, Validators.required] // Dropdown para lote (se filtra por subasta)
    });
  }

  ngOnInit(): void {
    this.cargarSubastas();
    this.cargarCategorias();
    
    // Escuchar cambios en la subasta seleccionada para filtrar lotes
    this.form.get('subasta_id')?.valueChanges.subscribe(subastaId => {
      console.log('🔄 Cambio en subasta seleccionada:', subastaId);
      if (subastaId) {
        // Convertir a número si es string
        const subastaIdNum = typeof subastaId === 'string' ? parseInt(subastaId, 10) : subastaId;
        this.cargarLotesPorSubasta(subastaIdNum);
        this.form.patchValue({ lote_id: null }); // Limpiar lote seleccionado
      } else {
        this.lotes = []; // Limpiar lotes si no hay subasta seleccionada
      }
    });

    // Escuchar cambios en el lote seleccionado para debug
    this.form.get('lote_id')?.valueChanges.subscribe(loteId => {
      console.log('🎯 Cambio en lote seleccionado:', loteId, typeof loteId);
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
    console.log('🔄 Cargando categorías...');
    this.categoriasLoading = true;
    this.categoriaService.getCategorias().subscribe({
      next: (categorias) => {
        console.log('✅ Categorías cargadas:', categorias);
        this.categorias = categorias;
        this.categoriasLoading = false;
      },
      error: (error) => {
        console.error('❌ Error al cargar categorías:', error);
        this.categoriasLoading = false;
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
    console.log('📦 Cargando lotes para subasta:', subastaId);
    
    this.subastaService.getSubasta(subastaId).subscribe({
      next: (subasta) => {
        console.log('📋 Subasta obtenida:', subasta);
        
        if (subasta && subasta.lotes) {
          this.lotes = subasta.lotes.map(lote => ({
            ...lote,
            descripcionLote: `Lote #${lote.id} - Base: $${lote.valorBase} - Mín: $${lote.pujaMinima}`
          }));
          console.log('✅ Lotes cargados:', this.lotes);
        } else {
          console.log('⚠️ No se encontraron lotes para la subasta');
          this.lotes = [];
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar lotes:', error);
        this.lotes = [];
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
      console.log('🔍 Buscando vendedor:', nombre);
      
      // Primero intentar buscar vendedores existentes
      this.vendedorService.getVendedores().subscribe({
        next: (vendedores) => {
          console.log('📋 Vendedores obtenidos:', vendedores);
          
          // Validar que vendedores sea un array
          if (!Array.isArray(vendedores)) {
            console.error('❌ La respuesta de vendedores no es un array:', vendedores);
            reject('Error: Respuesta de vendedores inválida');
            return;
          }
          
          const vendedorExistente = vendedores.find(v => 
            v?.nombre && v.nombre.toLowerCase().trim() === nombre.toLowerCase().trim()
          );
          
          if (vendedorExistente && vendedorExistente.id) {
            console.log('✅ Vendedor existente encontrado:', vendedorExistente);
            resolve(vendedorExistente.id);
          } else {
            console.log('➕ Creando nuevo vendedor:', nombre);
            // Crear nuevo vendedor
            this.vendedorService.crearVendedor({ nombre: nombre.trim() }).subscribe({
              next: (nuevoVendedor) => {
                console.log('✅ Nuevo vendedor creado:', nuevoVendedor);
                if (nuevoVendedor?.id) {
                  this.messageService.add({
                    severity: 'success', 
                    summary: 'Vendedor creado', 
                    detail: `Vendedor "${nombre}" creado exitosamente`
                  });
                  resolve(nuevoVendedor.id);
                } else {
                  console.error('❌ Vendedor creado sin ID:', nuevoVendedor);
                  reject('Error: Vendedor creado sin ID');
                }
              },
              error: (error) => {
                console.error('❌ Error al crear vendedor:', error);
                reject(error);
              }
            });
          }
        },
        error: (error) => {
          console.error('❌ Error al buscar vendedores:', error);
          // Intentar crear directamente si falla la búsqueda
          console.log('⚠️ Intentando crear vendedor directamente...');
          this.vendedorService.crearVendedor({ nombre: nombre.trim() }).subscribe({
            next: (nuevoVendedor) => {
              console.log('✅ Vendedor creado tras error de búsqueda:', nuevoVendedor);
              if (nuevoVendedor?.id) {
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
            error: (createError) => {
              console.error('❌ Error al crear vendedor tras fallo de búsqueda:', createError);
              reject(createError);
            }
          });
        }
      });
    });
  }

  abrir() {
    console.log('🔓 Abriendo modal...');
    this.visible = true;
    
    // Recargar categorías cada vez que se abre el modal
    this.cargarCategorias();
    this.cargarSubastas();
    
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
    console.log('🚀 Iniciando envío del formulario...');
    console.log('📋 Valores del formulario:', this.form.value);
    console.log('🔍 Estado de validación del formulario:', this.form.valid);
    console.log('🎯 Estado específico del lote_id:', {
      value: this.form.get('lote_id')?.value,
      valid: this.form.get('lote_id')?.valid,
      errors: this.form.get('lote_id')?.errors
    });
    
    if (this.form.valid) {
      this.loading = true;
      
      try {
        const formData = this.form.value;
        
        // Validar que todos los campos requeridos estén presentes
        if (!formData.lote_id || formData.lote_id === null) {
          console.error('❌ Error: Lote no seleccionado. Valor actual:', formData.lote_id);
          this.messageService.add({
            severity: 'error', 
            summary: 'Error', 
            detail: 'Debe seleccionar un lote'
          });
          this.loading = false;
          return;
        }
        
        console.log('🔍 Buscando/creando vendedor:', formData.vendedor_nombre);
        // Buscar o crear vendedor
        const vendedorId = await this.buscarOCrearVendedor(formData.vendedor_nombre);
        console.log('✅ Vendedor ID obtenido:', vendedorId);
        
        // Usar directamente el ID de categoría seleccionado
        const categoriaId = typeof formData.categoria_id === 'string' ? 
          parseInt(formData.categoria_id, 10) : formData.categoria_id;
        
        // Convertir lote_id a número
        const loteId = typeof formData.lote_id === 'string' ? 
          parseInt(formData.lote_id, 10) : formData.lote_id;
        
        console.log('🔢 IDs convertidos - Vendedor:', vendedorId, 'Categoría:', categoriaId, 'Lote:', loteId);
        
        // Preparar datos del artículo
        const articuloData = {
          nombre: formData.nombre,
          estado: formData.estado, // Estado físico seleccionado (EXCELENTE/USADO)
          imagenes: formData.imagenes,
          especificacion: formData.especificacion,
          disponibilidad: formData.disponibilidad,
          condicion: formData.condicion || '', // Campo opcional para detalles
          vendedor_id: vendedorId,
          categoria_id: categoriaId,
          lote_id: loteId
        };
        
        console.log('📦 Datos del artículo a enviar:', articuloData);
        
        // Crear el artículo
        this.articuloService.crearArticulo(articuloData).subscribe({
          next: (nuevoArticulo) => {
            console.log('✅ Artículo creado exitosamente:', nuevoArticulo);
            this.messageService.add({
              severity: 'success', 
              summary: 'Éxito', 
              detail: 'Artículo creado exitosamente'
            });
            this.save.emit(nuevoArticulo);
            this.cerrar();
          },
          error: (error) => {
            console.error('❌ Error al crear artículo:', error);
            this.messageService.add({
              severity: 'error', 
              summary: 'Error', 
              detail: error?.error?.message || 'No se pudo crear el artículo'
            });
          },
          complete: () => {
            this.loading = false;
          }
        });
        
      } catch (error) {
        console.error('❌ Error en el proceso de creación:', error);
        this.messageService.add({
          severity: 'error', 
          summary: 'Error', 
          detail: 'Error al procesar vendedor o categoría'
        });
        this.loading = false;
      }
    } else {
      console.log('❌ Formulario inválido. Errores:');
      
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.form.controls).forEach(key => {
        const control = this.form.get(key);
        control?.markAsTouched();
        if (control?.invalid) {
          console.log(`  - ${key}:`, control.errors);
        }
      });
      
      this.messageService.add({
        severity: 'warn', 
        summary: 'Formulario incompleto', 
        detail: 'Por favor complete todos los campos requeridos'
      });
    }
  }

  /**
   * Manejar cambio en la selección de subasta
   */
  onSubastaChange(event: any): void {
    // Este método ya no es necesario ya que el reactive form maneja el cambio automáticamente
    // La lógica se ejecuta en el valueChanges del ngOnInit
  }

  /**
   * Manejar cambio en la selección de lote
   */
  onLoteChange(event: any): void {
    // Este método ya no es necesario ya que el reactive form maneja el cambio automáticamente
  }
}
