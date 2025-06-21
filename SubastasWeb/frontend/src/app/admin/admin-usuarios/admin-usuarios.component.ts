import { environment } from '../../../environments/environment';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

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
  usuarios: any[] = [];
  cargando = false;
  error = '';

  currentPage = 1;
  lastPage = 1;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {}

  cargarUsuarios(page: number = 1) {
    if (!this.rolSeleccionado) return;
    this.cargando = true;
    this.error = '';

    this.http.get<any>(`${environment.apiUrl}/api/admin/usuarios-por-rol?rol=${this.rolSeleccionado}&page=${page}`)
      .subscribe({
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

  eliminarUsuario(usuarioId: number) {
    if (!confirm('¿Estás seguro de que querés eliminar este usuario?')) return;

    this.http.delete(`${environment.apiUrl}/api/admin/eliminar-usuario/${usuarioId}`)
      .subscribe({
        next: () => {
          this.usuarios = this.usuarios.filter(u => u.usuario.id !== usuarioId);
        },
        error: () => {
          alert('Error al eliminar el usuario');
        }
      });
  }

  paginaAnterior() {
    if (this.currentPage > 1) {
      this.cargarUsuarios(this.currentPage - 1);
    }
  }

  paginaSiguiente() {
    if (this.currentPage < this.lastPage) {
      this.cargarUsuarios(this.currentPage + 1);
    }
  }
}
