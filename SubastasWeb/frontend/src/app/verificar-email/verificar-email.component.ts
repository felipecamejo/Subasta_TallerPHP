import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-verificar-email',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './verificar-email.component.html',
  styleUrls: ['./verificar-email.component.scss']
})
export class VerificarEmailComponent {
  constructor(private router: Router) {}

  irAlLogin(): void {
    this.router.navigate(['/login']);
  }
}
