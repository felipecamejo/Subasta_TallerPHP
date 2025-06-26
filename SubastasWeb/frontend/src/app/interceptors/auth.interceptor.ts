import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../../services/auth.service'; // Verifica que la ruta sea correcta

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();
    const isApiUrl = req.url.startsWith('http://localhost:8000'); // Reemplaza por tu URL base

    if (token && isApiUrl) {
      const authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`  // Asegúrate de que el token esté correctamente formateado
        }
      });
      return next.handle(authReq);
    }

    return next.handle(req);
  }
}
