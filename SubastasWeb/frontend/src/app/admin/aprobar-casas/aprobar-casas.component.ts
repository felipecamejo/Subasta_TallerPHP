import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-admin-aprobar-casas',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './aprobar-casas.component.html'
})
export class AdminAprobarCasasComponent implements OnInit {

  pendientes: any[] = [];
  paginacionLinks: any[] = [];
  error: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarCasasPendientes(); // carga página 1 al iniciar
  }

  cargarCasasPendientes(url: string = `${environment.apiUrl}/api/admin/usuarios-pendientes`): void {
    this.http.get<any>(url).subscribe({
      next: (res) => {
        this.pendientes = res.data;
        this.paginacionLinks = res.links;
      },
      error: (err) => {
        console.error(err);
        this.error = 'No se pudieron cargar las casas de remate pendientes.';
      }
    });
  }

  aprobarCasa(usuario_id: number): void {
    this.http.post(`${environment.apiUrl}/api/admin/aprobar-casa/${usuario_id}`, {}).subscribe({
      next: () => {
        this.pendientes = this.pendientes.filter(c => c.usuario_id !== usuario_id);
      },
      error: (err) => {
        console.error(err);
        this.error = 'No se pudo aprobar la casa.';
      }
    });
  }
}
