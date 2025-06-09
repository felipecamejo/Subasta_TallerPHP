import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogoutButtonComponent } from '../../logout-button/logout-button.component';

@Component({
  standalone: true,
  selector: 'app-dashboard-rematador',
  imports: [CommonModule, LogoutButtonComponent],
  templateUrl: './dashboard-rematador.component.html',
  styleUrl: './dashboard-rematador.component.scss'
})
export class DashboardRematadorComponent { }