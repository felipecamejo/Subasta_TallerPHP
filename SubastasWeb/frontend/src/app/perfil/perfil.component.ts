import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { ActivatedRoute } from '@angular/router';
import { ClienteService } from '../../services/cliente.service';
import { RematadorService } from '../../services/rematador.service';
import { clienteDto } from '../../models/clienteDto';
import { rematadorDto } from '../../models/rematadorDto';
import { subastaDto } from '../../models/subastaDto';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, TableModule, PaginatorModule],
  providers: [DatePipe],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss']
})
export class PerfilComponent implements OnInit {
  cliente?: clienteDto;
  rematador?: rematadorDto;

  constructor(
    private route: ActivatedRoute,
    private clienteService: ClienteService,
    private rematadorService: RematadorService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      const usuario_id = +params['id'];

      this.clienteService.seleccionarCliente(usuario_id).subscribe({
        next: (data) => {
          if (typeof data === 'string') {
            this.cliente = undefined;
          } else {
            this.cliente = data;
          }
        },
        error: () => this.cliente = undefined
      });

      this.rematadorService.seleccionarRematador(usuario_id).subscribe({
        next: (data) => {
          if (typeof data === 'string') {
            this.rematador = undefined;
          } else {
            this.rematador = data;
          }
        },
        error: () => this.rematador = undefined
      });
    });
  }

  favoritos = [
    { id: 1, titulo: 'Artículo 1', descripcion: 'Descripción 1', imagen: 'https://via.placeholder.com/100' },
    { id: 2, titulo: 'Artículo 2', descripcion: 'Descripción 2', imagen: 'https://via.placeholder.com/100' },
    { id: 3, titulo: 'Artículo 3', descripcion: 'Descripción 3', imagen: 'https://via.placeholder.com/100' }
  ];
}

