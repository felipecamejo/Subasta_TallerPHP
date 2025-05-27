// src/app/estadisticas/estadisticas.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms'; // necesario para [(ngModel)]

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [CommonModule, DropdownModule, TableModule, CheckboxModule, FormsModule],
  templateUrl: './estadisticas.component.html',
  styleUrls: ['./estadisticas.component.scss']
})
export class EstadisticasComponent {

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
}
