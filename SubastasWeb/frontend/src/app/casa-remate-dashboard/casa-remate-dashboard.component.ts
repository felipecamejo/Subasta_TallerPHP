import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-casa-remate-dashboard',
  imports: [],
  templateUrl: './casa-remate-dashboard.component.html',
  styleUrl: './casa-remate-dashboard.component.scss'
})
export class CasaRemateDashboardComponent {
  constructor(private router: Router) {}

  logout() {
    localStorage.clear(); // Borra todo lo relacionado al login
    this.router.navigate(['/login']); // Redirige al login
  }

}
