import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-producto-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './subir-producto.component.html',
  styleUrls: ['./subir-producto.component.scss']
})
export class SubirProductoComponent {
  imagenPrincipal: string = 'https://via.placeholder.com/300x200';
  miniaturas: string[] = [
    'https://via.placeholder.com/100',
    'https://via.placeholder.com/100?text=2'
  ];

  producto = {
    incremento: null,
    entrega: ''
  };

  cambiarImagen(url: string): void {
    this.imagenPrincipal = url;
  }

  subir(): void {
    console.log('Producto enviado:', this.producto);
    // Aquí agregarías lógica para enviar a tu API
  }

  cancelar(): void {
    console.log('Formulario cancelado');
    // Podrías redirigir o limpiar campos
  }
}

