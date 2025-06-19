import { environment } from '../../environments/environment';
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common'; 

@Component({
  selector: 'app-admin-casas-remate',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-casas-remate.component.html',
})
export class AdminCasasRemateComponent implements OnInit {
  pendientes: any[] = [];
  activas: any[] = [];
  error: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarPendientes();
    this.cargarActivas();
  }

  cargarPendientes() {
    this.http.get<any[]>('${environment.apiUrl}/api/admin/usuarios-pendientes').subscribe({
      next: data => {
        this.pendientes = data;
      },
      error: err => {
        this.error = 'Error al cargar casas pendientes.';
        console.error(err);
      }
    });
  }

  cargarActivas() {
    this.http.get<any[]>('${environment.apiUrl}/api/admin/casas-activas').subscribe({
      next: data => {
        this.activas = data;
      },
      error: err => {
        this.error = 'Error al cargar casas activas.';
        console.error(err);
      }
    });
  }

  aprobarCasa(id: number) {
    this.http.post(`${environment.apiUrl}/api/admin/aprobar-casa/${id}`, {}).subscribe({
      next: () => {
        this.cargarPendientes();
        this.cargarActivas();
      },
      error: err => {
        this.error = 'Error al aprobar casa.';
        console.error(err);
      }
    });
  }

 desactivarCasa(id: number) {
  this.http.post(`${environment.apiUrl}/api/admin/desaprobar-casa/${id}`, {}).subscribe({
    next: () => {
      this.cargarPendientes();
      this.cargarActivas();
    },
    error: err => {
      this.error = 'Error al desactivar casa.';
      console.error(err);
    }
  });
}
}
