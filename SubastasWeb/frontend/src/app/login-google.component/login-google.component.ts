import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-login-google',
  template: `<p>Cargando...</p>`,
})
export class LoginGoogleComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return; // Solo ejecutar en el navegador

    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      const usuario_id = params['usuario_id'];
      const rol = params['rol'];

      if (token && usuario_id && rol) {
        localStorage.setItem('token', token);
        localStorage.setItem('usuario_id', usuario_id);
        localStorage.setItem('rol', rol);

        if (rol === 'cliente') {
          this.router.navigate(['/dashboard-cliente']);
        } else if (rol === 'rematador') {
          this.router.navigate(['/dashboard-rematador']);
        }
      } else {
        this.router.navigate(['/login']);
      }
    });
  }
}
