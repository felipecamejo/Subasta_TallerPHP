import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { LogoutButtonComponent } from '../logout-button/logout-button.component';

@Component({
  selector: 'app-casa-remate-dashboard',
  standalone: true, 
  imports: [CommonModule, LogoutButtonComponent],
  templateUrl: './casa-remate-dashboard.component.html',
  styleUrls: ['./casa-remate-dashboard.component.scss']
})
export class CasaRemateDashboardComponent {
  constructor(private router: Router) {}

  logout() {
    localStorage.clear(); // Borra todo lo relacionado al login
    this.router.navigate(['/login']); // Redirige al login
  }
 
  irACasaRemate() {
  this.router.navigate(['/casa-remates']);
  }
}

