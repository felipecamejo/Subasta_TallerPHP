import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule],
  template: `
    <main class="p-4">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: []
})
export class AppComponent {}