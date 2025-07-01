import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms'; 
import { CasaRematesService } from '../../services/casa-remates.service';
import { casaRemateDto } from '../../models/casaRemateDto';

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [CommonModule, DropdownModule, TableModule, CheckboxModule, FormsModule],
  templateUrl: './estadisticas.component.html',
  styleUrls: ['./estadisticas.component.scss']
})
export class EstadisticasComponent {
  // ACA PUEDO DECLARAR LAS VARIABLES QUE NECESITO PARA EL COMPONENTE
  listaCasaRemates: casaRemateDto[] = [];
  title: string = 'Casa de Remates';

  constructor(
    private _service: CasaRematesService,
  ) { }

  ngOnInit(){
    // aca inicas las cosas que queres mostrar ni bien carga el componente
    this.getCasaRemates();
  }
  
  getCasaRemates() {
    this._service.getCasaRemates().subscribe({
      next: (data: any) => {
        this.listaCasaRemates = data.list;
      },
      error: (response: any) => {
        //this._alertService.showError(`Error al obtener ${this.title}, ${response.message}`);
      }
    });
  }

  subastas = [
      {
        selected: true,
        invoice: 'IN/1001/23',
        customer: 'ACME',
        email: 'contact@email.com',
        invoiceDate: '2022-01-23',
        dueDate: '2022-02-07',
        status: 'Unpaid',
        amount: '$2,350.00'
      },
      {
        selected: true,
        invoice: 'IN/1002/23',
        customer: 'John Doe Ltd.',
        email: 'finance@johndoe.com',
        invoiceDate: '2022-01-09',
        dueDate: '2022-01-21',
        status: 'Pending',
        amount: '$259.00'
      },
      {
        selected: false,
        invoice: 'IN/1003/23',
        customer: 'Company Name',
        email: 'invoice@company.com',
        invoiceDate: '2022-02-11',
        dueDate: '2022-02-24',
        status: 'Paid',
        amount: '$1,259.00'
      }
    ];

    /* Variables Generales
  

  //FormGroup
  filtersForm: FormGroup | undefined;

  //Paginator
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  length: number | undefined;

  

  ngOnInit() {
    this.getList();
    this.initform();
  }

  

  changePage(event: { pageSize: number; pageIndex: number; }) {
    this.filters.limit = event.pageSize;
    this.filters.offset = event.pageIndex * event.pageSize;
    this.getList();
  }

  initform() {
    this.filtersForm = new FormGroup({
      nombre: new FormControl(''),
      activo: new FormControl(-1)
    });

    this.filtersForm.get('nombre')!.valueChanges.subscribe(data => this.filters.filters.nombre = data);
    this.filtersForm.get('activo')!.valueChanges.subscribe(data => this.filters.filters.activo = this.transFormReverseBoolean.transform(data));
  }

  aplyFilters() {
    if (this.filtersForm!.dirty) {
      this.getList();
    }
  }

  clearFilters() {
    this.filtersForm!.reset();
    this.filters = new GeneralRequest(new GeneralFilters());
    this.getList();
  }

  newElement() {
    const dialogRef = this._dialog.open(ArticulosModalComponent, {
      autoFocus: false,
      width: '700px'
    });

    dialogRef.afterClosed().subscribe(
      (data) => {
        if (data && data.error === false) {
          this._alertService.showSuccess(data.text);
          this.getList();
        }
        if (data && data.error === true) {
          this._alertService.showError(data.text);
        }
      }
    );
  }

  editElement(evt: Tema) {
    const dialogRef = this._dialog.open(ArticulosModalComponent, {
      autoFocus: false,
      data: {
        editModel: evt
      },
      width: '700px'
    });

    dialogRef.afterClosed().subscribe(
      (data) => {
        if (data && data.error === false) {
          this._alertService.showSuccess(data.text);
          this.getList();
        }
        if (data && data.error === true) {
          this._alertService.showError(data.text);
        }
      }
    );
  }*/
}
