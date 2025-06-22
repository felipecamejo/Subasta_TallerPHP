import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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
      const usuarioId = params['usuario_id'];
      const rol = params['rol'];

      if (token && usuarioId && rol) {
        this.authService.loginYRedirigir({
          token,
          rol,
          usuario_id: Number(usuarioId)
        });
      } else {
        this.authService.logout();
      }
    });
  }
}
