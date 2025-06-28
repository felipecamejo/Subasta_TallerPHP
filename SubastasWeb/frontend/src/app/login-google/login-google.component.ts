import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service'; // ajustá el path si es necesario

@Component({
  selector: 'app-login-google',
  template: `<p>Procesando login con Google...</p>`,
  standalone: true
})
export class LoginGoogleComponent implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      const usuario_id = params['usuario_id'];
      const rol = params['rol'];

      if (token && usuario_id && rol) {
        this.authService.loginYRedirigir({
          token,
          usuario_id: Number(usuario_id),
          rol
        });
      } else {
        this.authService.logout(); // limpia y redirige al login
      }
    });
  }
}
