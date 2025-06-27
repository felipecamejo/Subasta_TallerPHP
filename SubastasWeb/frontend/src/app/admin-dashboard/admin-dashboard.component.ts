import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LogoutButtonComponent } from '../logout-button/logout-button.component';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, LogoutButtonComponent, RouterModule, HttpClientModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
})
export class AdminDashboardComponent implements OnInit {
  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.probarAdmin();
  }

  probarAdmin(): void {
    const url = `${environment.apiUrl}/api/debug-admin`;
    console.log('[DEBUG ADMIN] Iniciando petición a:', url);

    this.http.get(url).subscribe({
      next: (res) => {
        console.log('[DEBUG ADMIN ✅ OK]', res);
      },
      error: (err) => {
        console.error('[DEBUG ADMIN ❌ ERROR]');
        console.error('Status:', err.status);
        console.error('StatusText:', err.statusText);
        console.error('Error:', err.error);
        console.error('Headers:', err.headers);
        console.error('Full error object:', err);
      }
    });
  }
}
