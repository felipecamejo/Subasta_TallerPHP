import { Component } from '@angular/core';

@Component({
  selector: 'app-testeo',
  standalone: true,
  template: `<h1>Componente cargado correctamente</h1>`,
})
export class TesteoComponent {
  constructor() {
    console.log('🟢 Componente Testeo cargado');
  }
}
