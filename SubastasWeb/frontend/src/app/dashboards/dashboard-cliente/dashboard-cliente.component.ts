import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LogoutButtonComponent } from '../../logout-button/logout-button.component';

@Component({
  standalone: true,
  selector: 'app-dashboard-cliente',
  imports: [CommonModule, LogoutButtonComponent],
  templateUrl: './dashboard-cliente.component.html',
  styleUrl: './dashboard-cliente.component.scss'
})
export class DashboardClienteComponent {
  constructor(private router: Router) {}

  irABuscador() {
    this.router.navigate(['/buscadorRemates']);
  }
}