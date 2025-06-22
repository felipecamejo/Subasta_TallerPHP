import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

import { AdminUsuariosService } from '../../../services/AdminUsuarios.service';
import { adminCasaRemateDto } from '../../../models/adminCasaRemateDto';

@Component({
  selector: 'app-desaprobar-casas',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './desaprobar-casas.component.html',
})
export class DesaprobarCasasComponent implements OnInit {
  activas: adminCasaRemateDto[] = [];
  paginacionLinks: any[] = [];
  error: string = '';
  currentPage = 1;
  lastPage = 1;

  constructor(private adminService: AdminUsuariosService) {}

  ngOnInit(): void {
    this.cargarActivas();
  }

  cargarActivas(page: number = 1): void {
    this.adminService.getCasasAprobadas(page).subscribe({
      next: (res) => {
        this.activas = res.data;
        this.paginacionLinks = res.links;
        this.currentPage = res.current_page;
        this.lastPage = res.last_page;
      },
      error: (err) => {
        this.error = 'Error al cargar casas activas.';
        console.error(err);
      }
    });
  }

  desactivarCasa(usuarioId: number): void {
    this.adminService.desaprobarCasa(usuarioId).subscribe({
      next: () => {
        this.activas = this.activas.filter(c => c.usuario_id !== usuarioId);
      },
      error: (err) => {
        this.error = 'Error al desactivar casa.';
        console.error(err);
      }
    });
  }

  paginaAnterior(): void {
    if (this.currentPage > 1) this.cargarActivas(this.currentPage - 1);
  }

  paginaSiguiente(): void {
    if (this.currentPage < this.lastPage) this.cargarActivas(this.currentPage + 1);
  }
}
