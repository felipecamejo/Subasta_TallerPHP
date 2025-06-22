import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AdminUsuariosService } from '../../../services/AdminUsuarios.service';
import { adminUsuarioDto } from '../../../models/adminUsuarioDto';

@Component({
  selector: 'app-admin-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-usuarios.component.html',
  styleUrls: ['./admin-usuarios.component.scss']
})
export class AdminUsuariosComponent implements OnInit {
  roles = ['cliente', 'rematador', 'casa_remate'];
  rolSeleccionado: string = '';
  usuarios: adminUsuarioDto[] = [];
  cargando = false;
  error = '';

  currentPage = 1;
  lastPage = 1;

  constructor(private adminService: AdminUsuariosService) {}

  ngOnInit(): void {}

  cargarUsuarios(page: number = 1): void {
    if (!this.rolSeleccionado) return;

    this.cargando = true;
    this.error = '';

    this.adminService.obtenerUsuariosPorRol(this.rolSeleccionado, page).subscribe({
      next: (respuesta) => {
        this.usuarios = respuesta.data;
        this.currentPage = respuesta.current_page;
        this.lastPage = respuesta.last_page;
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar los usuarios';
        this.cargando = false;
      }
    });
  }

  eliminarUsuario(usuarioId: number): void {
    if (!confirm('¿Estás seguro de que querés eliminar este usuario?')) return;

    this.adminService.eliminarUsuario(usuarioId).subscribe({
      next: () => {
        this.usuarios = this.usuarios.filter(u => u.usuario.id !== usuarioId);
      },
      error: () => {
        alert('Error al eliminar el usuario');
      }
    });
  }

  paginaAnterior(): void {
    if (this.currentPage > 1) this.cargarUsuarios(this.currentPage - 1);
  }

  paginaSiguiente(): void {
    if (this.currentPage < this.lastPage) this.cargarUsuarios(this.currentPage + 1);
  }
}
