import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  imports: [],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent {
  constructor(private router: Router) {}

  logout() {
    localStorage.clear(); // Borra todo lo relacionado al login
    this.router.navigate(['/login']); // Redirige al login
  }
}
