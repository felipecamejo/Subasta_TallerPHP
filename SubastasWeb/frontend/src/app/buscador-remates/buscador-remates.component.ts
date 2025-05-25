import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-buscador-remates',
  standalone: true,
  imports: [ButtonModule, DropdownModule, FormsModule],
  templateUrl: './buscador-remates.component.html',
  styleUrl: './buscador-remates.component.scss'
})
export class BuscadorRematesComponent {
  
  cities = [
    { name: 'Santiago', code: 'STG' },
    { name: 'Valparaíso', code: 'VLP' },
    { name: 'Concepción', code: 'CCP' }
  ];

  selectedCity: any = null;
}
