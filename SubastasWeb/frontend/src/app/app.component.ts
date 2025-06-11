import { Component } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  template: `
    <app-header *ngIf="!isAuthRoute()"></app-header>
    <main class="p-4">
      <router-outlet></router-outlet>
    </main>
    <app-footer *ngIf="!isAuthRoute()"></app-footer>
  `,
  styles: []
})
export class AppComponent {
  constructor(private router: Router) {}

  isAuthRoute(): boolean {
    return this.router.url.includes('login') || this.router.url.includes('register');
  }
}