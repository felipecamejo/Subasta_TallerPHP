import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-google-login',
  imports: [CommonModule],
  templateUrl: './google-login.component.html',
})
export class GoogleLoginComponent {
  loginConGoogle() {
    const url = `http://localhost:8000/auth/redirect/google?rol=cliente`; // por defecto cliente
    window.location.href = url;
  }
}
