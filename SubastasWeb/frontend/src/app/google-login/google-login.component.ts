import { environment } from '../../environments/environment';
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
    const url = `${environment.apiUrl}/auth/redirect/google?rol=cliente`; // por defecto cliente
    window.location.href = url;
  }
}
