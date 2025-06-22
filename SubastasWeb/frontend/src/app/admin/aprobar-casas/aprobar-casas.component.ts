import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

import { AdminUsuariosService } from '../../../services/AdminUsuarios.service';
import { adminCasaRemateDto } from '../../../models/adminCasaRemateDto';

@Component({
  selector: 'app-admin-aprobar-casas',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './aprobar-casas.component.html'
})
export class AdminAprobarCasasComponent implements OnInit {

  pendientes: adminCasaRemateDto[] = [];
  paginacionLinks: any[] = [];
  error: string = '';
  currentPage = 1;
  lastPage = 1;

  constructor(private adminService: AdminUsuariosService) {}

  ngOnInit(): void {
    this.cargarCasasPendientes();
  }

  cargarCasasPendientes(page: number = 1): void {
    this.adminService.getCasasPendientes(page).subscribe({
      next: (res) => {
        this.pendientes = res.data;
        this.paginacionLinks = res.links;
        this.currentPage = res.current_page;
        this.lastPage = res.last_page;
      },
      error: (err) => {
        console.error(err);
        this.error = 'No se pudieron cargar las casas de remate pendientes.';
      }
    });
  }

  aprobarCasa(usuario_id: number): void {
    this.adminService.aprobarCasa(usuario_id).subscribe({
      next: () => {
        this.pendientes = this.pendientes.filter(c => c.usuario_id !== usuario_id);
      },
      error: (err) => {
        console.error(err);
        this.error = 'No se pudo aprobar la casa.';
      }
    });
  }

  paginaAnterior() {
    if (this.currentPage > 1) this.cargarCasasPendientes(this.currentPage - 1);
  }

  paginaSiguiente() {
    if (this.currentPage < this.lastPage) this.cargarCasasPendientes(this.currentPage + 1);
  }
}
