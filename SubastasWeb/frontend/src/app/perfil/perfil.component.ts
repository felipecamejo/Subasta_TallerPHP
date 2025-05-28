import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, TableModule, PaginatorModule],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss']
})

export class PerfilComponent {
  usuario = {
    nombre: 'Renzo Fernández',
    datos: 'Usuario registrado desde 2024',
    rating: 3.0,
    imagen: 'https://via.placeholder.com/150'
  };

  favoritos = [
    { id: 1, titulo: 'Artículo 1', descripcion: 'Descripción 1', imagen: 'https://via.placeholder.com/100' },
    { id: 2, titulo: 'Artículo 2', descripcion: 'Descripción 2', imagen: 'https://via.placeholder.com/100' },
    { id: 3, titulo: 'Artículo 3', descripcion: 'Descripción 3', imagen: 'https://via.placeholder.com/100' }
  ];

  compras = [
    {
      invoice: '001',
      customer: 'ACME',
      email: 'contacto@email.com',
      invoiceDate: '2025-01-01',
      dueDate: '2025-01-15',
      status: 'Pending',
      amount: '$1,200.00'
    },
    {
      invoice: '002',
      customer: 'John Doe Ltd.',
      email: 'facturas@cliente.com',
      invoiceDate: '2025-02-10',
      dueDate: '2025-02-20',
      status: 'Paid',
      amount: '$3,400.00'
    },
    {
      invoice: '003',
      customer: 'Company Name',
      email: 'invoice@empresa.com',
      invoiceDate: '2025-03-12',
      dueDate: '2025-03-22',
      status: 'Paid',
      amount: '$4,000.00'
    }
  ];

  ventas = [
    {
      invoice: '010',
      customer: 'Cliente 1',
      email: 'cliente1@email.com',
      invoiceDate: '2025-04-01',
      dueDate: '2025-04-10',
      status: 'Paid',
      amount: '$1,000.00'
    },
    {
      invoice: '011',
      customer: 'Cliente 2',
      email: 'cliente2@email.com',
      invoiceDate: '2025-04-15',
      dueDate: '2025-04-25',
      status: 'Pending',
      amount: '$2,500.00'
    }
  ];

}

