import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-desaprobar-casas',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './desaprobar-casas.component.html',
})
export class DesaprobarCasasComponent implements OnInit {
  activas: any[] = [];
  paginacionLinks: any[] = [];
  error: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarActivas();
  }

  cargarActivas(url: string = `${environment.apiUrl}/api/admin/casas-activas`): void {
    this.http.get<any>(url).subscribe({
      next: res => {
        this.activas = res.data;
        this.paginacionLinks = res.links;
      },
      error: err => {
        this.error = 'Error al cargar casas activas.';
        console.error(err);
      }
    });
  }

  desactivarCasa(usuarioId: number): void {
    this.http.post(`${environment.apiUrl}/api/admin/desaprobar-casa/${usuarioId}`, {}).subscribe({
      next: () => {
        this.activas = this.activas.filter(c => c.usuario_id !== usuarioId);
      },
      error: err => {
        this.error = 'Error al desactivar casa.';
        console.error(err);
      }
    });
  }
}
