import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="text-align:center; margin-top:50px;">
      <button (click)="goLogin()">Iniciar sesión</button>
      <button (click)="goRegister()">Registrarme</button>
    </div>
  `
})
export class HomeComponent {
  constructor(private router: Router) {}

  goLogin() {
    this.router.navigate(['/login']);
  }

  goRegister() {
    this.router.navigate(['/registro']);
  }
}
