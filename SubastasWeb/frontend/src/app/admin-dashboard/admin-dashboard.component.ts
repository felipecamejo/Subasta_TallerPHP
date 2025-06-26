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
    this.http.get(`${environment.apiUrl}/api/debug-admin`).subscribe({
      next: (res) => console.log('DEBUG ADMIN OK', res),
      error: (err) => console.error('DEBUG ADMIN ERROR', err)
    });
  }
}
