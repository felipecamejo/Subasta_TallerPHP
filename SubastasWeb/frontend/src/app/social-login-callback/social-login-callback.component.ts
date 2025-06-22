import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, AuthData } from '../../services/auth.service';

@Component({
  selector: 'app-social-login-callback',
  template: `<p>Procesando login...</p>`
})
export class SocialLoginCallbackComponent implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      const rol = params['rol'];
      const usuario_id = parseInt(params['usuario_id'], 10);

      if (token && rol && !isNaN(usuario_id)) {
        const authData: AuthData = {
          token,
          rol,
          usuario_id
        };
        this.authService.loginYRedirigir(authData);
      } else {
        this.router.navigate(['/login']);
      }
    });
  }
}
