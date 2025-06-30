import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login-google',
  standalone: true,
  templateUrl: './login-google.component.html',
  styleUrls: ['./login-google.component.scss']
})
export class LoginGoogleComponent implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      const usuario_id = Number(params['usuario_id']);
      const rol = params['rol'];

      if (token && !isNaN(usuario_id) && rol) {
        this.authService.loginYRedirigir({
          token,
          usuario_id,
          rol
        });
      } else {
        this.authService.logout(); // limpia sesión y redirige al login
      }
    });
  }
}