import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-login-google',
  template: `<p>Procesando login con Google...</p>`,
  standalone: true
})
export class LoginGoogleComponent implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      const usuario_id = params['usuario_id'];
      const rol = params['rol'];

      if (token && usuario_id && rol) {
        localStorage.setItem('token', token);
        localStorage.setItem('usuario_id', usuario_id);
        localStorage.setItem('rol', rol);

        switch (rol) {
          case 'cliente':
            this.router.navigate(['/dashboard-cliente']);
            break;
          case 'rematador':
            this.router.navigate(['/dashboard-rematador']);
            break;
          case 'casa_remate':
            this.router.navigate(['/dashboard-casa-remate']);
            break;
          default:
            this.router.navigate(['/']);
        }
      } else {
        // Si faltan datos, redirige al login
        this.router.navigate(['/login']);
      }
    });
  }
}
